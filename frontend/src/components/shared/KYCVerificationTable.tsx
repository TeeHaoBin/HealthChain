'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  UserCheck,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Shield
} from 'lucide-react'
import {
  getDoctorVerificationStats,
  getAllDoctorVerifications,
  verifyDoctor,
  DoctorVerificationStats,
  DoctorWithProfile
} from '@/lib/supabase/helpers'
import { useToast } from '@/components/ui/use-toast'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function KYCVerificationTable() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([])
  const [stats, setStats] = useState<DoctorVerificationStats>({
    totalDoctors: 0,
    verifiedDoctors: 0,
    pendingDoctors: 0,
    rejectedDoctors: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, doctorsData] = await Promise.all([
        getDoctorVerificationStats(),
        getAllDoctorVerifications()
      ])
      setStats(statsData)
      setDoctors(doctorsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load verification data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (profileId: string, action: 'approved' | 'rejected') => {
    setProcessingId(profileId)
    try {
      const success = await verifyDoctor(profileId, action, 'admin')

      if (success) {
        toast({
          title: action === 'approved' ? "Doctor Verified" : "Doctor Rejected",
          description: `The doctor has been ${action}.`
        })
        await fetchData()
      } else {
        throw new Error('Verification failed')
      }
    } catch (error) {
      console.error('Error verifying doctor:', error)
      toast({
        title: "Error",
        description: `Failed to ${action === 'approved' ? 'verify' : 'reject'} doctor`,
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  // Filter and search logic
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      // Status filter
      if (filterStatus !== 'all') {
        if (doctor.verification_status !== filterStatus) return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesName = doctor.user?.full_name?.toLowerCase().includes(search)
        const matchesEmail = doctor.user?.email?.toLowerCase().includes(search)
        const matchesWallet = doctor.user?.wallet_address?.toLowerCase().includes(search)
        const matchesLicense = doctor.license_number?.toLowerCase().includes(search)
        const matchesSpecialization = doctor.specialization?.toLowerCase().includes(search)
        const matchesOrganization = doctor.hospital_name?.toLowerCase().includes(search)

        if (!matchesName && !matchesEmail && !matchesWallet && !matchesLicense && !matchesSpecialization && !matchesOrganization) {
          return false
        }
      }

      return true
    })
  }, [doctors, filterStatus, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading verifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified Doctors</p>
              <p className="text-2xl font-bold text-green-600">{stats.verifiedDoctors}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.pendingDoctors > 0 ? "ring-2 ring-yellow-400" : ""}>
          <CardContent className="flex items-center p-4">
            <AlertTriangle className={`h-8 w-8 ${stats.pendingDoctors > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className={`text-2xl font-bold ${stats.pendingDoctors > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                {stats.pendingDoctors}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-500">{stats.rejectedDoctors}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, wallet, license, specialization, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Tabs */}
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({doctors.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({stats.pendingDoctors})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Verified ({stats.verifiedDoctors})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({stats.rejectedDoctors})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No doctors found</p>
              <p className="text-sm mt-1">
                {searchTerm
                  ? "Try adjusting your search"
                  : filterStatus === 'pending'
                    ? "No pending verifications"
                    : "No doctors in this category"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {doctor.user?.full_name || 'Unknown Doctor'}
                        </h3>
                        {getStatusBadge(doctor.verification_status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-600">
                        <p><span className="font-medium">Email:</span> {doctor.user?.email || 'N/A'}</p>
                        <p><span className="font-medium">License:</span> {doctor.license_number || 'N/A'}</p>
                        <p><span className="font-medium">Specialization:</span> {doctor.specialization || 'N/A'}</p>
                        <p><span className="font-medium">Organization:</span> {doctor.hospital_name || 'N/A'}</p>
                      </div>

                      <p className="text-xs text-gray-400">
                        Wallet: {doctor.user?.wallet_address}
                      </p>
                      <p className="text-xs text-gray-400">
                        Submitted: {new Date(doctor.created_at).toLocaleString()}
                        {doctor.verified_at && ` • Verified: ${new Date(doctor.verified_at).toLocaleString()}`}
                      </p>
                    </div>

                    {doctor.verification_status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVerification(doctor.id, 'approved')}
                          disabled={processingId === doctor.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingId === doctor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleVerification(doctor.id, 'rejected')}
                          disabled={processingId === doctor.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {doctor.verification_status !== 'pending' && (
                      <div className="text-sm text-gray-500 italic">
                        {doctor.verification_status === 'approved' ? 'Verified' : 'Action completed'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}