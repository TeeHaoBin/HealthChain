"use client"

import { FileText, Calendar, User, Shield, CheckCircle, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EHRRecord } from "@/types"
import Link from "next/link"

type PermissionFilter = 'all' | 'granted' | 'pending' | 'none'

interface RecordListProps {
    records: EHRRecord[]
    allRecords?: EHRRecord[]
    onRequestAccess: (record: EHRRecord) => void
    loading?: boolean
    permissionFilter?: PermissionFilter
    onFilterChange?: (filter: PermissionFilter) => void
}

function PermissionBadge({ status }: { status?: 'granted' | 'pending' | 'none' }) {
    if (status === 'granted') {
        return (
            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle className="h-3 w-3" />
                Access Granted
            </Badge>
        )
    }
    if (status === 'pending') {
        return (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                <Clock className="h-3 w-3" />
                Pending Approval
            </Badge>
        )
    }
    // Show 'No Access' for none status or undefined
    return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <Shield className="h-3 w-3" />
            No Access
        </Badge>
    )
}

function getFilterCounts(records: EHRRecord[]) {
    return {
        all: records.length,
        granted: records.filter(r => r.permissionStatus === 'granted').length,
        pending: records.filter(r => r.permissionStatus === 'pending').length,
        none: records.filter(r => r.permissionStatus === 'none' || !r.permissionStatus).length,
    }
}

export default function RecordList({
    records,
    allRecords,
    onRequestAccess,
    loading,
    permissionFilter = 'all',
    onFilterChange
}: RecordListProps) {
    const counts = getFilterCounts(allRecords || records)

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                ))}
            </div>
        )
    }

    const sourceRecords = allRecords || records

    if (sourceRecords.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                <p className="text-gray-500 mt-1">Try searching with a different wallet address</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            {onFilterChange && (
                <Tabs value={permissionFilter} onValueChange={(v) => onFilterChange(v as PermissionFilter)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">
                            All ({counts.all})
                        </TabsTrigger>
                        <TabsTrigger value="granted" className="text-xs sm:text-sm">
                            <CheckCircle className="h-3 w-3 mr-1 hidden sm:inline" />
                            Granted ({counts.granted})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs sm:text-sm">
                            <Clock className="h-3 w-3 mr-1 hidden sm:inline" />
                            Pending ({counts.pending})
                        </TabsTrigger>
                        <TabsTrigger value="none" className="text-xs sm:text-sm">
                            <Shield className="h-3 w-3 mr-1 hidden sm:inline" />
                            No Access ({counts.none})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            <p className="text-sm text-gray-500">
                Showing {records.length} record{records.length !== 1 ? 's' : ''}
                {permissionFilter !== 'all' && ` (filtered)`}
            </p>

            {records.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No records match this filter</p>
                    {onFilterChange && (
                        <Button variant="link" onClick={() => onFilterChange('all')} className="mt-2">
                            Show all records
                        </Button>
                    )}
                </div>
            ) : (
                records.map((record) => (
                    <Card key={record.id} className="p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <h3 className="font-semibold text-lg text-gray-900">{record.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PermissionBadge status={record.permissionStatus} />
                                        <Badge variant="outline" className="capitalize">
                                            {record.file_type}
                                        </Badge>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-4 line-clamp-2">{record.description}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Patient: {record.patient_id.slice(0, 6)}...{record.patient_id.slice(-4)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {record.tags && record.tags.length > 0 && (
                                        <div className="flex gap-2">
                                            {record.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center">
                                {record.permissionStatus === 'granted' ? (
                                    <Link href="/doctor/documents">
                                        <Button variant="outline" className="w-full md:w-auto gap-2 text-green-700 border-green-300 hover:bg-green-50">
                                            <ExternalLink className="h-4 w-4" />
                                            View in Documents
                                        </Button>
                                    </Link>
                                ) : record.permissionStatus === 'pending' ? (
                                    <Button
                                        variant="outline"
                                        disabled
                                        className="w-full md:w-auto gap-2 cursor-not-allowed"
                                    >
                                        <Clock className="h-4 w-4" />
                                        Awaiting Approval
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => onRequestAccess(record)}
                                        className="w-full md:w-auto gap-2"
                                    >
                                        <Shield className="h-4 w-4" />
                                        Request Access
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

