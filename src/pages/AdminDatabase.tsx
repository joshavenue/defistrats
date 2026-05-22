import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import Header from '@/components/Header';
import { AdminDataTable } from '@/components/AdminDataTable';
import { SheetDataTable } from '@/components/SheetDataTable';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { FileSpreadsheet, TableIcon } from 'lucide-react';

const AdminDatabase: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'sheet'>('table');

  const handleEdit = (id: string) => {
    navigate(`/admin/add?edit=${id}`);
  };

  const handleNewItem = () => {
    navigate('/admin/add');
  };

  const handleBatchFetch = async () => {
    if ((window as any).adminTableBatchFetch) {
      return (window as any).adminTableBatchFetch();
    }
  };

  return (
    <div className="bg-[#0C0E12] min-h-screen">
      <Header />
      
      <main className="w-full pt-12 pb-24 rounded-[40px_0px_0px_40px] max-md:max-w-full">
        <section className="flex w-full flex-col items-center max-md:max-w-full">
          <div className="max-w-screen-xl w-full text-2xl text-[#F7F7F7] font-semibold leading-none pr-[var(--container-padding-desktop,] pl-[var(--container-padding-desktop,] gap-5 pt-0 pb-[32px)] max-md:max-w-full max-md:px-5">
            <div className="w-full gap-4 max-md:max-w-full">
              <div className="content-start flex-wrap flex w-full gap-[20px)_var(--spacing-xl,16px;] max-md:max-w-full justify-between items-center">
                <h1 className="text-[#F7F7F7] text-2xl leading-[32px)]">
                  Database Management
                </h1>
                <div className="flex gap-3">
                  <div className="flex gap-1 bg-[#22262F] rounded-lg p-1">
                    <Button
                      onClick={() => setViewMode('table')}
                      variant="ghost"
                      size="sm"
                      className={`${viewMode === 'table' ? 'bg-[#373A41] text-[#F7F7F7]' : 'text-[#94979C] hover:text-[#F7F7F7]'} px-3 py-1.5`}
                    >
                      <TableIcon size={16} className="mr-1.5" />
                      Table
                    </Button>
                    <Button
                      onClick={() => setViewMode('sheet')}
                      variant="ghost"
                      size="sm"
                      className={`${viewMode === 'sheet' ? 'bg-[#373A41] text-[#F7F7F7]' : 'text-[#94979C] hover:text-[#F7F7F7]'} px-3 py-1.5`}
                    >
                      <FileSpreadsheet size={16} className="mr-1.5" />
                      Sheet
                    </Button>
                  </div>
                  <Button
                    onClick={handleBatchFetch}
                    variant="outline"
                    className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent flex items-center gap-2"
                  >
                    <Download size={16} />
                    Fetch APY & TVL
                  </Button>
                  <Button
                    onClick={handleNewItem}
                    className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90 font-semibold flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New Item
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-screen-xl w-full pr-[var(--container-padding-desktop,] pl-[var(--container-padding-desktop,] mt-6 pt-0 pb-[32px)] max-md:max-w-full max-md:px-5">
            {viewMode === 'table' ? (
              <AdminDataTable onEdit={handleEdit} onBatchFetch={handleBatchFetch} />
            ) : (
              <SheetDataTable onEdit={handleEdit} onBatchFetch={handleBatchFetch} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDatabase;
