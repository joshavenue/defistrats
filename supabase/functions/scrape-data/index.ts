
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractResult {
  success: boolean;
  apy?: number;
  tvl?: number;
  error?: string;
  debug?: string;
  extractedData?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assetId, testConfig } = await req.json();

    if (!assetId) {
      return new Response(
        JSON.stringify({ error: 'Asset ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Starting Firecrawl extraction for asset: ${assetId}`);

    let config;
    
    // If testConfig is provided, use it for testing without requiring a saved config
    if (testConfig) {
      console.log('Using test configuration for extraction');
      config = testConfig;
    } else {
      // Get scraper config for the asset
      const { data: configData, error: configError } = await supabase
        .from('scraper_configs')
        .select('*')
        .eq('asset_id', assetId)
        .eq('is_active', true)
        .single();

      if (configError || !configData) {
        console.error('No active scraper config found:', configError);
        return new Response(
          JSON.stringify({ error: 'No active scraper configuration found' }),
          { status: 404, headers: corsHeaders }
        );
      }
      config = configData;
    }

    // Get asset data for building dynamic prompt
    const { data: asset, error: assetError } = await supabase
      .from('staking_assets')
      .select('apy, tvl, asset1_name, asset2_name, asset, symbol')
      .eq('id', assetId)
      .single();

    if (assetError) {
      console.error('Asset not found:', assetError);
      return new Response(
        JSON.stringify({ error: 'Asset not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Build dynamic extraction prompt with placeholders
    const assetName = config.target_asset1 || asset.asset1_name || asset.asset || asset.symbol || 'the asset';
    const apyFieldName = config.apy_field_name || 'APY';
    const tvlFieldName = config.tvl_field_name || 'TVL';
    
    const extractionPrompt = `Extract financial data from this website for ${assetName}. Look for tables containing the asset "${assetName}" and extract the ${apyFieldName} and ${tvlFieldName} values for this specific asset. Search for columns that might be named:
    - For APY: ${apyFieldName}, APY, Yield, Annual Return, Interest Rate, Return, Rate
    - For TVL: ${tvlFieldName}, TVL, Total Value Locked, Liquidity, Volume, Assets, Market Cap
    
    Return ONLY the numerical values for the asset "${assetName}".`;
    
    console.log(`Using extraction prompt: "${extractionPrompt}"`);

    // Extract data using Firecrawl with enhanced approach
    const extractionResult = await extractWithFirecrawl(config.target_website, extractionPrompt, assetName);
    
    // If this is a test, don't update the database
    if (testConfig) {
      const response = {
        success: extractionResult.success,
        data: extractionResult,
        error: extractionResult.error,
        debug: extractionResult.debug
      };

      console.log('Firecrawl extraction test completed:', response);

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: corsHeaders }
      );
    }

    let updatedFields: any = {};
    const logs = [];

    // Process APY if extracted successfully
    if (extractionResult.success && extractionResult.apy !== undefined) {
      const oldApy = asset.apy;
      const newApy = extractionResult.apy;
      
      // Only update if change is significant (> 1% difference)
      if (Math.abs(newApy - oldApy) / oldApy > 0.01) {
        updatedFields.apy = newApy;
        logs.push({
          asset_id: assetId,
          scraping_type: 'APY',
          old_value: oldApy,
          new_value: newApy,
          success: true
        });
      }
    }

    // Process TVL if extracted successfully
    if (extractionResult.success && extractionResult.tvl !== undefined) {
      const oldTvl = asset.tvl;
      const newTvl = extractionResult.tvl;
      
      // Only update if change is significant (> 5% difference)
      if (oldTvl && Math.abs(newTvl - oldTvl) / oldTvl > 0.05) {
        updatedFields.tvl = newTvl;
        logs.push({
          asset_id: assetId,
          scraping_type: 'TVL',
          old_value: oldTvl,
          new_value: newTvl,
          success: true
        });
      } else if (!oldTvl && newTvl > 0) {
        updatedFields.tvl = newTvl;
        logs.push({
          asset_id: assetId,
          scraping_type: 'TVL',
          old_value: oldTvl,
          new_value: newTvl,
          success: true
        });
      }
    }

    // Update asset if we have changes
    if (Object.keys(updatedFields).length > 0) {
      const { error: updateError } = await supabase
        .from('staking_assets')
        .update(updatedFields)
        .eq('id', assetId);

      if (updateError) {
        console.error('Failed to update asset:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update asset' }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Log extraction results
    if (logs.length > 0) {
      const { error: logError } = await supabase
        .from('scraper_logs')
        .insert(logs);

      if (logError) {
        console.error('Failed to log extraction results:', logError);
      }
    }

    // Update last scraped timestamp
    await supabase
      .from('scraper_configs')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('asset_id', assetId);

    const response = {
      success: extractionResult.success,
      updated: Object.keys(updatedFields),
      data: extractionResult,
      error: extractionResult.error,
      debug: extractionResult.debug
    };

    console.log('Firecrawl extraction completed:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Extraction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function extractWithFirecrawl(url: string, prompt: string, assetName: string): Promise<ExtractResult> {
  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return {
        success: false,
        error: 'Firecrawl API key not configured',
        debug: 'Missing FIRECRAWL_API_KEY environment variable'
      };
    }

    console.log(`Extracting with Firecrawl v1 extract: ${url}`);
    console.log(`Extraction prompt: "${prompt}"`);
    
    // Enhanced schema with more flexible extraction
    const extractionSchema = {
      type: "object",
      properties: {
        website_content_summary: {
          type: "string",
          description: "A brief summary of what financial information is available on this website"
        },
        asset_name: {
          type: "string",
          description: "The name of the asset found, if any"
        },
        apy_value: {
          type: "string", 
          description: "Any APY/yield/return percentage value found (e.g., '5.44%' or '5.44')"
        },
        tvl_value: {
          type: "string",
          description: "Any TVL/liquidity/volume monetary value found (e.g., '$9.43M' or '9430000')"
        },
        apy_source: {
          type: "string",
          description: "Where the APY value was found (column name, section title, etc.)"
        },
        tvl_source: {
          type: "string", 
          description: "Where the TVL value was found (column name, section title, etc.)"
        },
        all_percentage_values: {
          type: "array",
          items: { type: "string" },
          description: "All percentage values found on the page (including APY, yield, interest rates)"
        },
        all_monetary_values: {
          type: "array", 
          items: { type: "string" },
          description: "All large monetary values found on the page (including TVL, volume, liquidity)"
        },
        all_assets_found: {
          type: "array",
          items: { type: "string" },
          description: "All asset names, symbols, or tokens found on the page"
        },
        has_financial_data: {
          type: "boolean",
          description: "Whether the page appears to contain financial data"
        }
      },
      required: ["website_content_summary", "has_financial_data"]
    };

    // First, try a simple scrape to get the page content with JavaScript rendering
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        waitFor: 5000, // Wait for JavaScript to load
        timeout: 30000
      })
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl scrape error:', scrapeResponse.status, errorText);
    } else {
      const scrapeData = await scrapeResponse.json();
      console.log('Firecrawl scrape successful, content length:', scrapeData.data?.markdown?.length || 0);
    }

    // Now try the extract API
    const extractResponse = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        urls: [url],
        prompt: prompt,
        schema: extractionSchema
      })
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('Firecrawl API error:', extractResponse.status, errorText);
      return {
        success: false,
        error: `Firecrawl API error: ${extractResponse.status} - ${errorText}`,
        debug: `HTTP ${extractResponse.status}: ${errorText}`
      };
    }

    const extractData = await extractResponse.json();
    console.log('Firecrawl extract response:', JSON.stringify(extractData, null, 2));

    if (!extractData.success) {
      return {
        success: false,
        error: `Firecrawl extraction failed: ${extractData.error || 'Unknown error'}`,
        debug: `Extract failed: ${JSON.stringify(extractData)}`
      };
    }

    const result: ExtractResult = { success: true };
    let debugInfo = [];

    // Extract data from the structured response
    const extractedData = extractData.data && extractData.data.length > 0 ? extractData.data[0].extract : null;
    
    if (!extractedData) {
      return {
        success: false,
        error: 'No data extracted from website - the page may not contain the expected financial information',
        debug: 'Firecrawl returned empty extraction results. This could mean the website structure is different than expected, or the page requires JavaScript to load content.'
      };
    }

    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));
    result.extractedData = extractedData;
    
    debugInfo.push(`Website summary: ${extractedData.website_content_summary || 'No summary available'}`);
    debugInfo.push(`Has financial data: ${extractedData.has_financial_data || false}`);
    
    if (extractedData.all_percentage_values && extractedData.all_percentage_values.length > 0) {
      debugInfo.push(`Found percentage values: [${extractedData.all_percentage_values.join(', ')}]`);
    }
    
    if (extractedData.all_monetary_values && extractedData.all_monetary_values.length > 0) {
      debugInfo.push(`Found monetary values: [${extractedData.all_monetary_values.join(', ')}]`);
    }

    // Process APY with enhanced parsing
    if (extractedData.apy_value) {
      const apyNumber = parseFinancialValue(extractedData.apy_value, 'APY');
      if (apyNumber !== null) {
        result.apy = apyNumber;
        debugInfo.push(`Parsed APY: ${result.apy}% from "${extractedData.apy_value}" (source: ${extractedData.apy_source || 'unknown'})`);
      } else {
        debugInfo.push(`Could not parse APY from: "${extractedData.apy_value}"`);
      }
    }

    // Process TVL with enhanced parsing
    if (extractedData.tvl_value) {
      const tvlNumber = parseFinancialValue(extractedData.tvl_value, 'TVL');
      if (tvlNumber !== null) {
        result.tvl = tvlNumber;
        debugInfo.push(`Parsed TVL: $${result.tvl.toLocaleString()} from "${extractedData.tvl_value}" (source: ${extractedData.tvl_source || 'unknown'})`);
      } else {
        debugInfo.push(`Could not parse TVL from: "${extractedData.tvl_value}"`);
      }
    }

    // If no specific values found, try to extract from arrays
    if (!result.apy && extractedData.all_percentage_values && extractedData.all_percentage_values.length > 0) {
      for (const percentValue of extractedData.all_percentage_values) {
        const parsed = parseFinancialValue(percentValue, 'APY');
        if (parsed !== null && parsed > 0 && parsed < 100) { // Reasonable APY range
          result.apy = parsed;
          debugInfo.push(`Extracted APY from percentage array: ${result.apy}% from "${percentValue}"`);
          break;
        }
      }
    }

    if (!result.tvl && extractedData.all_monetary_values && extractedData.all_monetary_values.length > 0) {
      for (const monetaryValue of extractedData.all_monetary_values) {
        const parsed = parseFinancialValue(monetaryValue, 'TVL');
        if (parsed !== null && parsed > 1000) { // Minimum reasonable TVL
          result.tvl = parsed;
          debugInfo.push(`Extracted TVL from monetary array: $${result.tvl.toLocaleString()} from "${monetaryValue}"`);
          break;
        }
      }
    }

    result.debug = debugInfo.join('; ');
    console.log('Enhanced Firecrawl debug info:', result.debug);

    return result;

  } catch (error) {
    console.error('Firecrawl extraction failed:', error);
    return {
      success: false,
      error: error.message,
      debug: `Firecrawl error: ${error.message}`
    };
  }
}

function parseFinancialValue(text: string, type: 'APY' | 'TVL'): number | null {
  if (!text || typeof text !== 'string') return null;
  
  // Remove common symbols and normalize
  let cleanText = text.replace(/[$,%]/g, '').trim();
  
  try {
    if (type === 'TVL') {
      // Handle TVL with suffixes like M, B, K
      const tvlMatch = cleanText.match(/([\d,]+\.?\d*)\s*([MBK]?)/i);
      if (tvlMatch) {
        let value = parseFloat(tvlMatch[1].replace(/,/g, ''));
        const suffix = tvlMatch[2].toUpperCase();
        
        switch (suffix) {
          case 'K':
            value *= 1000;
            break;
          case 'M':
            value *= 1000000;
            break;
          case 'B':
            value *= 1000000000;
            break;
        }
        
        return Math.round(value);
      }
    } else if (type === 'APY') {
      // Handle APY as percentage
      const apyMatch = cleanText.match(/([\d,]+\.?\d*)/);
      if (apyMatch) {
        return parseFloat(apyMatch[1].replace(/,/g, ''));
      }
    }
    
    // Fallback: try to parse as a regular number
    const number = parseFloat(cleanText.replace(/,/g, ''));
    return isNaN(number) ? null : number;
    
  } catch (error) {
    console.error(`Error parsing ${type} value "${text}":`, error);
    return null;
  }
}
