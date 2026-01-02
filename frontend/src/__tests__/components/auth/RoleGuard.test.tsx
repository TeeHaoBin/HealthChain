/**
 * RoleGuard Component Tests
 * Section 10.0 - Role-Based Access Control
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}))

// Mock useRole hook
const mockUseRole = jest.fn()
jest.mock('@/hooks/useRole', () => ({
    useRole: () => mockUseRole(),
}))

// Mock Spinner
jest.mock('@/components/shared/Spinner', () => ({
    Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

// Import component after mocks
import RoleGuard from '@/components/auth/RoleGuard'

describe('RoleGuard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('10.0 Role-Based Access Control', () => {
        it('10.1 Shows loading spinner while checking role', () => {
            mockUseRole.mockReturnValue({ role: null, loading: true, isAuthenticated: false })

            render(
                <RoleGuard allowedRoles={['patient']}>
                    <div>Protected Content</div>
                </RoleGuard>
            )

            expect(screen.getByTestId('spinner')).toBeInTheDocument()
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        })

        it('10.2 Renders children for allowed patient role', async () => {
            mockUseRole.mockReturnValue({ role: 'patient', loading: false, isAuthenticated: true })

            render(
                <RoleGuard allowedRoles={['patient']}>
                    <div>Patient Content</div>
                </RoleGuard>
            )

            expect(screen.getByText('Patient Content')).toBeInTheDocument()
        })

        it('10.3 Renders children for allowed doctor role', async () => {
            mockUseRole.mockReturnValue({ role: 'doctor', loading: false, isAuthenticated: true })

            render(
                <RoleGuard allowedRoles={['doctor']}>
                    <div>Doctor Content</div>
                </RoleGuard>
            )

            expect(screen.getByText('Doctor Content')).toBeInTheDocument()
        })

        it('10.4 Renders children for allowed admin role', async () => {
            mockUseRole.mockReturnValue({ role: 'admin', loading: false, isAuthenticated: true })

            render(
                <RoleGuard allowedRoles={['admin']}>
                    <div>Admin Content</div>
                </RoleGuard>
            )

            expect(screen.getByText('Admin Content')).toBeInTheDocument()
        })

        it('10.5 Redirects unauthenticated user to /auth', async () => {
            mockUseRole.mockReturnValue({ role: null, loading: false, isAuthenticated: false })

            render(
                <RoleGuard allowedRoles={['patient']}>
                    <div>Protected Content</div>
                </RoleGuard>
            )

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/auth')
            })
        })

        it('10.6 Redirects unauthorized patient to patient dashboard', async () => {
            mockUseRole.mockReturnValue({ role: 'patient', loading: false, isAuthenticated: true })

            render(
                <RoleGuard allowedRoles={['doctor']}>
                    <div>Doctor Only Content</div>
                </RoleGuard>
            )

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/patient/dashboard')
            })
        })

        it('10.7 Redirects unauthorized doctor to doctor dashboard', async () => {
            mockUseRole.mockReturnValue({ role: 'doctor', loading: false, isAuthenticated: true })

            render(
                <RoleGuard allowedRoles={['admin']}>
                    <div>Admin Only Content</div>
                </RoleGuard>
            )

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/doctor/dashboard')
            })
        })

        it('10.8 Supports multiple allowed roles', async () => {
            mockUseRole.mockReturnValue({ role: 'doctor', loading: false, isAuthenticated: true })

            render(
                <RoleGuard allowedRoles={['patient', 'doctor']}>
                    <div>Multi-Role Content</div>
                </RoleGuard>
            )

            expect(screen.getByText('Multi-Role Content')).toBeInTheDocument()
        })
    })
})
