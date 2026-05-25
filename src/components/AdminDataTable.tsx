import React, { useState, useMemo, useCallback } from 'react';
import { SimpleRiskBadge } from './RiskBadge';
import { TagBadge } from './TagBadge';
import { AdminActionButtons } from './AdminActionButtons';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { SimpleTableFilter, SimpleFilterConfig } from './SimpleTableFilter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Check, X } from 'lucide-react';
import { getDisplayAssetName, isLSTStrategy } from '@/lib/strategyUtils';
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
interface AdminDataTableProps {
  onEdit: (id: string) => void;
  className?: string;
  showFilters?: boolean;
}
interface EditState {
  id: string;
  field: 'apy' | 'tvl';
  value: string;
}
export const AdminDataTable: React.FC<AdminDataTableProps> = ({
  onEdit,
  className = '',
  showFilters = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [editState, setEditState] = useState<EditState | null>(null);
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
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    data: fetchedAssets = [],
    isLoading
  } = useQuery({
    queryKey: ['staking-assets'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('staking_assets').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as StakingAsset[];
    }
  });

  // Fetch APY/TVL configs for all assets
  const {
    data: apyTvlConfigs = []
  } = useQuery({
    queryKey: ['apy-tvl-configs'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('apy_tvl_configs').select('*');
      if (error) throw error;
      return data as APYTVLConfig[];
    }
  });

  // Helper function to check if asset has active fetcher
  const hasActiveFetcher = useCallback((assetId: string) => {
    return apyTvlConfigs.some(config => config.asset_id === assetId && config.is_active);
  }, [apyTvlConfigs]);

  // Helper function to get TVL suffix for asset
  const getTVLSuffix = useCallback((assetId: string) => {
    const config = apyTvlConfigs.find(config => config.asset_id === assetId && config.is_active);
    return config?.tvl_suffix;
  }, [apyTvlConfigs]);

  // Apply filters first
  const filteredAssets = useMemo(() => {
    if (!fetchedAssets || fetchedAssets.length === 0) return [];

    return fetchedAssets.filter(item => {
      // Protocol filter
      const protocolName = typeof item.protocol === 'string' ? item.protocol : '';
      if (filters.protocol.length > 0 && !filters.protocol.includes(protocolName)) {
        return false;
      }

      // Strategy filter
      const strategyName = item.strategy_type || '';
      if (filters.strategy.length > 0 && !filters.strategy.includes(strategyName)) {
        return false;
      }

      // Risk level filter
      const riskLevel = item.risk_level || '';
      if (filters.risk.length > 0 && !filters.risk.includes(riskLevel)) {
        return false;
      }

      // APY/TVL Fetcher filter
      if (filters.fetcher.length > 0) {
        const hasActiveFetcherConfig = hasActiveFetcher(item.id);
        const fetcherType = hasActiveFetcherConfig ? 'Live' : 'Manual';
        if (!filters.fetcher.includes(fetcherType)) {
          return false;
        }
      }

      return true;
    });
  }, [fetchedAssets, filters, hasActiveFetcher]);

  // Sorting logic
  const stakingAssets = useMemo(() => {
    const assetsToSort = filteredAssets as StakingAsset[];
    if (!sortConfig.key || assetsToSort.length === 0) {
      return assetsToSort;
    }
    return [...assetsToSort].sort((a, b) => {
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
        // Alphabetical sorting for protocol
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        // Numeric sorting for APY and TVL
        const numA = aValue as number;
        const numB = bValue as number;
        if (sortConfig.direction === 'asc') {
          return numA - numB;
        } else {
          return numB - numA;
        }
      }
    });
  }, [filteredAssets, sortConfig]);
  const handleSort = (key: 'protocol' | 'apy' | 'tvl') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  const updateFieldMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value
    }: {
      id: string;
      field: 'apy' | 'tvl';
      value: number;
    }) => {
      const updateData = {
        [field]: value
      };
      const {
        error
      } = await supabase.from('staking_assets').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staking-assets']
      });
      toast({
        title: "Success",
        description: "Value updated successfully"
      });
      setEditState(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update value",
        variant: "destructive"
      });
    }
  });
  const updateFeaturedMutation = useMutation({
    mutationFn: async ({
      id,
      featured
    }: {
      id: string;
      featured: boolean;
    }) => {
      const {
        error
      } = await supabase.from('staking_assets').update({
        featured
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staking-assets']
      });
      toast({
        title: "Success",
        description: "Featured status updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive"
      });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('staking_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staking-assets']
      });
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  });
  const handleEditStart = (id: string, field: 'apy' | 'tvl', currentValue: number | null) => {
    setEditState({
      id,
      field,
      value: currentValue?.toString() || '0'
    });
  };
  const handleEditSave = () => {
    if (!editState) return;
    const numValue = parseFloat(editState.value);
    if (isNaN(numValue) || numValue < 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }
    updateFieldMutation.mutate({
      id: editState.id,
      field: editState.field,
      value: numValue
    });
  };
  const handleEditCancel = () => {
    setEditState(null);
  };
  const handleFeaturedToggle = (id: string, featured: boolean) => {
    updateFeaturedMutation.mutate({
      id,
      featured
    });
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  const handleNext = () => {
    setCurrentPage(prev => prev + 1);
  };
  const formatTags = (asset: StakingAsset) => {
    const tags = [];
    if (asset.strategy_type) tags.push({
      text: asset.strategy_type,
      variant: 'secondary' as const
    });
    if (asset.chain) tags.push({
      text: asset.chain,
      variant: 'tertiary' as const
    });
    return tags;
  };
  const isEditing = (id: string, field: 'apy' | 'tvl') => {
    return editState?.id === id && editState?.field === field;
  };
  const renderSortIcon = (isActive: boolean, direction: 'asc' | 'desc') => {
    const rotation = isActive && direction === 'desc' ? 'rotate-180' : '';
    return <img src="https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/73a5e4627e0b27c712e63575ff20fa16d1dbd58b?placeholderIfAbsent=true" alt="Sort indicator" className={`aspect-[1] object-contain w-3 transition-transform ${rotation} ${isActive ? 'opacity-100' : 'opacity-50'}`} />;
  };
  if (isLoading) {
    return <div className="text-[#F7F7F7] text-center py-8">Loading...</div>;
  }
  return <div className={`border border-[color:var(--Colors-Border-border-secondary,#22262F)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] w-full overflow-hidden bg-[#0C0E12] rounded-xl border-solid max-md:max-w-full ${className}`}>
      {/* Filters */}
      {showFilters && <div className="border-b border-[#22262F]">
          <SimpleTableFilter data={fetchedAssets.map(asset => ({
            ...asset,
            hasActiveFetcher: hasActiveFetcher(asset.id)
          }))} filters={filters} onFiltersChange={setFilters} />
        </div>}

      <div className="overflow-x-auto">
      <div className="flex min-w-[1120px] w-full font-medium flex-nowrap max-md:max-w-full px-[16px]">
        {/* Protocol Icon Column */}
        <div className="text-[#F7F7F7] w-[80px] shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold whitespace-nowrap pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5 cursor-pointer hover:bg-[#0F1117] transition-colors" onClick={() => handleSort('protocol')}>
            <div className="flex items-center gap-1">
              <span className="text-[#94979C] text-xs leading-[18px)]">Protocol</span>
              {renderSortIcon(sortConfig.key === 'protocol', sortConfig.direction)}
            </div>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 leading-none pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid px-0">
              <img src={asset.logo || asset.asset1_logo || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true"} alt={`${asset.protocol} logo`} className="w-8 h-8 rounded-full object-contain" onError={e => {
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true") {
              target.src = "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true";
            }
          }} />
            </div>)}
        </div>

        {/* Company Column */}
        <div className="min-w-44 text-[#F7F7F7] flex-1 shrink basis-[0%]">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold whitespace-nowrap pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5">
            <span className="text-[#94979C] text-xs leading-[18px)]">Assets</span>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 leading-none pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid px-0">
              <div className={`relative ${isLSTStrategy(asset.strategy_type) ? 'w-[44px]' : 'w-[70px]'} h-[44px] flex items-center`}>
                <img src={asset.asset1_logo || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true"} alt="Asset 1" className="absolute left-0 w-8 h-8 rounded-full border-2 border-[#0C0E12] z-10" />
                {asset.asset2_logo && !isLSTStrategy(asset.strategy_type) && <img src={asset.asset2_logo || "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/60f68463b2a1d46f9dc95a722922a671f1a93774?placeholderIfAbsent=true"} alt="Asset 2" className="absolute left-6 w-8 h-8 rounded-full border-2 border-[#0C0E12]" />}
              </div>
              <span className="text-[#F7F7F7] text-sm leading-[20px)]">
                {getDisplayAssetName(asset)}
              </span>
            </div>)}
        </div>

        {/* Risk Column */}
        <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[87px] shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-[#94979C] font-semibold pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5">
            <span className="text-[#94979C] text-xs leading-[18px)]">Risk</span>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
              <SimpleRiskBadge level={asset.risk_level} className="self-stretch my-auto" />
            </div>)}
        </div>

        {/* Tag Column */}
        <div className="text-xs w-fit shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-[#94979C] font-semibold whitespace-nowrap pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5">
            <span className="text-[#94979C] text-xs leading-[18px)]">Tag</span>
          </div>
          {stakingAssets.map(asset => {
          const tags = formatTags(asset);
          return <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
                <div className="self-stretch flex gap-1 my-auto">
                  {tags.length > 0 && <TagBadge text={tags[0].text} variant={tags[0].variant} />}
                  {tags.length > 1 && <span className="text-[#94979C] text-xs self-center">
                      (+{tags.length - 1})
                    </span>}
                </div>
              </div>;
        })}
          
          {/* Pagination for Tag Column */}
          <div className="border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px] flex items-center justify-center px-[16px]">
          </div>
        </div>

        {/* APY Column */}
        <div className="text-[#17B26A] font-normal whitespace-nowrap w-[120px] shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5 cursor-pointer hover:bg-[#0F1117] transition-colors" onClick={() => handleSort('apy')}>
            <div className="flex items-center gap-1">
              <span className="text-[#94979C] text-xs leading-[18px)]">APY</span>
              {renderSortIcon(sortConfig.key === 'apy', sortConfig.direction)}
            </div>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="border-b-[color:var(--Colors-Border-border-secondary,#22262F)] min-h-[72px] w-full pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] border-b border-solid max-md:px-5 flex items-center justify-between">
              {isEditing(asset.id, 'apy') ? <div className="flex items-center gap-2 w-full">
                  <Input type="number" value={editState?.value || ''} onChange={e => setEditState(prev => prev ? {
              ...prev,
              value: e.target.value
            } : null)} className="w-16 h-8 text-sm bg-[#22262F] border-[#373A41] text-[#17B26A]" step="0.01" min="0" />
                  <button onClick={handleEditSave} className="text-[#17B26A] hover:text-[#0F9D58] p-1">
                    <Check size={14} />
                  </button>
                  <button onClick={handleEditCancel} className="text-[#FF6B6B] hover:text-[#E55A5A] p-1">
                    <X size={14} />
                  </button>
                </div> : <div className="flex items-center gap-2 group">
                  {hasActiveFetcher(asset.id) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="APY & TVL Fetcher Active" />
                  )}
                  <span className="text-[#17B26A] text-sm leading-none">
                    {asset.apy}%
                  </span>
                  <button onClick={() => handleEditStart(asset.id, 'apy', asset.apy)} className="opacity-0 group-hover:opacity-100 text-[#94979C] hover:text-[#F7F7F7] transition-opacity p-1">
                    <Edit3 size={12} />
                  </button>
                </div>}
            </div>)}
          
          {/* Pagination for APY Column */}
          <div className="border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px] flex items-center justify-center px-[16px]">
          </div>
        </div>

        {/* TVL Column */}
        <div className="text-[#94979C] font-normal w-[220px] shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:pl-5 cursor-pointer hover:bg-[#0F1117] transition-colors" onClick={() => handleSort('tvl')}>
            <div className="flex items-center gap-1">
              <span className="text-[#94979C] text-xs leading-[18px)]">TVL</span>
              {renderSortIcon(sortConfig.key === 'tvl', sortConfig.direction)}
            </div>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="border-b-[color:var(--Colors-Border-border-secondary,#22262F)] min-h-[72px] w-full pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] border-b border-solid max-md:px-5 flex items-center justify-between">
              {isEditing(asset.id, 'tvl') ? <div className="flex items-center gap-2 w-full">
                  <Input type="number" value={editState?.value || ''} onChange={e => setEditState(prev => prev ? {
              ...prev,
              value: e.target.value
            } : null)} className="w-24 h-8 text-sm bg-[#22262F] border-[#373A41] text-[#94979C]" step="1" min="0" />
                  <button onClick={handleEditSave} className="text-[#17B26A] hover:text-[#0F9D58] p-1">
                    <Check size={14} />
                  </button>
                  <button onClick={handleEditCancel} className="text-[#FF6B6B] hover:text-[#E55A5A] p-1">
                    <X size={14} />
                  </button>
                </div> : <div className="flex items-center gap-2 group">
                  {hasActiveFetcher(asset.id) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="APY & TVL Fetcher Active" />
                  )}
                  <span className="text-[#94979C] text-sm leading-none">
                    {(() => {
                      const suffix = getTVLSuffix(asset.id);
                      if (suffix) {
                        return `${asset.tvl?.toLocaleString() || '0'} ${suffix}`;
                      } else {
                        return `$${asset.tvl?.toLocaleString() || '0'}`;
                      }
                    })()}
                  </span>
                  <button onClick={() => handleEditStart(asset.id, 'tvl', asset.tvl)} className="opacity-0 group-hover:opacity-100 text-[#94979C] hover:text-[#F7F7F7] transition-opacity p-1">
                    <Edit3 size={12} />
                  </button>
                </div>}
            </div>)}
          
          {/* Pagination for TLV Column */}
          <div className="border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px] flex items-center justify-center px-[16px]">
          </div>
        </div>

        {/* Status Column */}
        <div className="font-semibold leading-none w-[100px] shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5">
            <span className="text-[#94979C] text-xs leading-[18px)]">Status</span>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(asset.status || 'published') === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                {(asset.status || 'published') === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>)}
          
          {/* Pagination for Status Column */}
          <div className="border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px] flex items-center justify-center px-[16px]">
          </div>
        </div>

        {/* Featured Column */}
        <div className="font-semibold leading-none w-[100px] shrink-0">
          <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid max-md:px-5">
            <span className="text-[#94979C] text-xs leading-[18px)]">Featured</span>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
              <Switch checked={asset.featured} onCheckedChange={checked => handleFeaturedToggle(asset.id, checked)} className="text-teal-500 bg-emerald-700 hover:bg-emerald-600" />
            </div>)}
          
          {/* Pagination for Featured Column */}
          <div className="border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px] flex items-center justify-center px-[16px]">
          </div>
        </div>

        {/* Actions Column */}
        <div className="font-semibold leading-none w-[120px] shrink-0 sticky right-0 z-20 bg-[#0C0E12] shadow-[-8px_0_16px_-12px_rgba(0,0,0,0.85)]">
          <div className="border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-11 w-full gap-3 text-xs text-[#94979C] font-semibold pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] bg-[#0C0E12] py-[12px)] border-b border-solid px-0">
            <span className="text-[#94979C] text-xs leading-[18px)]">Actions</span>
          </div>
          {stakingAssets.map(asset => <div key={asset.id} className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
              <AdminActionButtons onEdit={() => onEdit(asset.id)} onDelete={() => handleDelete(asset.id)} />
            </div>)}
          
          {/* Pagination for Actions Column */}
          <div className="border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px] flex items-center justify-center px-[16px]">
          </div>
        </div>
      </div>
      
      {/* Pagination Row */}
      <div className="flex min-w-[1120px] w-full border-t-[color:var(--Colors-Border-border-secondary,#22262F)] border-t border-solid min-h-[72px]">
        {/* Protocol Icon Pagination */}
        <div className="w-[80px] shrink-0 flex items-center px-[16px]"></div>
        
        {/* Company Pagination */}
        <div className="min-w-44 flex-1 shrink basis-[0%] flex items-center px-[16px]">
          <div className="flex gap-3 font-semibold whitespace-nowrap">
            <button onClick={handlePrevious} disabled={currentPage === 1} className="justify-center items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 overflow-hidden pr-[var(--spacing-lg,] pl-[var(--spacing-lg,] bg-[#0C0E12] py-[8px)] rounded-lg border-solid disabled:opacity-50 hover:bg-[#22262F] transition-colors">
              <span className="text-[#CECFD2] text-sm leading-[20px)]">Previous</span>
            </button>
            <button onClick={handleNext} className="justify-center items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 overflow-hidden pr-[var(--spacing-lg,] pl-[var(--spacing-lg,] bg-[#0C0E12] py-[8px)] rounded-lg border-solid hover:bg-[#22262F] transition-colors">
              <span className="text-[#CECFD2] text-sm leading-[20px)]">Next</span>
            </button>
          </div>
        </div>
        
        {/* Risk Pagination */}
        <div className="w-[87px] shrink-0 flex items-center justify-center px-[16px]"></div>
        
        {/* Tag Pagination */}
        <div className="w-fit shrink-0 flex items-center justify-center px-[16px]"></div>
        
        {/* APY Pagination */}
        <div className="w-[120px] shrink-0 flex items-center justify-center px-[16px]"></div>
        
        {/* TLV Pagination */}
        <div className="w-[220px] shrink-0 flex items-center justify-center px-[16px]"></div>
        
        {/* Status Pagination */}
        <div className="w-[100px] shrink-0 flex items-center justify-center px-[16px]"></div>
        
        {/* Featured Pagination */}
        <div className="w-[100px] shrink-0 flex items-center justify-center px-[16px]"></div>
        
        {/* Actions Pagination */}
        <div className="w-[120px] shrink-0 flex items-center justify-center px-[16px] sticky right-0 z-20 bg-[#0C0E12] shadow-[-8px_0_16px_-12px_rgba(0,0,0,0.85)]">
          <div className="text-[#CECFD2] text-sm font-medium leading-[20px)]">
            Page {currentPage}
          </div>
        </div>
      </div>
      </div>
    </div>;
};
