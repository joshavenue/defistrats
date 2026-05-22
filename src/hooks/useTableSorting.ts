
import { useState, useMemo } from 'react';
import { TableRow } from './useStakingAssets';

export const useTableSorting = (data: TableRow[] = []) => {
  const [sortConfig, setSortConfig] = useState<{
    key: 'protocol' | null;
    direction: 'asc' | 'desc';
  }>({ key: 'protocol', direction: 'asc' });

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortConfig.key) {
        case 'protocol':
          aValue = a.protocol.name;
          bValue = b.protocol.name;
          break;
        default:
          return 0;
      }

      // Alphabetical sorting for protocol
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [data, sortConfig]);

  const handleSort = (key: 'protocol') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return {
    sortConfig,
    sortedRows,
    handleSort
  };
};
