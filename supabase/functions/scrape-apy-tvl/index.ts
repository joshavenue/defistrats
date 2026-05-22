
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

if (!FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY environment variable is not set');
}

interface FetchRequest {
  website: string;
  asset1: string;
  apyFieldName: string;
  tvlFieldName: string;
}

interface FetchResponse {
  success: boolean;
  data?: {
    apy?: number;
    tvl?: number;
    asset_found?: boolean;
  };
  error?: string;
  debug?: unknown;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { website, asset1, apyFieldName, tvlFieldName }: FetchRequest = await req.json();

    if (!website || !asset1 || !apyFieldName || !tvlFieldName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: website, asset1, apyFieldName, tvlFieldName' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Firecrawl API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching APY & TVL for ${asset1} from ${website}`);

    // Step 1: First scrape with JavaScript rendering
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: website,
        formats: ['markdown', 'html'],
        waitFor: 5000, // Wait 5 seconds for JavaScript to load
        timeout: 30000
      })
    });

    let scrapedContent = '';
    if (scrapeResponse.ok) {
      const scrapeData = await scrapeResponse.json();
      scrapedContent = scrapeData.data?.markdown || scrapeData.data?.html || '';
      console.log('Scraped content length:', scrapedContent.length);
    }

    // Step 2: Parse the markdown content directly since Firecrawl extraction is failing
    console.log('Parsing markdown content for asset data...');
    
    // Look for the asset in the scraped content
    const assetFound = scrapedContent.includes(asset1);
    console.log(`Asset ${asset1} found in content:`, assetFound);
    
    let extractedAPY: number | undefined;
    let extractedTVL: number | undefined;
    
    if (assetFound && scrapedContent) {
      // Extract APY (looking for various APY patterns)
      const apyPatterns = [
        new RegExp(`${apyFieldName}\\s*([\\d,]+\\.?\\d*)%`, 'i'),
        new RegExp(`${apyFieldName}\\s*([\\d,]+\\.?\\d*)`, 'i'),
        /Borrow APY\s*([\d,]+\.?\d*)%/i,
        /Lend APY\s*([\d,]+\.?\d*)%/i,
        /APY\s*([\d,]+\.?\d*)%/i
      ];
      
      for (const pattern of apyPatterns) {
        const match = scrapedContent.match(pattern);
        if (match && match[1]) {
          extractedAPY = parseFloat(match[1].replace(/,/g, ''));
          console.log(`Found APY: ${extractedAPY}% using pattern:`, pattern);
          break;
        }
      }
      
      // Extract TVL (looking for various TVL patterns)
      const tvlPatterns = [
        new RegExp(`${tvlFieldName}\\s*([\\d,]+\\.?\\d*)\\s*K\\s*${asset1}`, 'i'),
        new RegExp(`${tvlFieldName}\\s*([\\d,]+\\.?\\d*)\\s*M\\s*${asset1}`, 'i'),
        new RegExp(`${tvlFieldName}\\s*([\\d,]+\\.?\\d*)\\s*${asset1}`, 'i'),
        /Total deposited collateral\s*([\d,]+\.?\d*)\s*K\s*LHYPE/i,
        /Total deposited collateral\s*([\d,]+\.?\d*)\s*M\s*LHYPE/i,
        /\$([\\d,]+\\.?\\d*)([KMB]?)/g
      ];
      
      for (const pattern of tvlPatterns) {
        const match = scrapedContent.match(pattern);
        if (match && match[1]) {
          let value = parseFloat(match[1].replace(/,/g, ''));
          
          // Handle K, M, B suffixes
          if (pattern.source.includes('K')) {
            value *= 1000;
          } else if (pattern.source.includes('M')) {
            value *= 1000000;
          } else if (pattern.source.includes('B')) {
            value *= 1000000000;
          }
          
          extractedTVL = value;
          console.log(`Found TVL: ${extractedTVL} using pattern:`, pattern);
          break;
        }
      }
      
      // Special case for the specific format we see in the markdown
      if (!extractedTVL) {
        // Look for: "147.29K LHYPE\n\n$5.49M"
        const specificMatch = scrapedContent.match(/Total deposited collateral\s*([\d,]+\.?\d*)K\s*LHYPE\s*\$([\\d,]+\.?\d*)M/i);
        if (specificMatch) {
          // Use the dollar amount since it's more reliable
          extractedTVL = parseFloat(specificMatch[2].replace(/,/g, '')) * 1000000;
          console.log(`Found TVL from specific pattern: $${extractedTVL.toLocaleString()}`);
        }
      }
    }
    
    // Build direct response from parsed data
    const response: FetchResponse = {
      success: true,
      data: {
        asset_found: assetFound,
        apy: extractedAPY,
        tvl: extractedTVL
      },
      debug: {
        website,
        asset1,
        apyFieldName,
        tvlFieldName,
        scrapedContentLength: scrapedContent.length,
        assetFound,
        extractedAPY,
        extractedTVL,
        contentPreview: scrapedContent.substring(0, 500) + '...'
      }
    };
    
    console.log('Direct parsing result:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    

  } catch (error) {
    console.error('Error in scrape-apy-tvl function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
