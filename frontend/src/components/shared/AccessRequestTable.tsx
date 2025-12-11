"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export interface AccessRequestData {
  id: string
  doctor_wallet: string
  patient_wallet: string
  requested_record_ids?: string[]
  purpose: string
  status: string
  created_at?: string
  sent_at?: string
  expires_at?: string
  // Optional populated fields for display
  doctorName?: string
}

interface AccessRequestTableProps {
  userType: "patient" | "doctor"
  requests: AccessRequestData[]
  onApprove?: (request: AccessRequestData) => void
  onReject?: (request: AccessRequestData) => void
  loading?: boolean
  processingId?: string | null
  processingStep?: string
}

export default function AccessRequestTable({
  userType,
  requests,
  onApprove,
  onReject,
  loading = false,
  processingId = null,
  processingStep = ""
}: AccessRequestTableProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "sent":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
      case "denied":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
      case "expired":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "-"
    }
  }

  const formatWallet = (wallet: string) => {
    if (!wallet || wallet.length < 10) return wallet
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  const isPending = (status: string) => status === "pending" || status === "sent"

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading requests...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">
                {userType === "patient" ? "Doctor" : "Patient"}
              </th>
              <th className="text-left py-3 px-4">Wallet Address</th>
              <th className="text-left py-3 px-4">Reason</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Requested</th>
              <th className="text-left py-3 px-4">Expires</th>
              {userType === "patient" && <th className="text-left py-3 px-4">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">
                      {request.doctorName || "Doctor"}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600 font-mono">
                    {formatWallet(userType === "patient" ? request.doctor_wallet : request.patient_wallet)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-700 max-w-xs truncate">
                    {request.purpose}
                  </p>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(request.status)}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(request.sent_at || request.created_at)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(request.expires_at)}
                  </span>
                </td>
                {userType === "patient" && (
                  <td className="py-3 px-4">
                    {processingId === request.id ? (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="max-w-[150px] truncate">{processingStep || "Processing..."}</span>
                      </div>
                    ) : isPending(request.status) ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => onApprove?.(request)}
                          disabled={!!processingId}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => onReject?.(request)}
                          disabled={!!processingId}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No access requests found</p>
        </div>
      )}
    </Card>
  )
}