import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, FileSpreadsheet, TableIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { AdminDataTable } from '@/components/AdminDataTable';
import { SheetDataTable } from '@/components/SheetDataTable';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { scrapeWebsiteForAPYTVL } from '@/utils/firecrawl';

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

const AdminDatabase: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'sheet'>('table');
  const [isBatchFetching, setIsBatchFetching] = useState(false);

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

  const handleEdit = (id: string) => {
    navigate(`/admin/add?edit=${id}`);
  };

  const handleNewItem = () => {
    navigate('/admin/add');
  };

  const handleBatchFetch = async () => {
    if (isBatchFetching) return;

    setIsBatchFetching(true);
    try {
      const activeConfigs = apyTvlConfigs.filter(config => config.is_active);
      
      if (activeConfigs.length === 0) {
        toast({
          title: "No Active Fetchers",
          description: "No assets have active APY & TVL fetchers enabled",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Batch Fetch Started",
        description: `Fetching APY & TVL for ${activeConfigs.length} assets...`
      });

      let successCount = 0;
      let failCount = 0;

      for (const config of activeConfigs) {
        try {
          console.log(`Fetching data for asset ${config.asset_id}...`);
          
          const apyPattern = config.apy_text_pattern ? {
            pattern: config.apy_text_pattern,
            contextBefore: config.apy_context_before,
            contextAfter: config.apy_context_after
          } : undefined;

          const tvlPattern = config.tvl_text_pattern ? {
            pattern: config.tvl_text_pattern,
            contextBefore: config.tvl_context_before,
            contextAfter: config.tvl_context_after
          } : undefined;

          const scrapedData = await scrapeWebsiteForAPYTVL(
            config.target_website,
            config.target_asset1,
            config.apy_field_name,
            config.tvl_field_name,
            config.tvl_suffix,
            config.wait_delay_seconds,
            apyPattern,
            tvlPattern
          );

          if (!scrapedData.error && (scrapedData.apy !== undefined || scrapedData.tvl !== undefined)) {
            const updateData: { apy?: number; tvl?: number } = {};
            if (scrapedData.apy !== undefined) updateData.apy = scrapedData.apy;
            if (scrapedData.tvl !== undefined) updateData.tvl = scrapedData.tvl;

            const { error: updateError } = await supabase
              .from('staking_assets')
              .update(updateData)
              .eq('id', config.asset_id);

            if (updateError) {
              console.error(`Failed to update asset ${config.asset_id}:`, updateError);
              failCount++;
            } else {
              console.log(`Successfully updated asset ${config.asset_id}:`, updateData);
              successCount++;
            }
          } else {
            console.error(`Failed to scrape data for asset ${config.asset_id}:`, scrapedData.error);
            failCount++;
          }
        } catch (error) {
          console.error(`Error processing asset ${config.asset_id}:`, error);
          failCount++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['staking-assets'] });

      toast({
        title: "Batch Fetch Complete",
        description: `Successfully updated ${successCount} assets. ${failCount} failed.`,
        variant: successCount > 0 ? "default" : "destructive"
      });
    } finally {
      setIsBatchFetching(false);
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
                    disabled={isBatchFetching}
                    variant="outline"
                    className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent flex items-center gap-2"
                  >
                    <Download size={16} />
                    {isBatchFetching ? 'Fetching...' : 'Fetch APY & TVL'}
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
              <AdminDataTable onEdit={handleEdit} />
            ) : (
              <SheetDataTable
                onEdit={handleEdit}
                onBatchFetch={handleBatchFetch}
                isBatchFetching={isBatchFetching}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDatabase;
