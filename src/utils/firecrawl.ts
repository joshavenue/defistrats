import FireCrawlApp from '@mendable/firecrawl-js';

const app = new FireCrawlApp({
  apiKey: "fc-dcf6692e409d41359a02dec1b2802750"
});

interface ScrapedData {
  apy?: number;
  tvl?: number;
  asset_found?: boolean;
  raw_content?: string;
  raw_html?: string;
  raw_markdown?: string;
  error?: string;
}

interface TextPattern {
  pattern: string;
  contextBefore?: string;
  contextAfter?: string;
}

export const scrapeWebsiteForAPYTVL = async (
  url: string,
  targetAsset: string,
  apyFieldName: string = 'APY',
  tvlFieldName: string = 'TVL',
  tvlSuffix?: string,
  waitDelaySeconds?: number,
  apyPattern?: TextPattern,
  tvlPattern?: TextPattern
): Promise<ScrapedData> => {
  try {
    console.log('Scraping URL:', url);
    console.log('Wait delay:', waitDelaySeconds || 0, 'seconds');
    
    // Prepare scraping options
    const scrapeOptions: any = {
      formats: ["markdown", "html"],
      onlyMainContent: true
    };

    // Add wait delay if specified
    if (waitDelaySeconds && waitDelaySeconds > 0) {
      scrapeOptions.waitFor = waitDelaySeconds * 1000; // Convert to milliseconds
      console.log('Added waitFor:', scrapeOptions.waitFor, 'milliseconds');
    }
    
    const scrapeResult = await app.scrapeUrl(url, scrapeOptions);

    if (!scrapeResult.success) {
      console.error('Firecrawl scrape failed:', scrapeResult);
      return {
        error: 'Failed to scrape website content'
      };
    }

    console.log('Firecrawl response:', scrapeResult);
    console.log('Available properties:', Object.keys(scrapeResult));
    
    const content = scrapeResult.markdown || (scrapeResult as any).content || '';
    const htmlContent = scrapeResult.html || '';
    
    console.log('Scraped content length:', content.length);
    console.log('HTML content length:', htmlContent.length);
    console.log('HTML content preview:', htmlContent.substring(0, 500));

    // First, try pattern-based extraction if patterns are provided
    let result: Pick<ScrapedData, 'apy' | 'tvl' | 'asset_found'> = { asset_found: false };
    
    if (apyPattern || tvlPattern) {
      console.log('Using stored text patterns for extraction...');
      result = parseContentWithPatterns(content, htmlContent, apyPattern, tvlPattern, tvlSuffix);
    }
    
    // If pattern-based extraction didn't find everything, fallback to field-based parsing
    if (!result.apy || !result.tvl) {
      console.log('Falling back to field-based parsing...');
      const fieldResult = parseContentForAssetData(content, targetAsset, apyFieldName, tvlFieldName, tvlSuffix);
      
      // Merge results, prioritizing pattern-based values
      if (!result.apy && fieldResult.apy) result.apy = fieldResult.apy;
      if (!result.tvl && fieldResult.tvl) result.tvl = fieldResult.tvl;
      if (!result.asset_found && fieldResult.asset_found) result.asset_found = fieldResult.asset_found;
      
      // If we still didn't find data in markdown, try parsing the HTML
      if (!result.apy || !result.tvl) {
        console.log('Trying HTML parsing as fallback...');
        const htmlResult = parseContentForAssetData(htmlContent, targetAsset, apyFieldName, tvlFieldName, tvlSuffix);
        
        // Merge results, prioritizing any found values
        if (!result.apy && htmlResult.apy) result.apy = htmlResult.apy;
        if (!result.tvl && htmlResult.tvl) result.tvl = htmlResult.tvl;
        if (!result.asset_found && htmlResult.asset_found) result.asset_found = htmlResult.asset_found;
      }
    }
    
    return {
      ...result,
      raw_content: content.substring(0, 1000), // First 1000 chars for debugging
      raw_html: htmlContent,
      raw_markdown: content
    };

  } catch (error) {
    console.error('Firecrawl scraping error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown scraping error'
    };
  }
};

function parseContentWithPatterns(
  markdownContent: string,
  htmlContent: string,
  apyPattern?: TextPattern,
  tvlPattern?: TextPattern,
  tvlSuffix?: string
): Pick<ScrapedData, 'apy' | 'tvl' | 'asset_found'> {
  const result: Pick<ScrapedData, 'apy' | 'tvl' | 'asset_found'> = {
    asset_found: false
  };

  console.log('Pattern-based extraction:', { apyPattern, tvlPattern });

  // Helper function to extract value using text pattern and context
  const extractWithPattern = (content: string, pattern: TextPattern, isPercentage: boolean = false): number | null => {
    if (!pattern.pattern) return null;

    console.log('Trying to extract with pattern:', pattern);

    // Clean the content to match how patterns were stored
    let cleanContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/style="[^"]*"/g, '') // Remove style attributes
      .replace(/class="[^"]*"/g, '') // Remove class attributes
      .replace(/font-weight:\s*\d+/g, '') // Remove font-weight specifically
      .replace(/[{}();:]/g, ' ') // Replace CSS syntax with spaces
      .replace(/\s+/g, ' '); // Normalize whitespace

    // Extract the numeric value from the stored pattern to create flexible matching
    const patternValue = extractNumericValue(pattern.pattern, isPercentage);
    if (patternValue === null) {
      console.log('Could not extract value from stored pattern:', pattern.pattern);
      return null;
    }

    console.log('Looking for value:', patternValue, 'from pattern:', pattern.pattern);

    // Create multiple possible representations of the value to match against
    const valuesToSearch = [];
    
    if (isPercentage) {
      valuesToSearch.push(`${patternValue}%`);
      valuesToSearch.push(`${patternValue.toFixed(1)}%`);
      valuesToSearch.push(`${patternValue.toFixed(2)}%`);
    } else {
      // For currency/numeric values
      valuesToSearch.push(patternValue.toString());
      valuesToSearch.push(patternValue.toLocaleString());
      valuesToSearch.push(`$${patternValue.toLocaleString()}`);
      valuesToSearch.push(`$${patternValue}`);
      
      // Handle the exact pattern format that was stored
      if (pattern.pattern.includes('$')) {
        valuesToSearch.push(pattern.pattern);
      }
    }

    console.log('Searching for these value patterns:', valuesToSearch);

    // If we have context, use it to narrow down the search area
    if (pattern.contextBefore && pattern.contextAfter) {
      const beforeIndex = cleanContent.toLowerCase().indexOf(pattern.contextBefore.toLowerCase());
      const afterIndex = cleanContent.toLowerCase().indexOf(pattern.contextAfter.toLowerCase(), beforeIndex);
      
      if (beforeIndex !== -1 && afterIndex !== -1) {
        const contextSection = cleanContent.substring(beforeIndex, afterIndex + pattern.contextAfter.length);
        console.log('Searching in context section:', contextSection);
        
        // Look for any of our value patterns in the context section
        for (const valuePattern of valuesToSearch) {
          if (contextSection.includes(valuePattern)) {
            console.log('Found value with context:', valuePattern);
            return patternValue;
          }
        }
      }
    }

    // Fallback: look for any of our value patterns anywhere in the content
    for (const valuePattern of valuesToSearch) {
      if (cleanContent.includes(valuePattern)) {
        console.log('Found value in content:', valuePattern);
        return patternValue;
      }
    }

    // Last resort: try the original pattern matching
    if (cleanContent.includes(pattern.pattern)) {
      console.log('Found original pattern in content:', pattern.pattern);
      return extractNumericValue(pattern.pattern, isPercentage);
    }

    console.log('Pattern not found in content');
    return null;
  };

  // Helper function to extract numeric value from text (improved version)
  const extractNumericValue = (text: string, isPercentage: boolean = false): number | null => {
    if (!text) return null;
    
    // Remove extra whitespace and normalize
    let cleanText = text.trim().replace(/\s+/g, ' ');
    
    // Remove HTML tags and CSS content that might be included in pattern
    cleanText = cleanText.replace(/<[^>]*>/g, ''); // Remove HTML tags
    cleanText = cleanText.replace(/style="[^"]*"/g, ''); // Remove style attributes
    cleanText = cleanText.replace(/class="[^"]*"/g, ''); // Remove class attributes
    cleanText = cleanText.replace(/font-weight:\s*\d+/g, ''); // Remove font-weight specifically
    cleanText = cleanText.replace(/[{}();:]/g, ''); // Remove CSS syntax characters
    
    console.log('Pattern extraction - Original text:', text);
    console.log('Pattern extraction - Cleaned text:', cleanText);
    
    if (isPercentage) {
      const percentMatch = cleanText.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch) {
        console.log('Pattern extraction - Found percentage:', percentMatch[1]);
        return parseFloat(percentMatch[1]);
      }
    }
    
    // For currency/numeric values (with K, M, B multipliers) - prioritize currency format
    const currencyMatch = cleanText.match(/\$?([\d,]+(?:\.\d+)?)\s*([KMB])?/i);
    if (currencyMatch) {
      const number = parseFloat(currencyMatch[1].replace(/,/g, ''));
      const multiplier = currencyMatch[2]?.toUpperCase();
      
      console.log('Pattern extraction - Found currency:', currencyMatch[1], 'multiplier:', multiplier);
      
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
      console.log('Pattern extraction - Found dollar amount:', dollarMatch[1], 'parsed as:', number);
      return number;
    }
    
    // Fallback: try to extract any number, but prioritize larger numbers
    const allNumbers = cleanText.match(/\d+(?:\.\d+)?/g);
    if (allNumbers && allNumbers.length > 0) {
      // Sort by value and pick the largest number (likely the actual value we want)
      const sortedNumbers = allNumbers.map(n => parseFloat(n)).sort((a, b) => b - a);
      console.log('Pattern extraction - Found numbers:', allNumbers, 'picking largest:', sortedNumbers[0]);
      return sortedNumbers[0];
    }
    
    return null;
  };

  // Try both markdown and HTML content
  const allContent = markdownContent + '\n' + htmlContent;

  // Extract APY using stored pattern
  if (apyPattern) {
    console.log('Extracting APY with pattern:', apyPattern.pattern);
    const apyValue = extractWithPattern(allContent, apyPattern, true);
    if (apyValue !== null) {
      result.apy = apyValue;
      result.asset_found = true;
      console.log('APY extracted from pattern:', apyValue);
    }
  }

  // Extract TVL using stored pattern  
  if (tvlPattern) {
    console.log('Extracting TVL with pattern:', tvlPattern.pattern);
    const tvlValue = extractWithPattern(allContent, tvlPattern, false);
    if (tvlValue !== null) {
      result.tvl = tvlValue;
      result.asset_found = true;
      console.log('TVL extracted from pattern:', tvlValue);
    }
  }

  return result;
}

function parseContentForAssetData(
  content: string,
  targetAsset: string,
  apyFieldName: string,
  tvlFieldName: string,
  tvlSuffix?: string
): Pick<ScrapedData, 'apy' | 'tvl' | 'asset_found'> {
  const result: Pick<ScrapedData, 'apy' | 'tvl' | 'asset_found'> = {
    asset_found: false
  };

  console.log('Parsing content for:', { targetAsset, apyFieldName, tvlFieldName });
  console.log('Content preview:', content.substring(0, 1000));

  // Convert to lowercase for case-insensitive matching
  const lowerContent = content.toLowerCase();
  const lowerAsset = targetAsset.toLowerCase();
  const lowerAPYField = apyFieldName.toLowerCase();
  const lowerTVLField = tvlFieldName.toLowerCase();

  // Check if the target asset is mentioned in the content
  if (lowerContent.includes(lowerAsset)) {
    result.asset_found = true;
    console.log('Target asset found in content');
  }

  // Extract APY and TVL values using multiple strategies
  console.log('Attempting to extract APY...');
  const apyMatch = extractPercentageValue(content, apyFieldName);
  if (apyMatch !== null) {
    result.apy = apyMatch;
    console.log('APY found:', apyMatch);
  }
  
  console.log('Attempting to extract TVL...');
  const tvlMatch = extractCurrencyValue(content, tvlFieldName, tvlSuffix);
  if (tvlMatch !== null) {
    result.tvl = tvlMatch;
    console.log('TVL found:', tvlMatch);
  }

  // If no specific field names found, try generic patterns
  if (!result.apy) {
    console.log('Trying generic APY patterns...');
    const genericAPY = extractGenericPercentage(content);
    if (genericAPY !== null) {
      result.apy = genericAPY;
      console.log('Generic APY found:', genericAPY);
    }
  }

  if (!result.tvl) {
    console.log('Trying generic TVL patterns...');
    const genericTVL = extractGenericCurrency(content, tvlSuffix);
    if (genericTVL !== null) {
      result.tvl = genericTVL;
      console.log('Generic TVL found:', genericTVL);
    }
  }

  console.log('Final result:', result);
  return result;
}

function extractPercentageValue(content: string, fieldName: string): number | null {
  console.log(`Looking for APY with field name: "${fieldName}"`);
  
  // Look for patterns like "APY: 5.2%" or "5.2% APY" or table cell with percentage
  const patterns = [
    new RegExp(`${fieldName}[:\\s]*([0-9]+\\.?[0-9]*)%`, 'i'),
    new RegExp(`([0-9]+\\.?[0-9]*)%[\\s]*${fieldName}`, 'i'),
    new RegExp(`\\|[^|]*${fieldName}[^|]*\\|[^|]*([0-9]+\\.?[0-9]*)%`, 'i'),
    // Generic percentage pattern near the field name
    new RegExp(`${fieldName}[^0-9]*([0-9]+\\.?[0-9]*)%`, 'i'),
    // HTML structure: field name followed by percentage in next element
    new RegExp(`${fieldName}[^>]*>.*?([0-9]+\\.?[0-9]*)%`, 'i'),
    // Reverse: percentage followed by field name
    new RegExp(`([0-9]+\\.?[0-9]*)%[^<]*<[^>]*${fieldName}`, 'i')
  ];

  for (const pattern of patterns) {
    console.log(`Trying pattern: ${pattern}`);
    const match = content.match(pattern);
    if (match && match[1]) {
      console.log(`Pattern matched: ${match[0]}, extracted: ${match[1]}`);
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        return value;
      }
    }
  }

  return null;
}

function extractGenericPercentage(content: string): number | null {
  console.log('Looking for generic percentage patterns...');
  
  // Look for common APY-related terms
  const apyTerms = ['apy', 'yield', 'return', 'interest', 'rate'];
  
  for (const term of apyTerms) {
    const patterns = [
      // Term followed by percentage
      new RegExp(`${term}[^0-9]*([0-9]+\\.?[0-9]*)%`, 'i'),
      // Percentage followed by term
      new RegExp(`([0-9]+\\.?[0-9]*)%[^a-z]*${term}`, 'i'),
      // HTML: term in one element, percentage in nearby element
      new RegExp(`${term}[^>]*>[^<]*<[^>]*>.*?([0-9]+\\.?[0-9]*)%`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        console.log(`Generic APY pattern matched: ${match[0]}, extracted: ${match[1]}`);
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value >= 0 && value <= 100) {
          return value;
        }
      }
    }
  }
  
  return null;
}

function extractCurrencyValue(content: string, fieldName: string, customSuffix?: string): number | null {
  console.log(`Looking for TVL with field name: "${fieldName}" and custom suffix: "${customSuffix || 'none'}"`);
  
  // If custom suffix is provided, look for that pattern instead of USD
  if (customSuffix) {
    const patterns = [
      // Look for patterns like "TVL: 11,831,691 HYPE" or "11,831,691 HYPE TVL"
      new RegExp(`${fieldName}[:\\s]*([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}`, 'i'),
      new RegExp(`([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}[\\s]*${fieldName}`, 'i'),
      // HTML structure patterns
      new RegExp(`${fieldName}[^>]*>.*?([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}`, 'i'),
      new RegExp(`([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}[^<]*<[^>]*${fieldName}`, 'i'),
      // Table patterns
      new RegExp(`\\|[^|]*${fieldName}[^|]*\\|[^|]*([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}`, 'i'),
      // Generic patterns near field name
      new RegExp(`${fieldName}[^0-9]*([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}`, 'i')
    ];

    for (const pattern of patterns) {
      console.log(`Trying custom suffix pattern: ${pattern}`);
      const match = content.match(pattern);
      if (match && match[1]) {
        console.log(`Custom suffix pattern matched: ${match[0]}, extracted number: ${match[1]}`);
        const value = parseFloat(match[1].replace(/,/g, ''));
        
        if (!isNaN(value) && value >= 0) {
          console.log(`Final custom suffix value: ${Math.round(value)}`);
          return Math.round(value);
        }
      }
    }
  }

  // Default USD patterns
  const patterns = [
    new RegExp(`${fieldName}[:\\s]*\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)`, 'i'),
    new RegExp(`\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)[\\s]*${fieldName}`, 'i'),
    new RegExp(`\\|[^|]*${fieldName}[^|]*\\|[^|]*\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)`, 'i'),
    // Generic currency pattern near the field name
    new RegExp(`${fieldName}[^$]*\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)`, 'i'),
    // HTML structure: field name followed by currency in next element
    new RegExp(`${fieldName}[^>]*>.*?\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)`, 'i'),
    // Reverse: currency followed by field name
    new RegExp(`\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)[^<]*<[^>]*${fieldName}`, 'i')
  ];

  for (const pattern of patterns) {
    console.log(`Trying pattern: ${pattern}`);
    const match = content.match(pattern);
    if (match && match[1]) {
      console.log(`Pattern matched: ${match[0]}, extracted number: ${match[1]}, suffix: ${match[2] || 'none'}`);
      let value = parseFloat(match[1].replace(/,/g, ''));
      
      // Handle K/M/B suffixes - check the captured suffix group
      const suffix = (match[2] || '').toLowerCase();
      console.log(`Processing suffix: "${suffix}"`);
      
      if (suffix === 'k') {
        value *= 1000;
        console.log(`Applied K multiplier: ${value}`);
      } else if (suffix === 'm') {
        value *= 1000000;
        console.log(`Applied M multiplier: ${value}`);
      } else if (suffix === 'b') {
        value *= 1000000000;
        console.log(`Applied B multiplier: ${value}`);
      }
      
      if (!isNaN(value) && value >= 0) {
        console.log(`Final value: ${Math.round(value)}`);
        return Math.round(value);
      }
    }
  }

  return null;
}

function extractGenericCurrency(content: string, customSuffix?: string): number | null {
  console.log(`Looking for generic currency patterns with custom suffix: "${customSuffix || 'none'}"`);
  
  // Look for common TVL-related terms
  const tvlTerms = ['tvl', 'total value locked', 'liquidity', 'volume', 'market cap'];
  
  for (const term of tvlTerms) {
    // If custom suffix is provided, look for that pattern
    if (customSuffix) {
      const customPatterns = [
        // Term followed by number with custom suffix
        new RegExp(`${term}[^0-9]*([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}`, 'i'),
        // Number with custom suffix followed by term
        new RegExp(`([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}[^a-z]*${term}`, 'i'),
        // HTML: term in one element, number with custom suffix in nearby element
        new RegExp(`${term}[^>]*>[^<]*<[^>]*>.*?([0-9,]+(?:\\.[0-9]+)?)\\s*${customSuffix}`, 'i')
      ];
      
      for (const pattern of customPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          console.log(`Generic custom suffix pattern matched: ${match[0]}, extracted number: ${match[1]}`);
          const value = parseFloat(match[1].replace(/,/g, ''));
          
          if (!isNaN(value) && value >= 0) {
            console.log(`Final generic custom suffix value: ${Math.round(value)}`);
            return Math.round(value);
          }
        }
      }
    }

    // Default USD patterns
    const patterns = [
      // Term followed by currency
      new RegExp(`${term}[^$]*\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)`, 'i'),
      // Currency followed by term
      new RegExp(`\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)[^a-z]*${term}`, 'i'),
      // HTML: term in one element, currency in nearby element
      new RegExp(`${term}[^>]*>[^<]*<[^>]*>.*?\\$([0-9,]+(?:\\.[0-9]+)?)([KMBkmb]?)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        console.log(`Generic TVL pattern matched: ${match[0]}, extracted number: ${match[1]}, suffix: ${match[2] || 'none'}`);
        let value = parseFloat(match[1].replace(/,/g, ''));
        
        // Handle K/M/B suffixes - check the captured suffix group
        const suffix = (match[2] || '').toLowerCase();
        console.log(`Processing generic suffix: "${suffix}"`);
        
        if (suffix === 'k') {
          value *= 1000;
          console.log(`Applied generic K multiplier: ${value}`);
        } else if (suffix === 'm') {
          value *= 1000000;
          console.log(`Applied generic M multiplier: ${value}`);
        } else if (suffix === 'b') {
          value *= 1000000000;
          console.log(`Applied generic B multiplier: ${value}`);
        }
        
        if (!isNaN(value) && value >= 0) {
          console.log(`Final generic value: ${Math.round(value)}`);
          return Math.round(value);
        }
      }
    }
  }
  
  return null;
}