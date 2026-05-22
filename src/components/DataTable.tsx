
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTableHeader } from "./DataTableHeader";
import { ModalDataTableRow } from "./ModalDataTableRow";
import { StrategyModal } from "./StrategyModal";
import { DataTablePagination } from "./DataTablePagination";
import { MobileDataCard } from "./MobileDataCard";
import { SimpleTableFilter, SimpleFilterConfig, applySimpleTableFilters } from "./SimpleTableFilter";
import { MobileTableFilter } from "./MobileTableFilter";
import { useStakingAssets, TableRow } from '@/hooks/useStakingAssets';
import { useTableSorting } from '@/hooks/useTableSorting';

interface DataTableProps {
  data?: TableRow[];
  className?: string;
  showFilters?: boolean;
}

// Helper functions to manage URL state
const serializeFilters = (filters: SimpleFilterConfig, page?: number): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.protocol.length > 0) params.set('protocol', filters.protocol.join(','));
  if (filters.strategy.length > 0) params.set('strategy', filters.strategy.join(','));
  if (filters.risk.length > 0) params.set('risk', filters.risk.join(','));
  if (filters.fetcher.length > 0) params.set('fetcher', filters.fetcher.join(','));
  if (page && page > 1) params.set('page', page.toString());
  return params;
};

const deserializeFilters = (searchParams: URLSearchParams): SimpleFilterConfig => {
  return {
    protocol: searchParams.get('protocol')?.split(',').filter(Boolean) || [],
    strategy: searchParams.get('strategy')?.split(',').filter(Boolean) || [],
    risk: searchParams.get('risk')?.split(',').filter(Boolean) || [],
    fetcher: searchParams.get('fetcher')?.split(',').filter(Boolean) || [],
  };
};

export const DataTable: React.FC<DataTableProps> = ({
  data,
  className = "",
  showFilters = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStrategy, setSelectedStrategy] = useState<TableRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize state from URL parameters
  const [filters, setFilters] = useState<SimpleFilterConfig>(() => 
    deserializeFilters(searchParams)
  );
  
  const [currentPage, setCurrentPage] = useState(() => 
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Custom filter setter that also updates URL
  const updateFilters = useCallback((newFilters: SimpleFilterConfig) => {
    setFilters(newFilters);
    const newParams = serializeFilters(newFilters, currentPage);
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams, currentPage]);

  // Custom page setter that also updates URL
  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
    const newParams = serializeFilters(filters, page);
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams, filters]);

  // Update state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlFilters = deserializeFilters(searchParams);
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    setFilters(urlFilters);
    setCurrentPage(urlPage);
  }, [searchParams]);
  const totalPages = 10;

  // Fetch assets from Supabase
  const { data: stakingAssets, isLoading, error } = useStakingAssets();
  
  console.log('🎯 DataTable - isLoading:', isLoading);
  console.log('🎯 DataTable - stakingAssets:', stakingAssets);
  console.log('🎯 DataTable - error:', error);
  console.log('🎯 DataTable - data prop:', data);
  
  // Use sorting functionality
  const { sortConfig, sortedRows, handleSort } = useTableSorting(data ?? stakingAssets);
  
  // Apply filters to sorted data
  const filteredAndSortedRows = useMemo(() => {
    const filtered = applySimpleTableFilters(sortedRows, filters);
    console.log('🎯 DataTable - sortedRows:', sortedRows);
    console.log('🎯 DataTable - filteredAndSortedRows:', filtered);
    return filtered;
  }, [sortedRows, filters]);

  const handlePrevious = () => {
    const newPage = Math.max(1, currentPage - 1);
    updateCurrentPage(newPage);
  };
  
  const handleNext = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    updateCurrentPage(newPage);
  };
  

  const handleViewDetails = (strategy: TableRow) => {
    setSelectedStrategy(strategy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStrategy(null);
  };

  // Show a loading indicator
  if (isLoading) {
    return (
      <div
        className={`border border-[color:var(--Colors-Border-border-secondary,#22262F)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] w-full overflow-hidden bg-[#0C0E12] rounded-xl border-solid max-md:max-w-full ${className}`}
      >
        <div className="text-[#F7F7F7] text-center py-8">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        className={`border border-[color:var(--Colors-Border-border-secondary,#22262F)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] w-full overflow-hidden bg-[#0C0E12] rounded-xl border-solid max-md:max-w-full ${className}`}
      >
        <div className="text-red-400 text-center py-8">Error loading data: {error.message}</div>
      </div>
    );
  }

  // Show empty state
  if (!filteredAndSortedRows || filteredAndSortedRows.length === 0) {
    return (
      <div
        className={`border border-[color:var(--Colors-Border-border-secondary,#22262F)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] w-full overflow-hidden bg-[#0C0E12] rounded-xl border-solid max-md:max-w-full ${className}`}
      >
        <div className="text-[#94979C] text-center py-8">
          No strategies found. {stakingAssets?.length ? `Found ${stakingAssets.length} total assets but none match filters.` : 'No assets in database.'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-[color:var(--Colors-Border-border-secondary,#22262F)] shadow-[0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] w-full bg-[#0C0E12] rounded-xl border-solid ${className}`}
    >
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden">
        {/* Filters */}
        {showFilters && (
          <div className="border-b border-[#22262F]">
            <SimpleTableFilter 
              data={data ?? stakingAssets}
              filters={filters}
              onFiltersChange={updateFilters}
              hideFetcherFilter={true}
            />
          </div>
        )}
        
        <DataTableHeader sortConfig={sortConfig} onSort={handleSort} />
        {(filteredAndSortedRows as TableRow[]).map((row) => (
          <ModalDataTableRow
            key={row.id}
            row={row}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {/* Mobile Filters */}
        {showFilters && (
          <MobileTableFilter 
            data={data ?? stakingAssets}
            filters={filters}
            onFiltersChange={updateFilters}
          />
        )}
        
        <div className="p-4 border-b border-[#22262F]">
          <h3 className="text-[#F7F7F7] text-sm font-semibold">Staking Assets</h3>
        </div>
        <div className="space-y-4 p-4">
          {(filteredAndSortedRows as TableRow[]).map((row) => (
            <MobileDataCard key={row.id} row={row} onViewDetails={handleViewDetails} />
          ))}
        </div>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      {/* Strategy Modal */}
      <StrategyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        strategy={selectedStrategy}
      />
    </div>
  );
};
