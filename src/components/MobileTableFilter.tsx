import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { SimpleTableFilter, SimpleFilterConfig } from './SimpleTableFilter';
import { Button } from './ui/button';

interface FilterableItem {
  id: string;
  protocol: string | { name: string; iconSrc?: string };
  strategy_type?: string | null;
  risk_level?: string | null;
  risk?: 'low' | 'medium' | 'high';
  strategyType?: string;
  logo?: string | null;
  asset1_logo?: string | null;
}

interface MobileTableFilterProps {
  data: FilterableItem[];
  filters: SimpleFilterConfig;
  onFiltersChange: (filters: SimpleFilterConfig) => void;
  className?: string;
}

export const MobileTableFilter: React.FC<MobileTableFilterProps> = ({
  data,
  filters,
  onFiltersChange,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasActiveFilters = Object.values(filters).some(filterArray => filterArray.length > 0);
  const activeFilterCount = Object.values(filters).reduce((total, filterArray) => total + filterArray.length, 0);

  return (
    <div className={`bg-[#0C0E12] border-b border-[#22262F] ${className}`}>
      {/* Mobile Filter Toggle */}
      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-10 bg-[#0C0E12] border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="text-sm font-medium">
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#17B26A] text-[#0C0E12] text-xs rounded-full font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {/* Expandable Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <SimpleTableFilter
            data={data}
            filters={filters}
            onFiltersChange={onFiltersChange}
            className="border-0 bg-transparent p-0"
          />
        </div>
      )}
    </div>
  );
};