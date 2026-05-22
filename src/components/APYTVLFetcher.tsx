

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormSection } from './ui/form-section';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { scrapeWebsiteForAPYTVL } from '@/utils/firecrawl';
import { prettifyHTML } from '@/utils/htmlPrettifier';

interface APYTVLFetcherConfig {
  id?: string;
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
  apy_decimals?: number;
}

interface APYTVLFetcherProps {
  assetId: string;
  website: string;
  asset1Name?: string;
  onConfigChange?: (config: Partial<APYTVLFetcherConfig>) => void;
  onValuesUpdate?: (values: { apy?: number; tvl?: number }) => void;
}

export const APYTVLFetcher: React.FC<APYTVLFetcherProps> = ({
  assetId,
  website,
  asset1Name,
  onConfigChange,
  onValuesUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data?: {
      apy?: number;
      tvl?: number;
      asset_found?: boolean;
    };
    error?: string;
    debug?: unknown;
    rawResponse?: {
      success: boolean;
      data: any;
      raw_content?: string;
      raw_html?: string;
      raw_markdown?: string;
    };
  } | null>(null);
  const [existingConfig, setExistingConfig] = useState<APYTVLFetcherConfig | null>(null);
  const [selectedApyText, setSelectedApyText] = useState<string>('');
  const [selectedTvlText, setSelectedTvlText] = useState<string>('');

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<APYTVLFetcherConfig>({
    defaultValues: {
      asset_id: assetId,
      target_website: website,
      target_asset1: asset1Name || '',
      apy_field_name: 'APY',
      tvl_field_name: 'TVL',
      tvl_suffix: '',
      wait_delay_seconds: 0,
      scraping_interval_hours: 24,
      is_active: false,
      apy_text_pattern: '',
      tvl_text_pattern: '',
      apy_context_before: '',
      apy_context_after: '',
      tvl_context_before: '',
      tvl_context_after: '',
      apy_decimals: undefined
    }
  });

  const watchedValues = watch();

  // Helper function to extract numeric value from selected text
  const extractNumericValue = (text: string, isPercentage: boolean = false): number | null => {
    if (!text) return null;
    
    // Remove extra whitespace and normalize
    let cleanText = text.trim().replace(/\s+/g, ' ');
    
    // Remove HTML tags and CSS content that might be included in selection
    cleanText = cleanText.replace(/<[^>]*>/g, ''); // Remove HTML tags
    cleanText = cleanText.replace(/style="[^"]*"/g, ''); // Remove style attributes
    cleanText = cleanText.replace(/class="[^"]*"/g, ''); // Remove class attributes
    cleanText = cleanText.replace(/font-weight:\s*\d+/g, ''); // Remove font-weight specifically
    cleanText = cleanText.replace(/[{}();:]/g, ''); // Remove CSS syntax characters
    
    console.log('Original text:', text);
    console.log('Cleaned text:', cleanText);
    
    // For percentage values
    if (isPercentage) {
      const percentMatch = cleanText.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch) {
        console.log('Found percentage:', percentMatch[1]);
        return parseFloat(percentMatch[1]);
      }
    }
    
    // For currency/numeric values (with K, M, B multipliers) - prioritize currency format
    const currencyMatch = cleanText.match(/\$?([\d,]+(?:\.\d+)?)\s*([KMB])?/i);
    if (currencyMatch) {
      const number = parseFloat(currencyMatch[1].replace(/,/g, ''));
      const multiplier = currencyMatch[2]?.toUpperCase();
      
      console.log('Found currency:', currencyMatch[1], 'multiplier:', multiplier);
      
      switch (multiplier) {
        case 'K': return number * 1000;
        case 'M': return number * 1000000;
        case 'B': return number * 1000000000;
        default: return number;
      }
    }
    
    // Look for any number with dollar sign or commas (likely a currency value)
    const dollarMatch = cleanText.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (dollarMatch) {
      const number = parseFloat(dollarMatch[1].replace(/,/g, ''));
      console.log('Found dollar amount:', dollarMatch[1], 'parsed as:', number);
      return number;
    }
    
    // Fallback: try to extract any number, but prioritize larger numbers
    const allNumbers = cleanText.match(/\d+(?:\.\d+)?/g);
    if (allNumbers && allNumbers.length > 0) {
      // Sort by value and pick the largest number (likely the actual value we want)
      const sortedNumbers = allNumbers.map(n => parseFloat(n)).sort((a, b) => b - a);
      console.log('Found numbers:', allNumbers, 'picking largest:', sortedNumbers[0]);
      return sortedNumbers[0];
    }
    
    return null;
  };

  // Helper function to get surrounding context for text patterns
  const getSurroundingContext = (selection: Selection, textLength: number = 50): { before: string; after: string } => {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const fullText = container.textContent || '';
    
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    
    // Get context before and after the selection
    const beforeStart = Math.max(0, startOffset - textLength);
    const afterEnd = Math.min(fullText.length, endOffset + textLength);
    
    const before = fullText.substring(beforeStart, startOffset).trim();
    const after = fullText.substring(endOffset, afterEnd).trim();
    
    return { before, after };
  };

  // Handle text selection for APY
  const handleApyTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      setSelectedApyText(selectedText);
      
      // Get surrounding context for pattern matching
      const context = getSurroundingContext(selection);
      
      // Clean the selected text to extract just the visible content
      const cleanSelectedText = selectedText
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/style="[^"]*"/g, '') // Remove style attributes
        .replace(/class="[^"]*"/g, '') // Remove class attributes
        .replace(/font-weight:\s*\d+/g, '') // Remove font-weight specifically
        .trim();
      
      console.log('APY - Original selection:', selectedText);
      console.log('APY - Cleaned selection:', cleanSelectedText);
      
      const apyValue = extractNumericValue(selectedText, true);
      if (apyValue !== null) {
        // Store the cleaned pattern for future matching
        setValue('apy_field_name', cleanSelectedText || selectedText);
        setValue('apy_text_pattern', cleanSelectedText || selectedText);
        setValue('apy_context_before', context.before);
        setValue('apy_context_after', context.after);
        
        toast.success(`APY pattern saved: ${apyValue}% (will remember this location for future fetches)`);
        if (onValuesUpdate) {
          onValuesUpdate({ apy: apyValue });
        }
      } else {
        toast.error(`Could not extract APY value from selected text: "${selectedText}"`);
      }
    }
  };

  // Handle text selection for TVL
  const handleTvlTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      setSelectedTvlText(selectedText);
      
      // Get surrounding context for pattern matching
      const context = getSurroundingContext(selection);
      
      // Clean the selected text to extract just the visible content
      const cleanSelectedText = selectedText
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/style="[^"]*"/g, '') // Remove style attributes
        .replace(/class="[^"]*"/g, '') // Remove class attributes
        .replace(/font-weight:\s*\d+/g, '') // Remove font-weight specifically
        .trim();
      
      console.log('TVL - Original selection:', selectedText);
      console.log('TVL - Cleaned selection:', cleanSelectedText);
      
      const tvlValue = extractNumericValue(selectedText, false);
      if (tvlValue !== null) {
        // Store the cleaned pattern for future matching
        setValue('tvl_field_name', cleanSelectedText || selectedText);
        setValue('tvl_text_pattern', cleanSelectedText || selectedText);
        setValue('tvl_context_before', context.before);
        setValue('tvl_context_after', context.after);
        
        const suffix = watchedValues.tvl_suffix;
        const displayValue = suffix ? `${tvlValue.toLocaleString()} ${suffix}` : `$${tvlValue.toLocaleString()}`;
        toast.success(`TVL pattern saved: ${displayValue} (will remember this location for future fetches)`);
        if (onValuesUpdate) {
          onValuesUpdate({ tvl: tvlValue });
        }
      } else {
        toast.error(`Could not extract TVL value from selected text: "${selectedText}"`);
      }
    }
  };

  // Load existing config
  useEffect(() => {
    const loadData = async () => {
      if (!assetId) return;

      try {
        const { data: configData, error: configError } = await (supabase as any)
          .from('apy_tvl_configs')
          .select('*')
          .eq('asset_id', assetId)
          .single();

        if (configError && configError.code !== 'PGRST116') {
          console.error('Failed to load APY/TVL config:', configError);
        } else if (configData) {
          setExistingConfig(configData as APYTVLFetcherConfig);
          reset(configData as APYTVLFetcherConfig);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadData();
  }, [assetId, reset]);

  // Update website and asset1 when props change
  useEffect(() => {
    setValue('target_website', website);
  }, [website, setValue]);

  useEffect(() => {
    if (asset1Name) {
      setValue('target_asset1', asset1Name);
    }
  }, [asset1Name, setValue]);

  // Notify parent of changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(watchedValues);
    }
  }, [watchedValues, onConfigChange]);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const configData = {
        asset_id: assetId,
        target_website: watchedValues.target_website,
        target_asset1: watchedValues.target_asset1,
        apy_field_name: watchedValues.apy_field_name,
        tvl_field_name: watchedValues.tvl_field_name,
        tvl_suffix: watchedValues.tvl_suffix || null,
        wait_delay_seconds: watchedValues.wait_delay_seconds || 0,
        scraping_interval_hours: watchedValues.scraping_interval_hours,
        is_active: watchedValues.is_active,
        apy_text_pattern: watchedValues.apy_text_pattern || null,
        tvl_text_pattern: watchedValues.tvl_text_pattern || null,
        apy_context_before: watchedValues.apy_context_before || null,
        apy_context_after: watchedValues.apy_context_after || null,
        tvl_context_before: watchedValues.tvl_context_before || null,
        tvl_context_after: watchedValues.tvl_context_after || null,
        apy_decimals: watchedValues.apy_decimals || null
      };

      console.log('Saving config data:', configData);

      let result: any;
      if (existingConfig) {
        console.log('Updating existing config with ID:', existingConfig.id);
        result = await (supabase as any)
          .from('apy_tvl_configs')
          .update(configData)
          .eq('id', existingConfig.id);
      } else {
        console.log('Inserting new config');
        result = await (supabase as any)
          .from('apy_tvl_configs')
          .insert([configData]);
      }

      console.log('Supabase result:', result);

      if (result.error) {
        console.error('Supabase error details:', {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        });
        throw result.error;
      }

      toast.success('APY & TVL fetcher configuration saved successfully');
      
      // Reload config to get the ID if it was a new config
      if (!existingConfig) {
        const { data } = await (supabase as any)
          .from('apy_tvl_configs')
          .select('*')
          .eq('asset_id', assetId)
          .single();
        if (data) setExistingConfig(data as APYTVLFetcherConfig);
      }

    } catch (error) {
      console.error('Failed to save APY/TVL config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save APY & TVL fetcher configuration: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestFetch = async () => {
    if (!watchedValues.target_website) {
      toast.error('Please enter a website URL to test');
      return;
    }

    if (!watchedValues.target_asset1) {
      toast.error('Please enter the target asset name');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {

      // Prepare text patterns if they exist
      const apyPattern = watchedValues.apy_text_pattern ? {
        pattern: watchedValues.apy_text_pattern,
        contextBefore: watchedValues.apy_context_before,
        contextAfter: watchedValues.apy_context_after
      } : undefined;

      const tvlPattern = watchedValues.tvl_text_pattern ? {
        pattern: watchedValues.tvl_text_pattern,
        contextBefore: watchedValues.tvl_context_before,
        contextAfter: watchedValues.tvl_context_after
      } : undefined;

      console.log('🔍 Using stored patterns for extraction:');
      console.log('APY Pattern:', apyPattern);
      console.log('TVL Pattern:', tvlPattern);

      // Use direct Firecrawl integration with stored patterns
      const scrapedData = await scrapeWebsiteForAPYTVL(
        watchedValues.target_website,
        watchedValues.target_asset1,
        watchedValues.apy_field_name,
        watchedValues.tvl_field_name,
        watchedValues.tvl_suffix,
        watchedValues.wait_delay_seconds,
        apyPattern,
        tvlPattern
      );

      console.log('Firecrawl scraping result:', scrapedData);

      // Format the result to match the expected structure
      const result = {
        success: !scrapedData.error,
        data: scrapedData.error ? undefined : {
          apy: scrapedData.apy,
          tvl: scrapedData.tvl,
          asset_found: scrapedData.asset_found
        },
        error: scrapedData.error,
        rawResponse: {
          success: !scrapedData.error,
          data: scrapedData,
          raw_content: scrapedData.raw_content,
          raw_html: scrapedData.raw_html,
          raw_markdown: scrapedData.raw_markdown
        }
      };

      setTestResult(result);
      
      if (result.success && result.data) {
        toast.success('APY & TVL fetch test completed successfully');
        
        // Update parent component with new APY and TVL values if found
        if (result.data.apy !== undefined || result.data.tvl !== undefined) {
          const newValues: { apy?: number; tvl?: number } = {};
          
          if (result.data.apy !== undefined) {
            newValues.apy = result.data.apy;
          }
          
          if (result.data.tvl !== undefined) {
            newValues.tvl = result.data.tvl;
          }
          
          // Notify parent of the updated values
          if (onValuesUpdate) {
            onValuesUpdate(newValues);
          }
          
          toast.success(`Values extracted: ${result.data.apy !== undefined ? `APY: ${result.data.apy}%` : ''}${result.data.apy !== undefined && result.data.tvl !== undefined ? ', ' : ''}${result.data.tvl !== undefined ? `TVL: $${result.data.tvl.toLocaleString()}` : ''}`);
        }
      } else {
        toast.error(`APY & TVL fetch test failed: ${result.error || 'Unknown error occurred'}`);
      }

    } catch (error) {
      toast.error('Failed to test APY & TVL fetch');
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        rawResponse: { success: false, data: null }
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <FormSection title="APY & TVL Fetcher" description="Configure automatic APY and TVL data extraction from target websites using Firecrawl to search for specific assets in tables.">
      <div className="space-y-6">
        {/* Enable Fetcher Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="is_active" className="text-[#CECFD2] text-sm font-medium">
              Enable APY & TVL Fetcher
            </label>
            <p className="text-[#94979C] text-xs mt-1">
              Automatically fetch APY and TVL values for the specified asset from target website tables
            </p>
          </div>
          <Switch
            id="is_active"
            checked={watchedValues.is_active}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
        </div>

        {/* Target Website */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target_website" className="text-[#CECFD2] text-sm font-medium">
              Target Website
            </label>
            <input
              id="target_website"
              type="url"
              {...register('target_website', {
                required: 'Website URL is required'
              })}
              placeholder="https://example.com/staking-data"
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            {errors.target_website && (
              <span className="text-red-400 text-sm">{errors.target_website.message}</span>
            )}
          </div>
        </div>

        {/* Target Asset1 */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target_asset1" className="text-[#CECFD2] text-sm font-medium">
              Target Asset Name
            </label>
            <input
              id="target_asset1"
              type="text"
              {...register('target_asset1', {
                required: 'Target asset name is required'
              })}
              placeholder="ETH, stETH, USDC, etc."
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            {errors.target_asset1 && (
              <span className="text-red-400 text-sm">{errors.target_asset1.message}</span>
            )}
            <p className="text-[#94979C] text-xs">
              The asset name to search for in the table (e.g., "ETH", "stETH", "USDC")
            </p>
          </div>
        </div>

        {/* APY Field Name */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="apy_field_name" className="text-[#CECFD2] text-sm font-medium">
              APY Field Name
            </label>
            <input
              id="apy_field_name"
              type="text"
              {...register('apy_field_name', {
                required: 'APY field name is required'
              })}
              placeholder="APY, Yield, Annual Return, etc."
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            {errors.apy_field_name && (
              <span className="text-red-400 text-sm">{errors.apy_field_name.message}</span>
            )}
            <p className="text-[#94979C] text-xs">
              Column name for APY data (default: "APY", can be custom like "Yield", "Annual Return")
            </p>
          </div>
        </div>

        {/* APY Decimals */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="apy_decimals" className="text-[#CECFD2] text-sm font-medium">
              APY Decimals (Optional)
            </label>
            <input
              id="apy_decimals"
              type="number"
              {...register('apy_decimals', {
                min: 0,
                max: 30,
                valueAsNumber: true
              })}
              placeholder="18"
              min="0"
              max="30"
              step="1"
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            <p className="text-[#94979C] text-xs">
              Decimal places for APY conversion. Example: if API returns "88852200338910530" with 18 decimals, it becomes ~8.89% APY. Leave empty if APY is already in percentage format.
            </p>
          </div>
        </div>

        {/* TVL Field Name */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tvl_field_name" className="text-[#CECFD2] text-sm font-medium">
              TVL Field Name
            </label>
            <input
              id="tvl_field_name"
              type="text"
              {...register('tvl_field_name', {
                required: 'TVL field name is required'
              })}
              placeholder="TVL, Total Value Locked, Liquidity, etc."
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            {errors.tvl_field_name && (
              <span className="text-red-400 text-sm">{errors.tvl_field_name.message}</span>
            )}
            <p className="text-[#94979C] text-xs">
              Column name for TVL data (default: "TVL", can be custom like "Total Value Locked", "Liquidity")
            </p>
          </div>
        </div>

        {/* TVL Suffix */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tvl_suffix" className="text-[#CECFD2] text-sm font-medium">
              TVL Suffix (Optional)
            </label>
            <input
              id="tvl_suffix"
              type="text"
              {...register('tvl_suffix')}
              placeholder="HYPE, ETH, BTC, etc."
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            <p className="text-[#94979C] text-xs">
              Custom suffix for TVL values that aren't in USD (e.g., "HYPE" for "11,831,691 HYPE"). Leave empty for USD values.
            </p>
          </div>
        </div>

        {/* Wait Delay */}
        <div className="w-full gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="wait_delay_seconds" className="text-[#CECFD2] text-sm font-medium">
              Wait Delay (Optional)
            </label>
            <input
              id="wait_delay_seconds"
              type="number"
              {...register('wait_delay_seconds', {
                min: 0,
                max: 30,
                valueAsNumber: true
              })}
              placeholder="0"
              min="0"
              max="30"
              step="1"
              className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            <p className="text-[#94979C] text-xs">
              Seconds to wait for dynamic content to load (0-30). Use 2-5 seconds for pages with JavaScript-loaded data.
            </p>
          </div>
        </div>

        {/* How It Works Info */}
        <div className="bg-[#11131A] border border-[#373A41] rounded-lg p-4">
          <h4 className="text-[#75E0A7] text-sm font-medium mb-2">🔍 How APY & TVL Fetcher Works</h4>
          <ul className="text-[#94979C] text-xs list-disc list-inside space-y-1">
            <li>🌐 Firecrawl crawls the target website</li>
            <li>⏱️ Waits for dynamic content to load (if wait delay is set)</li>
            <li>🔍 Searches for tables containing the specified asset name</li>
            <li>📊 Finds the APY and TVL columns using the custom field names you specify</li>
            <li>📈 Extracts the values from the row matching your asset</li>
            <li>🧮 Automatically parses percentages and currency formats</li>
            <li>✨ <strong>NEW:</strong> Use text selection in HTML results to pinpoint exact APY/TVL values</li>
            <li>✅ Returns clean, structured data ready for your database</li>
          </ul>
          <div className="mt-3 p-2 bg-[#0C0E12] border border-[#373A41] rounded">
            <p className="text-[#75E0A7] text-xs font-medium">💡 Pro Tip: Text Selection Mode</p>
            <p className="text-[#94979C] text-xs mt-1">
              After running "Test Fetch", go to the HTML tab and highlight the exact APY/TVL values you want to extract. 
              Click "Extract APY" or "Extract TVL" to automatically configure the field names and update the form values.
            </p>
          </div>
        </div>


        {/* Test and Save Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={handleTestFetch}
            disabled={isTesting || !watchedValues.target_website || !watchedValues.target_asset1}
            variant="outline"
            className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent"
          >
            {isTesting ? 'Testing Fetch...' : 'Test Fetch'}
          </Button>
          <Button
            type="button"
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90"
          >
            {isLoading ? 'Saving...' : 'Save Config'}
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="mt-4 p-4 bg-[#11131A] border border-[#373A41] rounded-lg">
            <h4 className="text-[#CECFD2] text-sm font-medium mb-2">Fetch Results:</h4>
            <div className="text-sm text-[#94979C] space-y-1">
              <div>Status: <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                {testResult.success ? 'Success' : 'Failed'}
              </span></div>
              {testResult.data?.apy !== undefined && <div className="text-green-400">APY Found: {testResult.data.apy}%</div>}
              {testResult.data?.tvl !== undefined && <div className="text-green-400">TVL Found: ${testResult.data.tvl.toLocaleString()}</div>}
              {testResult.data?.asset_found && <div className="text-blue-400">Asset "{watchedValues.target_asset1}" found in table</div>}
              {testResult.error && <div className="text-red-400">Error: {testResult.error}</div>}
            </div>
            
            {/* Scraped Content Tabs */}
            {testResult.rawResponse && (
              <div className="mt-4">
                <h5 className="text-[#CECFD2] text-xs font-medium mb-2">Scraped Content:</h5>
                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-[#11131A] border border-[#373A41]">
                    <TabsTrigger value="html" className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12]">HTML</TabsTrigger>
                    <TabsTrigger value="markdown" className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12]">Markdown</TabsTrigger>
                    <TabsTrigger value="json" className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12]">JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="mt-2">
                    <div className="space-y-3">
                      {/* Selection Instructions */}
                      <div className="bg-[#11131A] border border-[#373A41] rounded p-3">
                        <h6 className="text-[#75E0A7] text-xs font-medium mb-2">💡 Text Selection Mode</h6>
                        <div className="text-[#94979C] text-xs space-y-1">
                          <p>• Highlight APY values in the HTML below and click "Extract APY"</p>
                          <p>• Highlight TVL values in the HTML below and click "Extract TVL"</p>
                          <p>• Selected values will automatically update the form fields</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleApyTextSelection}
                            className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            Extract APY
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleTvlTextSelection}
                            className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                          >
                            Extract TVL
                          </Button>
                          {selectedApyText && (
                            <span className="text-xs text-blue-400 px-2 py-1 bg-blue-900/20 rounded">
                              APY: "{selectedApyText}"
                            </span>
                          )}
                          {selectedTvlText && (
                            <span className="text-xs text-green-400 px-2 py-1 bg-green-900/20 rounded">
                              TVL: "{selectedTvlText}"
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* HTML Content with Selection */}
                      <div 
                        className="bg-[#0C0E12] border border-[#373A41] rounded p-3 text-xs text-[#94979C] overflow-auto max-h-80 whitespace-pre-wrap select-text cursor-text"
                        style={{ userSelect: 'text' }}
                      >
                        {testResult.rawResponse.raw_html ? prettifyHTML(testResult.rawResponse.raw_html) : 'No HTML content available'}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown" className="mt-2">
                    <pre className="bg-[#0C0E12] border border-[#373A41] rounded p-3 text-xs text-[#94979C] overflow-auto max-h-80 whitespace-pre-wrap">
                      {testResult.rawResponse.raw_markdown || 'No Markdown content available'}
                    </pre>
                  </TabsContent>
                  <TabsContent value="json" className="mt-2">
                    <pre className="bg-[#0C0E12] border border-[#373A41] rounded p-3 text-xs text-[#94979C] overflow-auto max-h-80 whitespace-pre-wrap">
                      {JSON.stringify(testResult.rawResponse, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {/* Debug Info */}
            {testResult.debug && (
              <div className="mt-4">
                <h5 className="text-[#CECFD2] text-xs font-medium mb-2">Debug Information:</h5>
                <pre className="bg-[#0C0E12] border border-[#373A41] rounded p-3 text-xs text-[#94979C] overflow-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(testResult.debug, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Stored Patterns Info */}
        {(watchedValues.apy_text_pattern || watchedValues.tvl_text_pattern) && (
          <div className="bg-[#11131A] border border-[#373A41] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-[#75E0A7] text-xs font-medium">📍 Stored Text Patterns</h5>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setValue('apy_text_pattern', '');
                  setValue('tvl_text_pattern', '');
                  setValue('apy_context_before', '');
                  setValue('apy_context_after', '');
                  setValue('tvl_context_before', '');
                  setValue('tvl_context_after', '');
                  setSelectedApyText('');
                  setSelectedTvlText('');
                  toast.success('Text patterns cleared. You can now select new patterns.');
                }}
                className="h-5 px-2 text-xs bg-red-600 hover:bg-red-700"
              >
                Clear Patterns
              </Button>
            </div>
            <div className="space-y-1 text-xs text-[#94979C]">
              {watchedValues.apy_text_pattern && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">APY:</span>
                  <span className="bg-blue-900/20 px-2 py-1 rounded text-blue-300">"{watchedValues.apy_text_pattern}"</span>
                </div>
              )}
              {watchedValues.tvl_text_pattern && (
                <div className="flex items-center gap-2">
                  <span className="text-green-400">TVL:</span>
                  <span className="bg-green-900/20 px-2 py-1 rounded text-green-300">"{watchedValues.tvl_text_pattern}"</span>
                </div>
              )}
              <p className="text-[#94979C] text-xs mt-2">
                ✅ Future fetches will use these exact patterns for more accurate extraction
              </p>
            </div>
          </div>
        )}

        {/* Last Fetched Info */}
        {existingConfig?.last_scraped_at && (
          <div className="text-xs text-[#94979C]">
            Last fetched: {new Date(existingConfig.last_scraped_at).toLocaleString()}
          </div>
        )}
      </div>
    </FormSection>
  );
};
