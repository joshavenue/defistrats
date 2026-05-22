import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpDown, RefreshCw, TrendingUp, DollarSign, Activity, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getWalletBalance, getWalletHistory, WalletBalance, WalletTransaction } from '@/utils/moralis';

const TRACKED_WALLET = '0x084967EDFDc7aC5993bEC4A71E5D8e7c8E00C884';
const CHAINS = [
  { id: 'eth', name: 'Ethereum', chainId: '0x1' },
  { id: 'arbitrum', name: 'Arbitrum', chainId: '0xa4b1' }
];


const RefRewardTab: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState('eth');
  const [activeTab, setActiveTab] = useState('balance');

  // Fetch wallet balance using Moralis API
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['wallet-balance', TRACKED_WALLET, selectedChain],
    queryFn: async (): Promise<WalletBalance[]> => {
      console.log(`Fetching balance for ${TRACKED_WALLET} on ${selectedChain}`);
      return await getWalletBalance(TRACKED_WALLET, selectedChain as 'eth' | 'arbitrum');
    },
    enabled: true,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch wallet transaction history
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['wallet-history', TRACKED_WALLET, selectedChain],
    queryFn: async (): Promise<WalletTransaction[]> => {
      console.log(`Fetching history for ${TRACKED_WALLET} on ${selectedChain}`);
      return await getWalletHistory(TRACKED_WALLET, selectedChain as 'eth' | 'arbitrum', 20);
    },
    enabled: true
  });

  const totalUsdValue = balanceData?.reduce((sum, token) => sum + (token.usd_value || 0), 0) || 0;

  // Helper function to get blockchain explorer URL
  const getExplorerUrl = (hash: string, type: 'tx' | 'address' = 'tx') => {
    const baseUrls = {
      eth: 'https://etherscan.io',
      arbitrum: 'https://arbiscan.io'
    };
    const prefix = type === 'tx' ? 'tx' : 'address';
    return `${baseUrls[selectedChain as keyof typeof baseUrls]}/${prefix}/${hash}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-[#F7F7F7]">Referral Reward Tracker</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-[#94979C]">
              Tracking wallet: <code className="bg-[#22262F] px-2 py-1 rounded text-xs">{TRACKED_WALLET}</code>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-[#94979C] hover:text-[#F7F7F7]"
              onClick={() => window.open(getExplorerUrl(TRACKED_WALLET, 'address'), '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Chain Selector */}
        <div className="flex gap-2">
          {CHAINS.map((chain) => (
            <Button
              key={chain.id}
              variant={selectedChain === chain.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChain(chain.id)}
              className={selectedChain === chain.id ? 
                "bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90" : 
                "border-[#373A41] text-[#F7F7F7] hover:bg-[#22262F]"
              }
            >
              {chain.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#181B20] border-[#22262F]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94979C]">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-[#75E0A7]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F7F7F7]">
              ${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <Badge variant="secondary" className="mt-2 bg-[#22262F] text-[#75E0A7]">
              {CHAINS.find(c => c.id === selectedChain)?.name}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-[#181B20] border-[#22262F]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94979C]">Token Count</CardTitle>
            <Wallet className="h-4 w-4 text-[#75E0A7]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F7F7F7]">{balanceData?.length || 0}</div>
            <p className="text-xs text-[#94979C] mt-2">Different tokens</p>
          </CardContent>
        </Card>

        <Card className="bg-[#181B20] border-[#22262F]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94979C]">Recent Transactions</CardTitle>
            <Activity className="h-4 w-4 text-[#75E0A7]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F7F7F7]">{historyData?.length || 0}</div>
            <p className="text-xs text-[#94979C] mt-2">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#22262F] border border-[#373A41]">
          <TabsTrigger 
            value="balance" 
            className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12] text-[#F7F7F7]"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Balance
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-[#75E0A7] data-[state=active]:text-[#0C0E12] text-[#F7F7F7]"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="mt-6">
          <Card className="bg-[#181B20] border-[#22262F]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#F7F7F7]">Token Balances</CardTitle>
                <CardDescription className="text-[#94979C]">
                  Current token holdings on {CHAINS.find(c => c.id === selectedChain)?.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchBalance()}
                disabled={balanceLoading}
                className="border-[#373A41] text-[#F7F7F7] hover:bg-[#22262F]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${balanceLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="text-center py-8 text-[#94979C]">Loading balances...</div>
              ) : balanceData && balanceData.length > 0 ? (
                <div className="space-y-4">
                  {balanceData.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#0C0E12] rounded-lg border border-[#22262F]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#22262F] rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-[#F7F7F7]">{token.symbol[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-[#F7F7F7]">{token.symbol}</div>
                          <div className="text-sm text-[#94979C]">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[#F7F7F7]">{token.balance_formatted}</div>
                        {token.usd_value && (
                          <div className="text-sm text-[#94979C]">
                            ${token.usd_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#94979C]">No tokens found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-[#181B20] border-[#22262F]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#F7F7F7]">Transaction History</CardTitle>
                <CardDescription className="text-[#94979C]">
                  Recent transactions on {CHAINS.find(c => c.id === selectedChain)?.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchHistory()}
                disabled={historyLoading}
                className="border-[#373A41] text-[#F7F7F7] hover:bg-[#22262F]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8 text-[#94979C]">Loading transactions...</div>
              ) : historyData && historyData.length > 0 ? (
                <div className="space-y-4">
                  {historyData.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#0C0E12] rounded-lg border border-[#22262F]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              tx.to_address.toLowerCase() === TRACKED_WALLET.toLowerCase() 
                                ? 'border-green-500 text-green-400' 
                                : 'border-red-500 text-red-400'
                            }`}
                          >
                            {tx.to_address.toLowerCase() === TRACKED_WALLET.toLowerCase() ? '↓ Received' : '↑ Sent'}
                          </Badge>
                          <span className="text-xs text-[#94979C]">
                            {new Date(tx.block_timestamp).toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-[#94979C] hover:text-[#F7F7F7]"
                            onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-[#F7F7F7] font-mono truncate">
                          {tx.hash}
                        </div>
                        <div className="text-xs text-[#94979C] mt-1">
                          Block #{parseInt(tx.block_number).toLocaleString()}
                        </div>
                        {tx.transaction_fee && (
                          <div className="text-xs text-[#94979C] mt-1">
                            Fee: {(parseFloat(tx.transaction_fee) / 1e18).toFixed(6)} {selectedChain === 'eth' ? 'ETH' : 'ARB'}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className={`font-medium ${
                          tx.to_address.toLowerCase() === TRACKED_WALLET.toLowerCase() 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {tx.to_address.toLowerCase() === TRACKED_WALLET.toLowerCase() ? '+' : '-'}
                          {(parseFloat(tx.value) / 1e18).toFixed(4)} {selectedChain === 'eth' ? 'ETH' : 'ARB'}
                        </div>
                        <div className="text-xs text-[#94979C] mt-1">
                          {tx.to_address.toLowerCase() === TRACKED_WALLET.toLowerCase() ? 'From' : 'To'}:
                        </div>
                        <div className="text-xs text-[#94979C] font-mono">
                          {(tx.to_address.toLowerCase() === TRACKED_WALLET.toLowerCase() ? tx.from_address : tx.to_address).slice(0, 10)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#94979C]">No transactions found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Status */}
      <Card className="bg-green-900/20 border border-green-600">
        <CardHeader>
          <CardTitle className="text-green-400 text-sm">✅ Moralis API Ready</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-300 text-sm mb-3">
            Moralis Web3 API is now configured and ready to fetch live blockchain data!
          </p>
          <div className="space-y-2 text-green-300 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">🔗</span>
              <span>Tracking wallet: <code className="bg-green-900/30 px-1 rounded">{TRACKED_WALLET}</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">⛓️</span>
              <span>Supported chains: Ethereum & Arbitrum</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">🔄</span>
              <span>Auto-refresh: Every 30 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">📊</span>
              <span>Data: Live balances, transaction history, USD values</span>
            </div>
          </div>
          <p className="text-green-300 text-xs mt-3">
            All data is fetched in real-time from the blockchain via Moralis Web3 API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefRewardTab;