import RoleGuard from '@/components/auth/RoleGuard'
import PatientDashboard from '@/components/dashboard/PatientDashboard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function PatientDashboardPage() {
  return (
    <RoleGuard allowedRoles={['patient']}>
      <DashboardLayout>
        <PatientDashboard />
      </DashboardLayout>
    </RoleGuard>
  )
}