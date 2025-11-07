"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AccessRequestTableProps {
  userType: "patient" | "doctor"
}

// Mock data for demonstration
const mockRequests = [
  {
    id: "1",
    requester: "Dr. Sarah Johnson",
    requesterWallet: "0x1234...5678",
    patient: "John Doe",
    patientWallet: "0x9876...5432",
    reason: "Routine checkup and medical history review",
    status: "pending",
    requestedAt: "2024-01-15",
    expiresAt: "2024-01-22"
  },
  {
    id: "2",
    requester: "Dr. Michael Chen",
    requesterWallet: "0x2345...6789",
    patient: "Jane Smith",
    patientWallet: "0x8765...4321",
    reason: "Emergency consultation for chest pain",
    status: "approved",
    requestedAt: "2024-01-14",
    expiresAt: "2024-01-21"
  },
  {
    id: "3",
    requester: "Dr. Emily Davis",
    requesterWallet: "0x3456...7890",
    patient: "Bob Wilson",
    patientWallet: "0x7654...3210",
    reason: "Follow-up on diabetes management",
    status: "rejected",
    requestedAt: "2024-01-13",
    expiresAt: "-"
  }
]

export default function AccessRequestTable({ userType }: AccessRequestTableProps) {
  const handleApprove = (requestId: string) => {
    console.log("Approving request:", requestId)
    // TODO: Implement approval logic
  }

  const handleReject = (requestId: string) => {
    console.log("Rejecting request:", requestId)
    // TODO: Implement rejection logic
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
            {mockRequests.map((request) => (
              <tr key={request.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">
                      {userType === "patient" ? request.requester : request.patient}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600 font-mono">
                    {userType === "patient" ? request.requesterWallet : request.patientWallet}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-700 max-w-xs truncate">
                    {request.reason}
                  </p>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(request.status)}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">{request.requestedAt}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">{request.expiresAt}</span>
                </td>
                {userType === "patient" && (
                  <td className="py-3 px-4">
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(request.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mockRequests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No access requests found</p>
        </div>
      )}
    </Card>
  )
}