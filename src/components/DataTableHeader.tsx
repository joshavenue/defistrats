
import React from "react";

interface DataTableHeaderProps {
  sortConfig: {
    key: 'protocol' | null;
    direction: 'asc' | 'desc';
  };
  onSort: (key: 'protocol') => void;
  showFilters?: boolean;
  filterComponent?: React.ReactNode;
}

interface ColumnConfig {
  key: string;
  label: string;
  width: string;
  sortable?: boolean;
  sortKey?: 'protocol';
}

const COLUMNS: ColumnConfig[] = [
  { key: 'protocol', label: 'Protocol', width: 'w-[80px]', sortable: true, sortKey: 'protocol' },
  { key: 'assets', label: 'Assets', width: 'w-[200px]' },
  { key: 'earn', label: 'Earn', width: 'w-[150px]' },
  { key: 'points', label: 'Points', width: 'w-[80px]' },
  { key: 'risk', label: 'Risk', width: 'w-[80px]' },
  { key: 'tag', label: 'Tag', width: 'w-[120px]' },
  { key: 'actions', label: '', width: 'w-[100px]' },
];

const BASE_CELL_STYLES = "items-center flex min-h-11 w-full gap-3 bg-[#0C0E12] pr-5 max-md:pr-5";
const HEADER_TEXT_STYLES = "text-[#94979C] text-xs leading-[18px] font-semibold";

export const DataTableHeader: React.FC<DataTableHeaderProps> = ({ 
  sortConfig, 
  onSort, 
  showFilters = false, 
  filterComponent 
}) => {
  const renderSortIcon = (column: ColumnConfig) => {
    const isActive = column.sortKey && sortConfig.key === column.sortKey;
    const rotation = isActive && sortConfig.direction === 'desc' ? 'rotate-180' : '';
    
    return (
      <img
        src="https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/73a5e4627e0b27c712e63575ff20fa16d1dbd58b?placeholderIfAbsent=true"
        alt="Sort indicator"
        className={`aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto transition-transform ${rotation} ${isActive ? 'opacity-100' : 'opacity-50'}`}
      />
    );
  };

  const handleColumnClick = (column: ColumnConfig) => {
    if (column.sortable && column.sortKey) {
      onSort(column.sortKey);
    }
  };

  const renderColumnContent = (column: ColumnConfig) => {
    if (column.key === 'actions') {
      return <div className={`${BASE_CELL_STYLES} pt-3 pb-6`} />;
    }

    // Special alignment for earn column - left align
    const isEarnColumn = column.key === 'earn';
    const alignmentClass = isEarnColumn ? 'justify-start' : 'items-center';
    
    const cellStyles = column.sortable 
      ? `${BASE_CELL_STYLES} py-3 whitespace-nowrap cursor-pointer hover:bg-[#0F1117] transition-colors ${alignmentClass}`
      : `${BASE_CELL_STYLES} py-3 ${alignmentClass}`;

    return (
      <div 
        className={cellStyles}
        onClick={() => handleColumnClick(column)}
      >
        {column.sortable ? (
          <div className="items-center self-stretch flex gap-1 my-auto">
            <span className={HEADER_TEXT_STYLES}>{column.label}</span>
            {renderSortIcon(column)}
          </div>
        ) : (
          <span className={HEADER_TEXT_STYLES}>{column.label}</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full font-medium flex-wrap max-md:max-w-full px-[16px] justify-between border-b border-solid border-[#22262F]">
      {COLUMNS.map((column) => (
        <div key={column.key} className={`text-xs text-[#CECFD2] whitespace-nowrap ${column.width}`}>
          {renderColumnContent(column)}
        </div>
      ))}
    </div>
  );
};
