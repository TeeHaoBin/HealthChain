'use client'

// Global logout state management to prevent authentication during logout
class LogoutStateManager {
  private isLoggingOut = false
  private listeners: Set<() => void> = new Set()

  setLoggingOut(value: boolean) {

    this.isLoggingOut = value
    this.notifyListeners()
  }

  getIsLoggingOut(): boolean {
    return this.isLoggingOut
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  // Force block any authentication attempts during logout
  blockAuthDuringLogout<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
    if (this.isLoggingOut) {

      return Promise.resolve(null)
    }
    return operation()
  }
}

// Global singleton instance
export const logoutStateManager = new LogoutStateManager()

// Hook for components to use
export function useLogoutState() {
  const [isLoggingOut, setIsLoggingOut] = React.useState(logoutStateManager.getIsLoggingOut())

  React.useEffect(() => {
    const unsubscribe = logoutStateManager.subscribe(() => {
      setIsLoggingOut(logoutStateManager.getIsLoggingOut())
    })
    return unsubscribe
  }, [])

  return isLoggingOut
}

// Import React for the hook
import React from 'react'