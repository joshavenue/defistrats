
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

interface ManualScrapeTriggerProps {
  assetId: string;
  className?: string;
}

export const ManualScrapeTrigger: React.FC<ManualScrapeTriggerProps> = ({
  assetId,
  className = ''
}) => {
  const [isScrapingNow, setIsScrapingNow] = useState(false);

  const handleManualScrape = async () => {
    setIsScrapingNow(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-data', {
        body: { assetId }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        if (data.updated && data.updated.length > 0) {
          toast.success(`Successfully updated: ${data.updated.join(', ')}`);
        } else {
          toast.success('Scraping completed - no changes detected');
        }
      } else {
        toast.error(`Scraping failed: ${data.error}`);
      }

    } catch (error) {
      console.error('Manual scraping failed:', error);
      toast.error('Failed to trigger scraping');
    } finally {
      setIsScrapingNow(false);
    }
  };

  return (
    <Button
      onClick={handleManualScrape}
      disabled={isScrapingNow}
      variant="outline"
      size="sm"
      className={`border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent ${className}`}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isScrapingNow ? 'animate-spin' : ''}`} />
      {isScrapingNow ? 'Scraping...' : 'Scrape Now'}
    </Button>
  );
};
