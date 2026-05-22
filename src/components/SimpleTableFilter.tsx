
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export interface SimpleFilterConfig {
  protocol: string[];
  strategy: string[];
  risk: string[];
  fetcher: string[];
}

interface FilterableItem {
  id: string;
  protocol: string | { name: string; iconSrc?: string };
  strategy_type?: string | null;
  risk_level?: string | null;
  risk?: 'low' | 'medium' | 'high';
  strategyType?: string;
  logo?: string | null;
  asset1_logo?: string | null;
  hasActiveFetcher?: boolean;
}

export interface SimpleTableFilterProps {
  data: FilterableItem[];
  filters: SimpleFilterConfig;
  onFiltersChange: (filters: SimpleFilterConfig) => void;
  className?: string;
  hideFetcherFilter?: boolean;
}

const RISK_LEVELS = ['low', 'medium', 'high'];
const FETCHER_TYPES = ['Live', 'Manual', 'Show All'];

export const SimpleTableFilter: React.FC<SimpleTableFilterProps> = ({
  data,
  filters,
  onFiltersChange,
  className = "",
  hideFetcherFilter = false,
}) => {
  const [availableOptions, setAvailableOptions] = useState({
    protocols: [] as Array<{ name: string; icon: string }>,
    strategies: [] as string[],
    riskLevels: RISK_LEVELS,
    fetcherTypes: FETCHER_TYPES,
  });

  // Extract unique values from data for filter options
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Create protocol map to avoid duplicates and include icons
    const protocolMap = new Map<string, string>();
    
    data.forEach(item => {
      let protocolName: string;
      let protocolIcon: string;
      
      if (typeof item.protocol === 'string') {
        protocolName = item.protocol;
        // For admin data, use logo field
        protocolIcon = item.logo || item.asset1_logo || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
      } else {
        protocolName = item.protocol?.name || '';
        // For table data, use iconSrc from protocol object
        protocolIcon = item.protocol?.iconSrc || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true';
      }
      
      if (protocolName && !protocolMap.has(protocolName)) {
        protocolMap.set(protocolName, protocolIcon);
      }
    });
    
    const protocols = Array.from(protocolMap.entries())
      .map(([name, icon]) => ({ name, icon }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const strategies = [...new Set(data.map(item => 
      item.strategy_type || item.strategyType || ''
    ).filter(Boolean))];

    setAvailableOptions({
      protocols,
      strategies: strategies.sort(),
      riskLevels: RISK_LEVELS,
      fetcherTypes: FETCHER_TYPES,
    });
  }, [data]);

  const handleFilterChange = (filterType: keyof SimpleFilterConfig, value: string) => {
    const newFilters = { ...filters };
    
    if (newFilters[filterType].includes(value)) {
      // Remove filter if already selected
      newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
    } else {
      // Add filter if not selected
      newFilters[filterType] = [...newFilters[filterType], value];
    }
    
    onFiltersChange(newFilters);
  };

  const removeFilter = (filterType: keyof SimpleFilterConfig, value: string) => {
    const newFilters = { ...filters };
    newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      protocol: [],
      strategy: [],
      risk: [],
      fetcher: [],
    });
  };

  const hasActiveFilters = Object.values(filters).some(filterArray => filterArray.length > 0);

  const renderActiveFilters = () => {
    const activeFilters: Array<{ type: keyof SimpleFilterConfig; value: string; label: string; icon?: string }> = [];

    Object.entries(filters).forEach(([filterType, filterValues]) => {
      filterValues.forEach(value => {
        const labels = {
          protocol: 'Protocol',
          strategy: 'Strategy',
          risk: 'Risk',
          fetcher: 'APY/TVL Fetcher',
        };
        
        let icon: string | undefined;
        if (filterType === 'protocol') {
          // Find the icon for this protocol
          const protocolOption = availableOptions.protocols.find(p => p.name === value);
          icon = protocolOption?.icon;
        }
        
        activeFilters.push({
          type: filterType as keyof SimpleFilterConfig,
          value,
          label: `${labels[filterType as keyof SimpleFilterConfig]}: ${value}`,
          icon,
        });
      });
    });

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {activeFilters.map((filter, index) => (
          <div
            key={`${filter.type}-${filter.value}-${index}`}
            className="flex items-center gap-1 px-2 py-1 bg-[#22262F] border border-[#373A41] rounded-md text-xs text-[#CECFD2] max-w-full"
          >
            {filter.icon && (
              <img 
                src={filter.icon} 
                alt={`${filter.value} logo`}
                className="w-3 h-3 rounded-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true") {
                    target.src = "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true";
                  }
                }}
              />
            )}
            <span>{filter.label}</span>
            <button
              onClick={() => removeFilter(filter.type, filter.value)}
              className="p-0.5 hover:bg-[#373A41] rounded"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="h-7 text-xs bg-[#0C0E12] border-[#373A41] text-[#94979C] hover:bg-[#22262F] hover:text-[#F7F7F7]"
        >
          Clear All
        </Button>
      </div>
    );
  };

  const renderFilterSelect = (
    filterType: keyof SimpleFilterConfig,
    options: string[] | Array<{ name: string; icon: string }>,
    placeholder: string
  ) => (
    <div className="relative">
      <Select onValueChange={(value) => handleFilterChange(filterType, value)}>
        <SelectTrigger className="w-full sm:w-[140px] h-9 bg-[#0C0E12] border-[#373A41] text-[#CECFD2] text-xs hover:bg-[#22262F] hover:border-[#94979C] transition-colors">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-[#22262F] border-[#373A41] text-[#CECFD2]">
          {filterType === 'protocol' 
            ? (options as Array<{ name: string; icon: string }>).map((option) => (
                <SelectItem 
                  key={option.name} 
                  value={option.name}
                  className="text-xs focus:bg-[#373A41] focus:text-[#F7F7F7] hover:bg-[#373A41]"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={option.icon} 
                      alt={`${option.name} logo`}
                      className="w-4 h-4 rounded-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true") {
                          target.src = "https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true";
                        }
                      }}
                    />
                    <span>{option.name}</span>
                  </div>
                </SelectItem>
              ))
            : (options as string[]).map((option) => (
                <SelectItem 
                  key={option} 
                  value={option}
                  className="text-xs focus:bg-[#373A41] focus:text-[#F7F7F7] hover:bg-[#373A41]"
                >
                  {option}
                </SelectItem>
              ))
          }
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className={`p-4 ${className.includes('border-0') ? '' : 'bg-[#0C0E12] border border-[#22262F] rounded-lg'}`}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <span className="text-[#94979C] text-sm font-medium">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {renderFilterSelect('protocol', availableOptions.protocols, 'Protocol')}
            {renderFilterSelect('strategy', availableOptions.strategies, 'Strategy')}
            {renderFilterSelect('risk', availableOptions.riskLevels, 'Risk Level')}
            {!hideFetcherFilter && renderFilterSelect('fetcher', availableOptions.fetcherTypes, 'APY/TVL Fetcher')}
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 bg-[#0C0E12] border-[#373A41] text-[#94979C] hover:bg-[#22262F] hover:text-[#F7F7F7] text-xs sm:w-auto w-full"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {renderActiveFilters()}
    </div>
  );
};

// Utility function to filter data based on active filters
export const applySimpleTableFilters = (data: FilterableItem[], filters: SimpleFilterConfig): FilterableItem[] => {
  if (!data || data.length === 0) return [];

  return data.filter(item => {
    // Protocol filter
    const protocolName = typeof item.protocol === 'string' ? item.protocol : item.protocol?.name || '';
    if (filters.protocol.length > 0 && !filters.protocol.includes(protocolName)) {
      return false;
    }

    // Strategy filter
    const strategyName = item.strategy_type || item.strategyType || '';
    if (filters.strategy.length > 0 && !filters.strategy.includes(strategyName)) {
      return false;
    }

    // Risk level filter
    const riskLevel = item.risk_level || item.risk || '';
    if (filters.risk.length > 0 && !filters.risk.includes(riskLevel)) {
      return false;
    }

    // Fetcher filter - updated logic
    if (filters.fetcher.length > 0) {
      const hasShowAll = filters.fetcher.includes('Show All');
      
      // If "Show All" is selected, don't filter by fetcher status
      if (hasShowAll) {
        return true;
      }
      
      const hasLive = filters.fetcher.includes('Live');
      const hasManual = filters.fetcher.includes('Manual');
      const isLive = item.hasActiveFetcher === true;
      const isManual = item.hasActiveFetcher !== true;
      
      // Return true if item matches any selected fetcher type
      const matchesFilter = (hasLive && isLive) || (hasManual && isManual);
      
      if (!matchesFilter) {
        return false;
      }
    }

    return true;
  });
};
