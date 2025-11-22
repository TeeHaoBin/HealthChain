'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Search, 
  Eye,
  Calendar,
  Activity
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  lastVisit: string
  accessStatus: 'granted' | 'pending' | 'denied'
  recordsCount: number
}

interface AccessRequest {
  id: string
  patientName: string
  patientId: string
  requestDate: string
  purpose: string
  status: 'pending' | 'approved' | 'denied'
  urgency: 'low' | 'medium' | 'high'
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Mock data - replace with actual API calls
    setPatients([
      {
        id: '1',
        name: 'John Smith',
        age: 45,
        lastVisit: '2024-01-15',
        accessStatus: 'granted',
        recordsCount: 12
      },
      {
        id: '2',
        name: 'Maria Garcia',
        age: 32,
        lastVisit: '2024-01-12',
        accessStatus: 'granted',
        recordsCount: 8
      },
      {
        id: '3',
        name: 'David Johnson',
        age: 58,
        lastVisit: '2024-01-10',
        accessStatus: 'pending',
        recordsCount: 15
      }
    ])

    setAccessRequests([
      {
        id: '1',
        patientName: 'Emily Chen',
        patientId: 'PAT-004',
        requestDate: '2024-01-16',
        purpose: 'Emergency consultation - chest pain',
        status: 'pending',
        urgency: 'high'
      },
      {
        id: '2',
        patientName: 'Robert Wilson',
        patientId: 'PAT-005',
        requestDate: '2024-01-15',
        purpose: 'Follow-up diabetes management',
        status: 'pending',
        urgency: 'medium'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'denied': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage patient records and access requests</p>
        </div>
        <Button className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Request Patient Access
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Access</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter(p => p.accessStatus === 'granted').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {accessRequests.filter(req => req.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Records Accessed</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Patients
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">Age: {patient.age} • {patient.recordsCount} records</p>
                      <p className="text-xs text-gray-500">Last visit: {patient.lastVisit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(patient.accessStatus)}>
                      {patient.accessStatus}
                    </Badge>
                    {patient.accessStatus === 'granted' && (
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Patients
            </Button>
          </CardContent>
        </Card>

        {/* Recent Access Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Access Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessRequests.filter(req => req.status === 'pending').map((request) => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{request.patientName}</p>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{request.patientId}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{request.purpose}</p>
                  <p className="text-xs text-gray-500 mb-3">Requested: {request.requestDate}</p>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              
              {accessRequests.filter(req => req.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending access requests</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View Request History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Search className="h-6 w-6" />
              <span>Request Patient Access</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>View Access History</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Calendar className="h-6 w-6" />
              <span>Schedule Appointment</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}