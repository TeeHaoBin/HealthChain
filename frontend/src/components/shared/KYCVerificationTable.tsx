'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface DoctorVerification {
  id: string
  full_name: string
  email: string
  wallet_address: string
  license_number?: string
  specialization?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

export default function KYCVerificationTable() {
  const [verifications, setVerifications] = useState<DoctorVerification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - replace with actual API call later
    const mockData: DoctorVerification[] = [
      {
        id: '1',
        full_name: 'Dr. Sarah Wilson',
        email: 'sarah.wilson@hospital.com',
        wallet_address: '0x9d6cb6c9034bfb89749c33c24c5b5f6273669e3a',
        license_number: 'MD123456',
        specialization: 'Cardiology',
        status: 'pending',
        submitted_at: '2025-01-19T10:00:00Z'
      },
      {
        id: '2',
        full_name: 'Dr. Michael Chen',
        email: 'michael.chen@clinic.com',
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        license_number: 'MD789012',
        specialization: 'Neurology',
        status: 'pending',
        submitted_at: '2025-01-19T14:30:00Z'
      }
    ]

    setTimeout(() => {
      setVerifications(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const handleVerification = async (id: string, action: 'approve' | 'reject') => {
    try {
      // TODO: Implement actual verification API call
      console.log(`${action} verification for doctor ID: ${id}`)

      // Update local state for now
      setVerifications(prev =>
        prev.map(v =>
          v.id === id
            ? { ...v, status: action === 'approve' ? 'approved' : 'rejected' }
            : v
        )
      )
    } catch (error) {
      console.error('Error processing verification:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading verifications...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {verifications.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No pending verifications at this time.</p>
        </Card>
      ) : (
        verifications.map((verification) => (
          <Card key={verification.id} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <h3 className="font-semibold text-lg">{verification.full_name}</h3>
                <p className="text-sm text-gray-600">{verification.email}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {verification.wallet_address}
                </p>
              </div>

              <div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">License:</span> {verification.license_number || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Specialization:</span> {verification.specialization || 'N/A'}
                  </p>
                  <div className="text-sm flex items-center gap-1">
                    <span className="font-medium">Status:</span> {getStatusBadge(verification.status)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {verification.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleVerification(verification.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerification(verification.id, 'reject')}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {verification.status !== 'pending' && (
                  <Button size="sm" variant="outline" disabled>
                    {verification.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}