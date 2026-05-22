import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StrategyExecutor } from '@/components/StrategyExecutor'
import { useWallet } from '@/hooks/useWallet'
import { Strategy } from '@/hooks/useTransaction'
import { useFeaturedAssets } from '@/hooks/useFeaturedAssets'
import { Wallet, TestTube, Zap, Shield, TrendingUp } from 'lucide-react'

export const DeFiTesting: React.FC = () => {
  const { isConnected, connect, walletAddress, displayAddress } = useWallet()
  const { data: featuredAssets, isLoading } = useFeaturedAssets()
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)

  // Mock strategies for testing - in real implementation, these would come from your database
  const mockStrategies: Strategy[] = [
    {
      id: 'hyperlend-btc',
      name: 'Hyperlend BTC Strategy',
      protocol: 'Hyperlend',
      estimatedGas: '0.05 ETH',
      estimatedTime: '~5 minutes',
      steps: [
        {
          id: 'approve-btc',
          title: 'Approve BTC',
          description: 'Approve BTC tokens for Hyperlend contract',
          status: 'pending'
        },
        {
          id: 'deposit-btc',
          title: 'Deposit BTC',
          description: 'Deposit BTC into Hyperlend protocol',
          status: 'pending'
        },
        {
          id: 'enable-earn',
          title: 'Enable Earning',
          description: 'Enable earning rewards on deposited BTC',
          status: 'pending'
        }
      ]
    },
    {
      id: 'felix-eth-staking',
      name: 'Felix ETH Staking',
      protocol: 'Felix',
      estimatedGas: '0.08 ETH',
      estimatedTime: '~8 minutes',
      steps: [
        {
          id: 'wrap-eth',
          title: 'Wrap ETH',
          description: 'Convert ETH to WETH for staking',
          status: 'pending'
        },
        {
          id: 'approve-weth',
          title: 'Approve WETH',
          description: 'Approve WETH for Felix staking contract',
          status: 'pending'
        },
        {
          id: 'stake-weth',
          title: 'Stake WETH',
          description: 'Stake WETH in Felix protocol',
          status: 'pending'
        },
        {
          id: 'claim-rewards',
          title: 'Setup Auto-Claim',
          description: 'Enable automatic reward claiming',
          status: 'pending'
        }
      ]
    }
  ]

  const handleStrategySelect = (strategyId: string) => {
    const strategy = mockStrategies.find(s => s.id === strategyId)
    setSelectedStrategy(strategy || null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <TestTube className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">DeFi Testing Lab</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test and execute DeFi strategies with real wallet interactions. 
              Connect your wallet and try multi-step protocol integrations safely.
            </p>
          </div>

          {/* Wallet Connection Status */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Wallet Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Address:</span>
                    <Badge variant="secondary" className="font-mono">
                      {displayAddress}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Connected & Ready</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to start testing DeFi strategies
                  </p>
                  <Button onClick={connect} className="w-full">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Real Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Execute actual blockchain transactions with gas estimation and transaction tracking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Multi-Step Safety</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Each step is validated before execution with proper error handling and recovery options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Strategy Testing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Test complex DeFi strategies across multiple protocols with real-time feedback.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Selection */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Select Strategy to Test</CardTitle>
                <CardDescription>
                  Choose a DeFi strategy to execute step-by-step
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handleStrategySelect}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choose a strategy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStrategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{strategy.protocol}</Badge>
                          <span>{strategy.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Strategy Executor */}
          {selectedStrategy && isConnected && (
            <div className="flex justify-center">
              <StrategyExecutor strategy={selectedStrategy} />
            </div>
          )}

          {/* Featured Assets from Database */}
          {featuredAssets && featuredAssets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Strategies from Database</CardTitle>
                <CardDescription>
                  These are the featured strategies from your database that could be integrated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredAssets.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{asset.asset}</h4>
                        <Badge variant="secondary">{asset.protocol}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        APY: {asset.apy}% | Risk: {asset.risk_level}
                      </p>
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Integration Coming Soon
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}