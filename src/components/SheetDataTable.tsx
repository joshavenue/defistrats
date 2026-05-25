import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SimpleTableFilter, SimpleFilterConfig } from './SimpleTableFilter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, Trash2, Edit3, Download, Link } from 'lucide-react';
import { isLSTStrategy, getDisplayAssetName } from '@/lib/strategyUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StakingAsset {
  id: string;
  asset: string;
  symbol: string;
  apy: number;
  tvl: number | null;
  risk_level: 'low' | 'medium' | 'high';
  protocol: string;
  chain: string | null;
  featured: boolean;
  asset1_logo: string | null;
  asset2_logo: string | null;
  asset1_name: string | null;
  asset2_name: string | null;
  strategy_type: string | null;
  logo: string | null;
  status?: 'draft' | 'published';
  cta_link: string | null;
}

interface APYTVLConfig {
  id: string;
  asset_id: string;
  target_website: string;
  target_asset1: string;
  apy_field_name: string;
  tvl_field_name: string;
  tvl_suffix?: string;
  wait_delay_seconds?: number;
  scraping_interval_hours: number;
  is_active: boolean;
  last_scraped_at?: string;
  apy_text_pattern?: string;
  tvl_text_pattern?: string;
  apy_context_before?: string;
  apy_context_after?: string;
  tvl_context_before?: string;
  tvl_context_after?: string;
}

interface EditedAsset extends StakingAsset {
  _edited?: boolean;
}

type BulkAction =
  | 'publish'
  | 'draft'
  | 'feature'
  | 'unfeature'
  | 'risk-low'
  | 'risk-medium'
  | 'risk-high';

interface SheetDataTableProps {
  onEdit: (id: string) => void;
  className?: string;
  showFilters?: boolean;
  onBatchFetch?: () => Promise<void>;
  isBatchFetching?: boolean;
}

export const SheetDataTable: React.FC<SheetDataTableProps> = ({
  onEdit,
  className = '',
  showFilters = true,
  onBatchFetch,
  isBatchFetching = false
}) => {
  const [editedAssets, setEditedAssets] = useState<Record<string, EditedAsset>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | ''>('');
  const [currentCell, setCurrentCell] = useState<{ row: string; field: string } | null>(null);
  const [filters, setFilters] = useState<SimpleFilterConfig>({
    protocol: [],
    strategy: [],
    risk: [],
    fetcher: []
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'protocol' | 'apy' | 'tvl' | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'desc'
  });

  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: fetchedAssets = [],
    isLoading
  } = useQuery({
    queryKey: ['staking-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staking_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StakingAsset[];
    }
  });

  const { data: apyTvlConfigs = [] } = useQuery({
    queryKey: ['apy-tvl-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apy_tvl_configs')
        .select('*');
      if (error) throw error;
      return data as APYTVLConfig[];
    }
  });

  const hasActiveFetcher = (assetId: string) => {
    return apyTvlConfigs.some(config => config.asset_id === assetId && config.is_active);
  };

  const getTVLSuffix = (assetId: string) => {
    const config = apyTvlConfigs.find(config => config.asset_id === assetId && config.is_active);
    return config?.tvl_suffix;
  };

  // Initialize edited assets when data loads
  useEffect(() => {
    if (fetchedAssets.length > 0) {
      const initialEdited: Record<string, EditedAsset> = {};
      fetchedAssets.forEach(asset => {
        initialEdited[asset.id] = { ...asset, _edited: false };
      });
      setEditedAssets(initialEdited);
    }
  }, [fetchedAssets]);

  const handleCellEdit = (assetId: string, field: keyof StakingAsset, value: string | number | boolean | null) => {
    setEditedAssets(prev => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        [field]: value,
        _edited: true
      }
    }));
  };

  const hasChanges = () => {
    return Object.values(editedAssets).some(asset => asset._edited);
  };

  const discardChanges = () => {
    const reset: Record<string, EditedAsset> = {};
    fetchedAssets.forEach(asset => {
      reset[asset.id] = { ...asset, _edited: false };
    });
    setEditedAssets(reset);
    setSelectedRows(new Set());
    toast({
      title: "Changes Discarded",
      description: "All changes have been reverted"
    });
  };

  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.values(editedAssets)
        .filter(asset => asset._edited)
        .map(asset => {
          const { _edited, ...data } = asset;
          return data;
        });

      for (const asset of updates) {
        const { error } = await supabase
          .from('staking_assets')
          .update(asset)
          .eq('id', asset.id);
        if (error) throw error;
      }

      return updates.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['staking-assets'] });
      toast({
        title: "Success",
        description: `${count} assets updated successfully`
      });
      setSelectedRows(new Set());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async () => {
      const idsToDelete = Array.from(selectedRows);
      const { error } = await supabase
        .from('staking_assets')
        .delete()
        .in('id', idsToDelete);
      if (error) throw error;
      return idsToDelete.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['staking-assets'] });
      toast({
        title: "Success",
        description: `${count} assets deleted successfully`
      });
      setSelectedRows(new Set());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete selected assets",
        variant: "destructive"
      });
    }
  });

  const getBulkUpdate = (action: BulkAction): {
    updates: Partial<Pick<StakingAsset, 'status' | 'featured' | 'risk_level'>>;
    label: string;
  } => {
    switch (action) {
      case 'publish':
        return { updates: { status: 'published' }, label: 'published' };
      case 'draft':
        return { updates: { status: 'draft' }, label: 'moved to draft' };
      case 'feature':
        return { updates: { featured: true }, label: 'marked as featured' };
      case 'unfeature':
        return { updates: { featured: false }, label: 'unmarked as featured' };
      case 'risk-low':
        return { updates: { risk_level: 'low' }, label: 'set to low risk' };
      case 'risk-medium':
        return { updates: { risk_level: 'medium' }, label: 'set to medium risk' };
      case 'risk-high':
        return { updates: { risk_level: 'high' }, label: 'set to high risk' };
    }
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async (action: BulkAction) => {
      const idsToUpdate = Array.from(selectedRows);
      if (idsToUpdate.length === 0) {
        throw new Error('No rows selected');
      }

      const { updates, label } = getBulkUpdate(action);
      const { error } = await supabase
        .from('staking_assets')
        .update(updates)
        .in('id', idsToUpdate);
      if (error) throw error;
      return { idsToUpdate, updates, label };
    },
    onSuccess: ({ idsToUpdate, updates, label }) => {
      queryClient.invalidateQueries({ queryKey: ['staking-assets'] });
      setEditedAssets(prev => {
        const next = { ...prev };
        idsToUpdate.forEach(id => {
          if (next[id]) {
            next[id] = { ...next[id], ...updates, _edited: false };
          }
        });
        return next;
      });
      toast({
        title: "Success",
        description: `${idsToUpdate.length} assets ${label}`
      });
      setSelectedRows(new Set());
      setBulkAction('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply bulk edit",
        variant: "destructive"
      });
    }
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentCell) return;

    const assets = Object.values(editedAssets);
    const currentIndex = assets.findIndex(a => a.id === currentCell.row);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentCell({
            row: assets[currentIndex - 1].id,
            field: currentCell.field
          });
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < assets.length - 1) {
          setCurrentCell({
            row: assets[currentIndex + 1].id,
            field: currentCell.field
          });
        }
        break;
      case 'Tab': {
        e.preventDefault();
        const fields = ['protocol', 'apy', 'tvl', 'cta_link', 'status', 'featured'];
        const currentFieldIndex = fields.indexOf(currentCell.field);
        if (e.shiftKey) {
          if (currentFieldIndex > 0) {
            setCurrentCell({
              row: currentCell.row,
              field: fields[currentFieldIndex - 1]
            });
          }
        } else {
          if (currentFieldIndex < fields.length - 1) {
            setCurrentCell({
              row: currentCell.row,
              field: fields[currentFieldIndex + 1]
            });
          }
        }
        break;
      }
      case 'Enter':
        e.preventDefault();
        if (currentIndex < assets.length - 1) {
          setCurrentCell({
            row: assets[currentIndex + 1].id,
            field: currentCell.field
          });
        }
        break;
    }
  }, [currentCell, editedAssets]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectAll = () => {
    if (selectedRows.size === Object.keys(editedAssets).length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(Object.keys(editedAssets)));
    }
  };

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const renderSortIcon = (isActive: boolean, direction: 'asc' | 'desc') => {
    const rotation = isActive && direction === 'desc' ? 'rotate-180' : '';
    return (
      <img
        src="https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/73a5e4627e0b27c712e63575ff20fa16d1dbd58b?placeholderIfAbsent=true"
        alt="Sort indicator"
        className={`aspect-[1] object-contain w-3 transition-transform ${rotation} ${isActive ? 'opacity-100' : 'opacity-50'}`}
      />
    );
  };

  const handleSort = (key: 'protocol' | 'apy' | 'tvl') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedAssets = React.useMemo(() => {
    const assets = Object.values(editedAssets);
    if (!sortConfig.key) return assets;

    return [...assets].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'protocol':
          aValue = a.protocol;
          bValue = b.protocol;
          break;
        case 'apy':
          aValue = a.apy;
          bValue = b.apy;
          break;
        case 'tvl':
          aValue = a.tvl || 0;
          bValue = b.tvl || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        const numA = aValue as number;
        const numB = bValue as number;
        if (sortConfig.direction === 'asc') {
          return numA - numB;
        } else {
          return numB - numA;
        }
      }
    });
  }, [editedAssets, sortConfig]);

  if (isLoading) {
    return <div className="text-[#F7F7F7] text-center py-8">Loading...</div>;
  }

  return (
    <div className={`border border-[#22262F] shadow-sm w-full overflow-hidden bg-[#0C0E12] rounded-xl ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-[#22262F] p-4 flex flex-wrap items-center justify-between gap-3 bg-[#0F1117]">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => saveChangesMutation.mutate()}
            disabled={!hasChanges()}
            className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90 font-semibold flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </Button>
          <Button
            onClick={discardChanges}
            disabled={!hasChanges()}
            variant="outline"
            className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Discard
          </Button>
          {selectedRows.size > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as BulkAction)}>
                  <SelectTrigger className="h-9 w-44 bg-[#22262F] border-[#373A41] text-[#CECFD2]">
                    <SelectValue placeholder="Bulk edit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">Publish</SelectItem>
                    <SelectItem value="draft">Move to draft</SelectItem>
                    <SelectItem value="feature">Mark featured</SelectItem>
                    <SelectItem value="unfeature">Unmark featured</SelectItem>
                    <SelectItem value="risk-low">Set risk low</SelectItem>
                    <SelectItem value="risk-medium">Set risk medium</SelectItem>
                    <SelectItem value="risk-high">Set risk high</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => bulkAction && bulkUpdateMutation.mutate(bulkAction)}
                  disabled={!bulkAction || bulkUpdateMutation.isPending}
                  variant="outline"
                  className="border-[#75E0A7]/50 text-[#75E0A7] hover:bg-[#75E0A7]/10 bg-transparent flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  Apply ({selectedRows.size})
                </Button>
              </div>
              <Button
                onClick={() => {
                  if (window.confirm(`Delete ${selectedRows.size} selected items?`)) {
                    deleteSelectedMutation.mutate();
                  }
                }}
                disabled={deleteSelectedMutation.isPending}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected ({selectedRows.size})
              </Button>
            </>
          )}
          {onBatchFetch && (
            <Button
              onClick={onBatchFetch}
              disabled={isBatchFetching}
              variant="outline"
              className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent flex items-center gap-2"
            >
              <Download size={16} />
              {isBatchFetching ? 'Fetching...' : 'Fetch APY & TVL'}
            </Button>
          )}
        </div>
        <div className="text-sm text-[#94979C]">
          {hasChanges() && `${Object.values(editedAssets).filter(a => a._edited).length} unsaved changes`}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="border-b border-[#22262F]">
          <SimpleTableFilter
            data={fetchedAssets.map(asset => ({
              ...asset,
              hasActiveFetcher: hasActiveFetcher(asset.id)
            }))}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#22262F] bg-[#0C0E12]">
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === Object.keys(editedAssets).length && Object.keys(editedAssets).length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-[#373A41] bg-[#22262F]"
                />
              </th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C] cursor-pointer hover:bg-[#0F1117]" onClick={() => handleSort('protocol')}>
                <div className="flex items-center gap-1">
                  Protocol
                  {renderSortIcon(sortConfig.key === 'protocol', sortConfig.direction)}
                </div>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C]">Assets</th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C] cursor-pointer hover:bg-[#0F1117]" onClick={() => handleSort('apy')}>
                <div className="flex items-center gap-1">
                  APY
                  {renderSortIcon(sortConfig.key === 'apy', sortConfig.direction)}
                </div>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C] cursor-pointer hover:bg-[#0F1117]" onClick={() => handleSort('tvl')}>
                <div className="flex items-center gap-1">
                  TVL
                  {renderSortIcon(sortConfig.key === 'tvl', sortConfig.direction)}
                </div>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C]">
                <div className="flex items-center gap-1">
                  <Link size={12} />
                  Ref Link
                </div>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C]">Status</th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C]">Featured</th>
              <th className="p-3 text-left text-xs font-semibold text-[#94979C]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map(asset => (
              <tr
                key={asset.id}
                className={`border-b border-[#22262F] hover:bg-[#0F1117] ${asset._edited ? 'bg-[#1A1D24]' : ''} ${selectedRows.has(asset.id) ? 'bg-[#22262F]' : ''}`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(asset.id)}
                    onChange={() => handleRowSelect(asset.id)}
                    className="rounded border-[#373A41] bg-[#22262F]"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={asset.logo || asset.asset1_logo || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true"}
                      alt={`${asset.protocol} logo`}
                      className="w-8 h-8 rounded-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true") {
                          target.src = "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true";
                        }
                      }}
                    />
                    <Input
                      value={asset.protocol}
                      onChange={(e) => handleCellEdit(asset.id, 'protocol', e.target.value)}
                      className={`bg-transparent border-0 text-[#F7F7F7] focus:bg-[#22262F] focus:border focus:border-[#75E0A7] h-8 ${currentCell?.row === asset.id && currentCell?.field === 'protocol' ? 'bg-[#22262F] border border-[#75E0A7]' : ''}`}
                      onFocus={() => setCurrentCell({ row: asset.id, field: 'protocol' })}
                    />
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`relative ${isLSTStrategy(asset.strategy_type) ? 'w-[44px]' : 'w-[70px]'} h-[44px] flex items-center`}>
                      <img
                        src={asset.asset1_logo || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true"}
                        alt="Asset 1"
                        className="absolute left-0 w-8 h-8 rounded-full border-2 border-[#0C0E12] z-10"
                      />
                      {asset.asset2_logo && !isLSTStrategy(asset.strategy_type) && (
                        <img
                          src={asset.asset2_logo || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true"}
                          alt="Asset 2"
                          className="absolute left-6 w-8 h-8 rounded-full border-2 border-[#0C0E12]"
                        />
                      )}
                    </div>
                    <span className="text-[#F7F7F7] text-sm leading-[20px]">
                      {getDisplayAssetName(asset)}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {hasActiveFetcher(asset.id) && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="APY & TVL Fetcher Active" />
                    )}
                    <Input
                      type="number"
                      value={asset.apy}
                      onChange={(e) => handleCellEdit(asset.id, 'apy', parseFloat(e.target.value) || 0)}
                      className={`bg-transparent border-0 text-[#17B26A] focus:bg-[#22262F] focus:border focus:border-[#75E0A7] h-8 w-20 ${currentCell?.row === asset.id && currentCell?.field === 'apy' ? 'bg-[#22262F] border border-[#75E0A7]' : ''}`}
                      step="0.01"
                      min="0"
                      onFocus={() => setCurrentCell({ row: asset.id, field: 'apy' })}
                    />
                    <span className="text-[#17B26A]">%</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {hasActiveFetcher(asset.id) && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="APY & TVL Fetcher Active" />
                    )}
                    <Input
                      type="number"
                      value={asset.tvl || 0}
                      onChange={(e) => handleCellEdit(asset.id, 'tvl', parseFloat(e.target.value) || 0)}
                      className={`bg-transparent border-0 text-[#94979C] focus:bg-[#22262F] focus:border focus:border-[#75E0A7] h-8 w-32 ${currentCell?.row === asset.id && currentCell?.field === 'tvl' ? 'bg-[#22262F] border border-[#75E0A7]' : ''}`}
                      step="1"
                      min="0"
                      onFocus={() => setCurrentCell({ row: asset.id, field: 'tvl' })}
                    />
                    <span className="text-[#94979C]">
                      {getTVLSuffix(asset.id) || '$'}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <Input
                    type="url"
                    value={asset.cta_link || ''}
                    onChange={(e) => handleCellEdit(asset.id, 'cta_link', e.target.value)}
                    className={`bg-transparent border-0 text-[#94979C] focus:bg-[#22262F] focus:border focus:border-[#75E0A7] h-8 w-48 ${currentCell?.row === asset.id && currentCell?.field === 'cta_link' ? 'bg-[#22262F] border border-[#75E0A7]' : ''}`}
                    placeholder="https://example.com/ref"
                    onFocus={() => setCurrentCell({ row: asset.id, field: 'cta_link' })}
                  />
                </td>
                <td className="p-3">
                  <Select
                    value={asset.status || 'published'}
                    onValueChange={(value) => handleCellEdit(asset.id, 'status', value)}
                  >
                    <SelectTrigger className={`w-28 h-8 bg-transparent border-0 focus:bg-[#22262F] focus:border focus:border-[#75E0A7] ${currentCell?.row === asset.id && currentCell?.field === 'status' ? 'bg-[#22262F] border border-[#75E0A7]' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <Switch
                    checked={asset.featured}
                    onCheckedChange={(checked) => handleCellEdit(asset.id, 'featured', checked)}
                    className="text-teal-500 bg-emerald-700 hover:bg-emerald-600"
                  />
                </td>
                <td className="p-3">
                  <Button
                    onClick={() => onEdit(asset.id)}
                    variant="ghost"
                    size="sm"
                    className="text-[#94979C] hover:text-[#F7F7F7] hover:bg-[#22262F]"
                  >
                    <Edit3 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
