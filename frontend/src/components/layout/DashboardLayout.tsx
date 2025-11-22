"use client"

import { useRole } from "@/hooks/useRole"
import { useSidebar } from "@/hooks/useSidebar"
import { Sidebar } from "./Sidebar"
import { MobileHeader } from "./MobileHeader"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, loading, error } = useRole()
  const { isSidebarOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar()
  
  // Debug logging
  console.log('🏠 DashboardLayout state:', { 
    role, 
    isSidebarOpen, 
    isMobile, 
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'SSR' 
  })

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  // If no role is determined yet, show children without sidebar
  if (!role || role === "visitor") {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen">
      <Sidebar 
        role={role} 
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={closeSidebar}
      />
      
      {/* Mobile Header */}
      <MobileHeader 
        onMenuClick={toggleSidebar}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ${
        isMobile 
          ? 'ml-0' // No margin on mobile
          : isSidebarOpen 
            ? 'ml-64' // Full margin when sidebar is open on desktop
            : 'ml-0' // No margin when sidebar is closed
      }`}>
        <div className={`p-6 ${isMobile ? 'pt-2' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  )
}