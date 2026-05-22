
import React from 'react';
import { DataTable } from '@/components/DataTable';

export const DataTableSection: React.FC = () => {
  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DataTable />
      </div>
    </section>
  );
};
