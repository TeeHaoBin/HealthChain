import RoleGuard from '@/components/auth/RoleGuard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </RoleGuard>
  )
}