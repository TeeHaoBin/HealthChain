'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Users, Shield, Activity, Calendar } from 'lucide-react'

interface HealthRecord {
  id: string
  title: string
  date: string
  type: 'lab-result' | 'prescription' | 'visit-note' | 'imaging'
  status: 'pending' | 'approved' | 'denied'
}

interface AccessRequest {
  id: string
  doctorName: string
  hospitalName: string
  requestDate: string
  purpose: string
  status: 'pending' | 'approved' | 'denied'
}

export default function PatientDashboard() {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

  useEffect(() => {
    // Mock data - replace with actual API calls
    setRecords([
      {
        id: '1',
        title: 'Blood Test Results',
        date: '2024-01-15',
        type: 'lab-result',
        status: 'approved'
      },
      {
        id: '2',
        title: 'Chest X-Ray',
        date: '2024-01-10',
        type: 'imaging',
        status: 'approved'
      },
      {
        id: '3',
        title: 'Prescription - Amoxicillin',
        date: '2024-01-08',
        type: 'prescription',
        status: 'approved'
      }
    ])

    setAccessRequests([
      {
        id: '1',
        doctorName: 'Dr. Sarah Wilson',
        hospitalName: 'City General Hospital',
        requestDate: '2024-01-16',
        purpose: 'Routine checkup follow-up',
        status: 'pending'
      },
      {
        id: '2',
        doctorName: 'Dr. Michael Chen',
        hospitalName: 'Specialist Care Center',
        requestDate: '2024-01-14',
        purpose: 'Cardiology consultation',
        status: 'approved'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'denied': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab-result': return <Activity className="h-4 w-4" />
      case 'prescription': return <FileText className="h-4 w-4" />
      case 'imaging': return <Shield className="h-4 w-4" />
      case 'visit-note': return <Calendar className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your health records and access requests</p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload New Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Doctors</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Shield className="h-8 w-8 text-purple-600" />
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
            <Activity className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Health Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(record.type)}
                    <div>
                      <p className="font-medium text-gray-900">{record.title}</p>
                      <p className="text-sm text-gray-600">{record.date}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Records
            </Button>
          </CardContent>
        </Card>

        {/* Access Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Access Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessRequests.map((request) => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{request.doctorName}</p>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{request.hospitalName}</p>
                  <p className="text-sm text-gray-600 mb-2">{request.purpose}</p>
                  <p className="text-xs text-gray-500">Requested: {request.requestDate}</p>
                  
                  {request.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1">Approve</Button>
                      <Button size="sm" variant="outline" className="flex-1">Deny</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}