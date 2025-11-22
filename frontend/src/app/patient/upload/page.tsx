"use client"

import { useAccount } from "wagmi"
import RoleGuard from '@/components/auth/RoleGuard'
import FileUploader from '@/components/forms/FileUploader'
import WalletConnect from "@/components/auth/WalletConnect"
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from "@/components/ui/card"
import { Shield, Lock, Database, Globe } from "lucide-react"

export default function PatientUploadPage() {
  const { isConnected, address } = useAccount()

  return (
    <RoleGuard allowedRoles={['patient']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Upload Health Records</h1>
            <p className="mt-2 text-gray-600">
              Securely upload and store your medical documents with end-to-end encryption
            </p>
          </div>
          
          {/* Technology Stack Info */}
          <Card className="p-6 mb-6 border-blue-200 bg-blue-50">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">🔒 Secure Upload Technology</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">Lit Protocol Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">IPFS Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">Pinata Gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">Wallet Authentication</span>
              </div>
            </div>
          </Card>

          {/* Wallet Connection Status */}
          {!isConnected ? (
            <Card className="p-8 text-center mb-6">
              <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to securely upload and manage your health records
              </p>
              <WalletConnect />
            </Card>
          ) : (
            <Card className="p-4 mb-6 border-green-200 bg-green-50">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Wallet Connected:</span>
                <span className="text-green-700 font-mono text-sm">
                  {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                </span>
              </div>
            </Card>
          )}
          
          <FileUploader />
        </div>
      </DashboardLayout>
    </RoleGuard>
  )
}