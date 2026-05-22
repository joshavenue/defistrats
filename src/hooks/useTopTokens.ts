import { useQuery } from '@tanstack/react-query';
import Moralis from 'moralis';
import { initializeMoralis } from '@/utils/moralis';

export interface TopToken {
  address: string;
  symbol: string;
  name: string;
  price_24h_percent_change: number;
  price_24h_usd: number;
  market_cap: number;
  logo?: string;
}


const getTopTokensByMarketCap = async (): Promise<TopToken[]> => {
  try {
    console.log('🔍 Starting Moralis token fetch...');
    await initializeMoralis();
    
    // Check if we're in production and log environment
    const isDev = process.env.NODE_ENV === 'development';
    console.log(`🌍 Environment: ${process.env.NODE_ENV}, isDev: ${isDev}`);
    
    // Try to fetch top ERC20 tokens by market cap
    console.log('📡 Calling Moralis API...');
    const response = await Moralis.EvmApi.marketData.getTopERC20TokensByMarketCap();
    
    console.log('✅ Top tokens fetched from Moralis successfully', response.result?.length || 0, 'tokens');
    
    if (!response.result || response.result.length === 0) {
      console.warn('⚠️ No tokens returned from Moralis API, returning empty array');
      return [];
    }
    
    return response.result.map((token: any) => ({
      address: token.tokenAddress,
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || 'Unknown Token',
      price_24h_percent_change: token.price24hPercentChange || 0,
      price_24h_usd: token.priceUsd || 0,
      market_cap: token.marketCap || 0,
      logo: token.logo
    }));
  } catch (error) {
    console.error('❌ Error fetching top tokens from Moralis:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    console.warn('⚠️ No token data available, returning empty array');
    return [];
  }
};

export const useTopTokens = () => {
  return useQuery({
    queryKey: ['top-tokens'],
    queryFn: getTopTokensByMarketCap,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days (1 week)
    gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryOnMount: false,
    refetchOnReconnect: false
  });
};