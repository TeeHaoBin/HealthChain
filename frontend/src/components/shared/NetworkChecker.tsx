'use client'

import { useChainId, useSwitchChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function NetworkChecker() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Check if user is on the correct network (Sepolia)
  if (chainId === sepolia.id) {
    return null // Don't show anything if on correct network
  }

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Wrong Network Detected
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please switch to Sepolia testnet to use this healthcare platform.
          </p>
          <Button
            size="sm"
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="mt-2 bg-yellow-600 hover:bg-yellow-700"
          >
            Switch to Sepolia
          </Button>
        </div>
      </div>
    </div>
  )
}