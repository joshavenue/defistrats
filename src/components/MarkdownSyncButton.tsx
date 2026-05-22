import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { syncAllStrategyMarkdowns } from '@/utils/strategyMarkdownSync';
import { toast } from "sonner";

interface MarkdownSyncButtonProps {
  className?: string;
}

export const MarkdownSyncButton: React.FC<MarkdownSyncButtonProps> = ({ className }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await syncAllStrategyMarkdowns();
      toast.success('Strategy markdowns and llms.txt generated successfully!');
    } catch (error) {
      console.error('Error generating markdowns:', error);
      toast.error('Failed to generate strategy markdowns. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={className}
      variant="outline"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Generate Strategy Markdowns
        </>
      )}
    </Button>
  );
};