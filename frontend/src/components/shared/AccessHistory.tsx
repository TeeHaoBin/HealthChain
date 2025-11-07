"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AccessHistoryProps {
  userType: "doctor" | "patient"
}

// Mock data for demonstration
const mockHistory = [
  {
    id: "1",
    patient: "John Doe",
    patientWallet: "0x9876...5432",
    doctor: "Dr. Sarah Johnson",
    doctorWallet: "0x1234...5678",
    accessGranted: "2024-01-10",
    accessExpired: "2024-01-17",
    status: "completed",
    reason: "Routine checkup and medical history review"
  },
  {
    id: "2",
    patient: "Jane Smith",
    patientWallet: "0x8765...4321",
    doctor: "Dr. Sarah Johnson",
    doctorWallet: "0x1234...5678",
    accessGranted: "2024-01-05",
    accessExpired: "2024-01-12",
    status: "completed",
    reason: "Follow-up consultation for hypertension"
  },
  {
    id: "3",
    patient: "Bob Wilson",
    patientWallet: "0x7654...3210",
    doctor: "Dr. Sarah Johnson",
    doctorWallet: "0x1234...5678",
    accessGranted: "2024-01-14",
    accessExpired: "2024-01-21",
    status: "active",
    reason: "Emergency consultation for chest pain"
  },
  {
    id: "4",
    patient: "Alice Brown",
    patientWallet: "0x6543...2109",
    doctor: "Dr. Sarah Johnson",
    doctorWallet: "0x1234...5678",
    accessGranted: "2023-12-28",
    accessExpired: "2024-01-04",
    status: "expired",
    reason: "Diabetes management and medication review"
  }
]

export default function AccessHistory({ userType }: AccessHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>
      case "expired":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {mockHistory.filter(h => h.status === "active").length}
            </div>
            <div className="text-sm text-blue-700">Active Access</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {mockHistory.filter(h => h.status === "completed").length}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {mockHistory.length}
            </div>
            <div className="text-sm text-gray-700">Total Requests</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Access History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">
                  {userType === "doctor" ? "Patient" : "Doctor"}
                </th>
                <th className="text-left py-3 px-4">Wallet Address</th>
                <th className="text-left py-3 px-4">Reason</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Access Granted</th>
                <th className="text-left py-3 px-4">Access Expired</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">
                        {userType === "doctor" ? record.patient : record.doctor}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 font-mono">
                      {userType === "doctor" ? record.patientWallet : record.doctorWallet}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-700 max-w-xs truncate">
                      {record.reason}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{record.accessGranted}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{record.accessExpired}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mockHistory.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No access history found</p>
          </div>
        )}
      </Card>
    </div>
  )
}