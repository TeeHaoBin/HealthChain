import RoleGuard from '@/components/auth/RoleGuard'
import KYCVerificationTable from '@/components/shared/KYCVerificationTable'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function AdminVerifyPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Doctor Verification
          </h1>
          <KYCVerificationTable />
        </div>
      </DashboardLayout>
    </RoleGuard>
  )
}