import { useState } from 'react'
import { useWallet } from './useWallet'
import { toast } from 'sonner'

export interface TransactionStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  txHash?: string
  gasEstimate?: string
}

export interface Strategy {
  id: string
  name: string
  protocol: string
  steps: TransactionStep[]
  estimatedGas: string
  estimatedTime: string
}

export const useTransaction = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [txHistory, setTxHistory] = useState<TransactionStep[]>([])
  const { isConnected, walletAddress } = useWallet()

  const executeStep = async (step: TransactionStep) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return false
    }

    setIsExecuting(true)
    
    try {
      // Simulate transaction execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const completedStep = {
        ...step,
        status: 'completed' as const,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`
      }
      
      setTxHistory(prev => [...prev, completedStep])
      toast.success(`Step "${step.title}" completed successfully`)
      
      return true
    } catch (error) {
      const failedStep = {
        ...step,
        status: 'failed' as const
      }
      
      setTxHistory(prev => [...prev, failedStep])
      toast.error(`Step "${step.title}" failed`)
      
      return false
    } finally {
      setIsExecuting(false)
    }
  }

  const executeStrategy = async (strategy: Strategy) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setCurrentStep(0)
    setTxHistory([])

    for (let i = 0; i < strategy.steps.length; i++) {
      setCurrentStep(i)
      const success = await executeStep(strategy.steps[i])
      
      if (!success) {
        break
      }
    }
  }

  const resetExecution = () => {
    setCurrentStep(0)
    setTxHistory([])
    setIsExecuting(false)
  }

  return {
    currentStep,
    isExecuting,
    txHistory,
    executeStep,
    executeStrategy,
    resetExecution
  }
}