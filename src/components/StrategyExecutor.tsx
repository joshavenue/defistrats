import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { Strategy, TransactionStep, useTransaction } from '@/hooks/useTransaction'
import { useWallet } from '@/hooks/useWallet'

interface StrategyExecutorProps {
  strategy: Strategy
}

export const StrategyExecutor: React.FC<StrategyExecutorProps> = ({ strategy }) => {
  const { isConnected } = useWallet()
  const { currentStep, isExecuting, txHistory, executeStrategy, resetExecution } = useTransaction()

  const getStepIcon = (step: TransactionStep, index: number) => {
    const historyStep = txHistory.find(h => h.id === step.id)
    
    if (historyStep?.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (historyStep?.status === 'failed') {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    } else if (index === currentStep && isExecuting) {
      return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepStatus = (step: TransactionStep, index: number) => {
    const historyStep = txHistory.find(h => h.id === step.id)
    
    if (historyStep?.status === 'completed') return 'completed'
    if (historyStep?.status === 'failed') return 'failed'
    if (index === currentStep && isExecuting) return 'active'
    if (index < currentStep) return 'completed'
    return 'pending'
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {strategy.name}
          <Badge variant="secondary">{strategy.protocol}</Badge>
        </CardTitle>
        <CardDescription>
          Estimated Gas: {strategy.estimatedGas} • Time: {strategy.estimatedTime}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Steps List */}
        <div className="space-y-3">
          {strategy.steps.map((step, index) => {
            const status = getStepStatus(step, index)
            const historyStep = txHistory.find(h => h.id === step.id)
            
            return (
              <div 
                key={step.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  status === 'active' ? 'border-blue-500 bg-blue-50' :
                  status === 'completed' ? 'border-green-500 bg-green-50' :
                  status === 'failed' ? 'border-red-500 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                {getStepIcon(step, index)}
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-500">{step.description}</p>
                  
                  {historyStep?.txHash && (
                    <div className="mt-2 flex items-center space-x-2">
                      <a
                        href={`https://etherscan.io/tx/${historyStep.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Transaction <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
                
                <Badge 
                  variant={
                    status === 'completed' ? 'default' :
                    status === 'failed' ? 'destructive' :
                    status === 'active' ? 'secondary' :
                    'outline'
                  }
                  className="text-xs"
                >
                  {status}
                </Badge>
              </div>
            )
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          {!isConnected ? (
            <p className="text-sm text-gray-500">Please connect your wallet to continue</p>
          ) : (
            <>
              <Button 
                onClick={() => executeStrategy(strategy)}
                disabled={isExecuting}
                className="flex-1"
              >
                {isExecuting ? 'Executing...' : 'Start Execution'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={resetExecution}
                disabled={isExecuting}
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}