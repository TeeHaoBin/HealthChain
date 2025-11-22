'use client'

import { useState, useEffect } from 'react'

export function useSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true) // Default to mobile for SSR

  // Initialize and handle screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      console.log('📱 Screen size check:', { width: window.innerWidth, mobile })
      
      setIsMobile(mobile)
      
      // Set initial sidebar state based on screen size
      if (mobile) {
        setIsSidebarOpen(false) // Closed on mobile
      } else {
        setIsSidebarOpen(true)  // Open on desktop
      }
    }

    // Initial check
    checkScreenSize()

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, []) // Remove isSidebarOpen dependency to avoid conflicts

  const toggleSidebar = () => {
    console.log('🔄 Toggle sidebar:', { current: isSidebarOpen, willBe: !isSidebarOpen })
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen && isMobile) {
        closeSidebar()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSidebarOpen, isMobile])

  return {
    isSidebarOpen,
    isMobile,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  }
}