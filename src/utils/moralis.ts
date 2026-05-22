
import Moralis from 'moralis';
import { supabase } from '@/integrations/supabase/client';

let isInitialized = false;
let cachedApiKey: string | null = null;

// Fetch API key from Supabase app_config table
const getMoralisApiKey = async (): Promise<string | null> => {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key_value')
      .eq('key_name', 'VITE_MORALIS_API_KEY')
      .single();

    if (error) {
      console.error('❌ Error fetching Moralis API key from Supabase:', error);
      return null;
    }

    if (data?.key_value) {
      cachedApiKey = data.key_value;
      console.log('✅ Moralis API key fetched from Supabase');
      return cachedApiKey;
    }

    console.warn('⚠️ Moralis API key not found in Supabase app_config');
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch Moralis API key from Supabase:', error);
    return null;
  }
};

const initializeMoralis = async () => {
  if (!isInitialized) {
    const apiKey = await getMoralisApiKey();
    
    if (apiKey) {
      try {
        await Moralis.start({ apiKey });
        isInitialized = true;
        console.log('✅ Moralis initialized successfully');
        console.log('🔑 API Key configured:', apiKey.substring(0, 20) + '...');
      } catch (error) {
        console.error('❌ Failed to initialize Moralis:', error);
      }
    } else {
      console.warn('⚠️ Moralis API key not found in Supabase');
    }
  }
};

export interface WalletBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  usd_price?: number;
  usd_value?: number;
}

export interface WalletTransaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  gas: string;
  gas_price: string;
  block_timestamp: string;
  block_number: string;
  transaction_fee?: string;
}

export const getWalletBalance = async (
  address: string,
  chain: 'eth' | 'arbitrum' = 'eth'
): Promise<WalletBalance[]> => {
  await initializeMoralis();
  
  const apiKey = await getMoralisApiKey();
  if (!apiKey) {
    // Return mock data when API key is not configured
    console.warn('⚠️ Moralis API key not configured, returning mock data');
    return getMockBalanceData(chain);
  }

  try {
    const chainId = chain === 'eth' ? '0x1' : '0xa4b1'; // Ethereum mainnet or Arbitrum
    
    const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      address,
      chain: chainId,
    });

    console.log('✅ Live data fetched successfully from Moralis');
    
    return response.result.map((token: any) => ({
      token_address: token.tokenAddress?.checksum || '0x0000000000000000000000000000000000000000',
      symbol: token.symbol || (chain === 'eth' ? 'ETH' : 'ARB'),
      name: token.name || (chain === 'eth' ? 'Ethereum' : 'Arbitrum'),
      logo: token.logo,
      thumbnail: token.thumbnail,
      decimals: token.decimals || 18,
      balance: token.balance || '0',
      balance_formatted: token.balanceFormatted || '0',
      usd_price: token.usdPrice ? parseFloat(token.usdPrice) : undefined,
      usd_value: token.usdValue ? parseFloat(token.usdValue) : undefined,
    }));
  } catch (error) {
    console.error('❌ Error fetching wallet balance:', error);
    console.warn('⚠️ Falling back to mock data due to API error');
    return getMockBalanceData(chain);
  }
};

export const getWalletHistory = async (
  address: string,
  chain: 'eth' | 'arbitrum' = 'eth',
  limit: number = 10
): Promise<WalletTransaction[]> => {
  await initializeMoralis();
  
  const apiKey = await getMoralisApiKey();
  if (!apiKey) {
    // Return mock data when API key is not configured
    console.warn('⚠️ Moralis API key not configured, returning mock data');
    return getMockHistoryData(address, chain);
  }

  try {
    const chainId = chain === 'eth' ? '0x1' : '0xa4b1'; // Ethereum mainnet or Arbitrum
    
    const response = await Moralis.EvmApi.wallets.getWalletHistory({
      address,
      chain: chainId,
      limit,
      order: 'DESC',
    });

    console.log('✅ Live transaction history fetched successfully from Moralis');

    return response.result.map((tx: any) => ({
      hash: tx.hash,
      from_address: tx.fromAddress?.checksum || '',
      to_address: tx.toAddress?.checksum || '',
      value: tx.value || '0',
      gas: tx.gas || '0',
      gas_price: tx.gasPrice || '0',
      block_timestamp: tx.blockTimestamp,
      block_number: tx.blockNumber,
      transaction_fee: tx.transactionFee,
    }));
  } catch (error) {
    console.error('❌ Error fetching wallet history:', error);
    console.warn('⚠️ Falling back to mock data due to API error');
    return getMockHistoryData(address, chain);
  }
};

// Mock data functions for development/demo purposes
const getMockBalanceData = (chain: 'eth' | 'arbitrum'): WalletBalance[] => {
  const baseData = [
    {
      token_address: '0x0000000000000000000000000000000000000000',
      symbol: chain === 'eth' ? 'ETH' : 'ARB',
      name: chain === 'eth' ? 'Ethereum' : 'Arbitrum',
      decimals: 18,
      balance: '1234567890123456789',
      balance_formatted: '1.234',
      usd_price: chain === 'eth' ? 3500 : 1.2,
      usd_value: chain === 'eth' ? 4319 : 1.48
    }
  ];

  if (chain === 'eth') {
    baseData.push(
      {
        token_address: '0xA0b86a33E6417f51De4d3d4b2c82F7e6Ea2B0a5e',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '5000000000',
        balance_formatted: '5,000.00',
        usd_price: 1.0,
        usd_value: 5000
      },
      {
        token_address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 18,
        balance: '25000000000000000000',
        balance_formatted: '25.00',
        usd_price: 18.50,
        usd_value: 462.50
      }
    );
  } else {
    baseData.push(
      {
        token_address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        symbol: 'USDC.e',
        name: 'USD Coin (Arbitrum)',
        decimals: 6,
        balance: '2500000000',
        balance_formatted: '2,500.00',
        usd_price: 1.0,
        usd_value: 2500
      }
    );
  }

  return baseData;
};

const getMockHistoryData = (address: string, chain: 'eth' | 'arbitrum'): WalletTransaction[] => {
  const now = new Date();
  const baseTransactions = [];

  // Generate some mock transactions
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(now.getTime() - (i * 3600000)); // Each transaction 1 hour apart
    baseTransactions.push({
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from_address: i % 2 === 0 ? address : '0x1234567890123456789012345678901234567890',
      to_address: i % 2 === 0 ? '0x1234567890123456789012345678901234567890' : address,
      value: (Math.random() * 1e18).toString(),
      gas: '21000',
      gas_price: (Math.random() * 50e9).toString(),
      block_timestamp: timestamp.toISOString(),
      block_number: (18500000 - i).toString(),
      transaction_fee: (21000 * Math.random() * 50e9).toString(),
    });
  }

  return baseTransactions;
};

export { initializeMoralis };
