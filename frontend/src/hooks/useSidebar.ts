'use client'

import { useEffect, useSyncExternalStore, useCallback } from 'react'

// ============================================
// MODULE-LEVEL STATE - shared across all hook instances
// This prevents duplicate effects when multiple components use the hook
// ============================================
interface SidebarState {
  isSidebarOpen: boolean
  isMobile: boolean
}

let sidebarState: SidebarState = {
  isSidebarOpen: false,
  isMobile: true // Default to mobile for SSR safety
}

// Track if we've initialized from window size
let hasInitialized = false

// Subscribers for state changes
const subscribers = new Set<() => void>()

function notifySubscribers() {
  subscribers.forEach(callback => callback())
}

function subscribe(callback: () => void) {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

function getSnapshot(): SidebarState {
  return sidebarState
}

// MUST be a cached constant - returning a new object causes infinite loop
const SERVER_SNAPSHOT: SidebarState = { isSidebarOpen: false, isMobile: true }

function getServerSnapshot(): SidebarState {
  return SERVER_SNAPSHOT
}

function updateState(updates: Partial<SidebarState>) {
  sidebarState = { ...sidebarState, ...updates }
  notifySubscribers()
}

// Initialize sidebar state from window size (runs once)
function initializeSidebarState() {
  if (hasInitialized || typeof window === 'undefined') return

  hasInitialized = true
  const mobile = window.innerWidth < 1024 // lg breakpoint


  updateState({
    isMobile: mobile,
    isSidebarOpen: !mobile // Open on desktop, closed on mobile
  })
}

// Handle window resize (called from effect)
function handleResize() {
  const mobile = window.innerWidth < 1024

  // Only update if mobile status changed to avoid unnecessary re-renders
  if (mobile !== sidebarState.isMobile) {

    updateState({
      isMobile: mobile,
      isSidebarOpen: !mobile
    })
  }
}

export function useSidebar() {
  // Use useSyncExternalStore for stable state across all hook instances
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Initialize and handle screen size changes - only one listener globally
  useEffect(() => {
    // Initialize on first mount
    initializeSidebarState()

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = useCallback(() => {

    updateState({ isSidebarOpen: !sidebarState.isSidebarOpen })
  }, [])

  const closeSidebar = useCallback(() => {
    updateState({ isSidebarOpen: false })
  }, [])

  const openSidebar = useCallback(() => {
    updateState({ isSidebarOpen: true })
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarState.isSidebarOpen && sidebarState.isMobile) {
        closeSidebar()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeSidebar])

  return {
    isSidebarOpen: state.isSidebarOpen,
    isMobile: state.isMobile,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  }
}