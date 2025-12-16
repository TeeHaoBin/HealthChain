"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Loader2, Search, FileText, ExternalLink, AlertCircle, Info, X } from "lucide-react"
import { AccessRequestWithDoctor } from "@/lib/supabase/helpers"

interface AccessRequestTableProps {
  requests: AccessRequestWithDoctor[]
  onApprove?: (request: AccessRequestWithDoctor) => void
  onReject?: (request: AccessRequestWithDoctor, denialReason?: string) => void
  loading?: boolean
  processingId?: string | null
  processingStep?: string
}

type StatusFilter = "all" | "pending" | "approved" | "declined" | "expired" | "revoked"

// Helper to normalize DB status to display status
function getDisplayStatus(status: string): StatusFilter {
  switch (status) {
    case "sent":
    case "draft":
      return "pending"
    case "approved":
      return "approved"
    case "denied":
    case "rejected":
      return "declined"
    case "expired":
      return "expired"
    case "revoked":
      return "revoked"
    default:
      return "pending"
  }
}

// Helper to get badge styling
function getStatusBadge(status: string) {
  const displayStatus = getDisplayStatus(status)
  switch (displayStatus) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case "approved":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
    case "declined":
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Declined</Badge>
    case "expired":
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Expired</Badge>
    case "revoked":
      return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">Revoked</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// Format wallet address for display
function formatWallet(wallet: string): string {
  if (!wallet || wallet.length < 10) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

// Format date for display
function formatDate(dateString?: string): string {
  if (!dateString) return "—"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  } catch {
    return "—"
  }
}

export default function AccessRequestTable({
  requests,
  onApprove,
  onReject,
  loading = false,
  processingId = null,
  processingStep = ""
}: AccessRequestTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [rejectingRequest, setRejectingRequest] = useState<AccessRequestWithDoctor | null>(null)
  const [denialReason, setDenialReason] = useState("")

  // Filter requests based on search and status
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const displayStatus = getDisplayStatus(request.status)

      // COMPROMISE STRATEGY:
      // 1. Pending Tab: Hide "revoked" OR any "deleted" documents
      const hasDeletedDoc = request.document_names?.some(n => n.includes("(Deleted)"))
      const isImpliedRevoked = displayStatus === "pending" && hasDeletedDoc

      if (statusFilter === "pending") {
        if (displayStatus !== "pending") return false
        if (hasDeletedDoc) return false
      }
      // 2. Revoked Tab: Show explicit revoked AND implied revoked
      else if (statusFilter === "revoked") {
        if (displayStatus !== "revoked" && !isImpliedRevoked) return false
      }
      // 3. Other Tabs: strict match
      else if (statusFilter !== "all") {
        if (displayStatus !== statusFilter) return false
      }

      // Search filter (doctor name or wallet)
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const doctorName = request.doctor_name?.toLowerCase() || ""
        const doctorWallet = request.doctor_wallet.toLowerCase()
        const purpose = request.purpose.toLowerCase()
        // Also allow searching by document name
        const docNames = request.document_names?.join(" ").toLowerCase() || ""

        if (!doctorName.includes(search) &&
          !doctorWallet.includes(search) &&
          !purpose.includes(search) &&
          !docNames.includes(search)) {
          return false
        }
      }

      return true
    })
  }, [requests, statusFilter, searchTerm])

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      pending: requests.filter(r => {
        // Only count as pending if it's NOT revoked and NOT deleted
        const isPendingInfo = getDisplayStatus(r.status) === "pending"
        const hasDeletedDoc = r.document_names?.some(n => n.includes("(Deleted)"))
        return isPendingInfo && !hasDeletedDoc
      }).length,
      approved: requests.filter(r => getDisplayStatus(r.status) === "approved").length,
      declined: requests.filter(r => getDisplayStatus(r.status) === "declined").length,
      expired: requests.filter(r => getDisplayStatus(r.status) === "expired").length,
      revoked: requests.filter(r => {
        // Count explicit revoked status OR pending-but-deleted-doc
        const status = getDisplayStatus(r.status)
        const hasDeletedDoc = r.document_names?.some(n => n.includes("(Deleted)"))
        return status === "revoked" || (status === "pending" && hasDeletedDoc)
      }).length,
      total: requests.length
    }
  }, [requests])

  // Determine if Actions column should be shown
  const showActionsColumn = statusFilter === "all" || statusFilter === "pending"

  // Open rejection modal
  const openRejectModal = (request: AccessRequestWithDoctor) => {
    setRejectingRequest(request)
    setDenialReason("")
  }

  // Close rejection modal
  const closeRejectModal = () => {
    setRejectingRequest(null)
    setDenialReason("")
  }

  // Confirm rejection
  const confirmReject = () => {
    if (rejectingRequest) {
      onReject?.(rejectingRequest, denialReason.trim() || undefined)
      closeRejectModal()
    }
  }

  // Check if status is pending
  const isPending = (status: string) => getDisplayStatus(status) === "pending"

  if (loading) {
    // ... (Loading state unchanged) 
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <Card className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-green-700">Approved</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <div className="text-sm text-red-700">Declined</div>
          </div>
          {/* New Revoked Card */}
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-600">{stats.revoked}</div>
            <div className="text-sm text-slate-700">Revoked</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-700">Total</div>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by doctor name, wallet, or document..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
              <TabsTrigger value="revoked">Revoked</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <h3 className="text-lg font-medium mb-4">Access Requests</h3>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Doctor</th>
                <th className="text-left py-3 px-4">Document</th>
                <th className="text-left py-3 px-4 w-10">Reason</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Requested</th>
                <th className="text-left py-3 px-4">Expires</th>
                {showActionsColumn && <th className="text-left py-3 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {request.doctor_name || formatWallet(request.doctor_wallet)}
                      </p>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatWallet(request.doctor_wallet)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {request.document_names && request.document_names.length > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/patient/records?highlightId=${request.requested_record_ids?.[0] || ''}`}
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors group"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0 group-hover:text-blue-600" />
                              <span className="text-sm text-gray-700 truncate max-w-[150px] group-hover:text-blue-600 group-hover:underline">
                                {request.document_names.length === 1
                                  ? request.document_names[0]
                                  : `${request.document_names.length} documents`}
                              </span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-xs text-gray-500 mb-1">Click to view in Records</p>
                            <div className="space-y-1">
                              {request.document_names.map((name, idx) => (
                                <p key={idx} className="text-sm">{name}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <Info className="h-4 w-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-md">
                          <p className="text-sm break-words">{request.purpose || "No reason provided"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="py-3 px-4">
                    {/* Render Revoked badge if implicit revoked (pending + deleted doc) */}
                    {getStatusBadge(
                      (getDisplayStatus(request.status) === "pending" &&
                        request.document_names?.some(n => n.includes("(Deleted)")))
                        ? "revoked"
                        : request.status
                    )}
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
                  {showActionsColumn && (
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
                            onClick={() => openRejectModal(request)}
                            disabled={!!processingId}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "No requests match your filters"
                : "No access requests found"}
            </p>
            {(searchTerm || statusFilter !== "pending") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearchTerm(""); setStatusFilter("pending") }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeRejectModal}>
          <Card className="max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Access Request</h3>
              <Button variant="ghost" size="sm" onClick={closeRejectModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Doctor</p>
                <p className="font-medium">
                  {rejectingRequest.doctor_name || formatWallet(rejectingRequest.doctor_wallet)}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {rejectingRequest.doctor_wallet}
                </p>
              </div>

              {rejectingRequest.document_names && rejectingRequest.document_names.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Requested Document(s)</p>
                  <div className="space-y-1">
                    {rejectingRequest.document_names.map((name, idx) => (
                      <p key={idx} className="text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Doctor&apos;s Reason</p>
                <div className="max-h-24 overflow-y-auto bg-gray-50 rounded-md p-2">
                  <p className="text-gray-700 break-words whitespace-pre-wrap text-sm">{rejectingRequest.purpose || "No reason provided"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Reason for Rejection (Optional)</p>
                <Textarea
                  placeholder="Enter your reason for rejecting this request..."
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={closeRejectModal} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={confirmReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Reject
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}