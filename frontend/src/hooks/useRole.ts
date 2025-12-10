'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { supabase } from '@/lib/supabase/client'
import { getUserByWallet, clearUserCache, type UserRole, type User } from '@/lib/supabase/helpers'
import { logoutStateManager } from '@/lib/auth/logoutState'

interface UseRoleReturn {
  role: UserRole | null
  loading: boolean
  isAuthenticated: boolean
  error: string | null
  user: User | null
}

// ============================================
// MODULE-LEVEL CACHE - shared across all hook instances
// This prevents redundant auth checks when navigating between pages
// ============================================
let cachedRole: UserRole | null = null
let cachedUser: User | null = null
let lastAuthCheckKey: string = ''
let authCheckInProgress: boolean = false
let authCheckPromise: Promise<void> | null = null

// Reset cache on logout
function resetAuthCache() {
  cachedRole = null
  cachedUser = null
  lastAuthCheckKey = ''
  authCheckInProgress = false
  authCheckPromise = null
  clearUserCache() // Also clear the helpers.ts cache
}

export function useRole(): UseRoleReturn {
  const { address, isConnected } = useAccount()
  // Initialize with cached values if available
  const [role, setRole] = useState<UserRole | null>(cachedRole)
  const [loading, setLoading] = useState(cachedRole === null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(cachedUser)
  const [isLoggingOut, setIsLoggingOut] = useState(logoutStateManager.getIsLoggingOut())

  const authCheckDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Subscribe to logout state changes
  useEffect(() => {
    const unsubscribe = logoutStateManager.subscribe(() => {
      const currentLogoutState = logoutStateManager.getIsLoggingOut()
      console.log('🔄 useRole: Logout state changed to:', currentLogoutState ? 'LOGGING OUT' : 'NOT LOGGING OUT')
      setIsLoggingOut(currentLogoutState)

      // If logout started, immediately clear auth state
      if (currentLogoutState) {
        console.log('🚫 useRole: Clearing all auth caches due to logout')
        resetAuthCache()
        setRole(null)
        setUser(null)
        setLoading(false)
        setError(null)
      }
    })

    return unsubscribe
  }, [])

  const checkAuthAndRole = useCallback(async () => {
    // Create a cache key based on current params
    const cacheKey = `${address}-${isConnected}-${isLoggingOut}`

    // Skip if already in progress - wait for existing check
    if (authCheckInProgress && authCheckPromise) {
      console.log('⏭️ useRole: Auth check in progress, waiting for result...')
      await authCheckPromise
      // Use cached results
      setRole(cachedRole)
      setUser(cachedUser)
      setLoading(false)
      return
    }

    // Skip if params haven't changed AND we have a cached role
    if (lastAuthCheckKey === cacheKey && cachedRole !== null) {
      console.log('⏭️ useRole: Using cached auth (same params, have role)')
      setRole(cachedRole)
      setUser(cachedUser)
      setLoading(false)
      return
    }

    // CRITICAL: Block all authentication during logout
    if (isLoggingOut || logoutStateManager.getIsLoggingOut()) {
      console.log('🚫 useRole blocked - logout in progress')
      resetAuthCache()
      setRole(null)
      setUser(null)
      setLoading(false)
      setError(null)
      return
    }

    authCheckInProgress = true
    lastAuthCheckKey = cacheKey

    // Only set loading if we don't have cached data
    if (cachedRole === null) {
      setLoading(true)
    }
    setError(null)

    // Create a promise that other instances can wait on
    authCheckPromise = (async () => {
      try {
        // First check Supabase Auth session
        const sessionResult = await logoutStateManager.blockAuthDuringLogout(
          () => supabase.auth.getSession(),
          'Supabase session check'
        )

        if (!sessionResult) {
          cachedRole = null
          cachedUser = null
          return
        }

        const { data: { session }, error: sessionError } = sessionResult

        if (sessionError) throw sessionError

        if (session?.user) {
          const walletAddress = session.user.user_metadata?.wallet_address

          if (walletAddress) {
            const userData = await logoutStateManager.blockAuthDuringLogout(
              () => getUserByWallet(walletAddress),
              'User lookup by wallet (from session)'
            )

            cachedRole = userData?.role ?? null
            cachedUser = userData
          } else {
            cachedRole = null
            cachedUser = null
          }
        } else if (address && isConnected) {
          console.log('ℹ️ Wallet connected but no Supabase session - attempting wallet-based auth for:', address.slice(0, 6) + '...')

          const userData = await logoutStateManager.blockAuthDuringLogout(
            () => getUserByWallet(address),
            'User lookup by wallet (fallback)'
          )

          if (userData) {
            console.log('✅ Wallet-based authentication successful - user found:', userData.role)
            cachedRole = userData.role
            cachedUser = userData
          } else {
            console.log('ℹ️ Wallet connected but no user record found - user needs to register')
            cachedRole = null
            cachedUser = null
          }
        } else {
          cachedRole = null
          cachedUser = null
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
        cachedRole = null
        cachedUser = null
        throw err
      } finally {
        authCheckInProgress = false
      }
    })()

    try {
      await authCheckPromise
      setRole(cachedRole)
      setUser(cachedUser)
    } catch (err) {
      setError('Failed to fetch user role')
      setRole(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, isLoggingOut])

  useEffect(() => {
    // If we already have cached data for same params, use it immediately
    const cacheKey = `${address}-${isConnected}-${isLoggingOut}`
    if (lastAuthCheckKey === cacheKey && cachedRole !== null) {
      setRole(cachedRole)
      setUser(cachedUser)
      setLoading(false)
      return
    }

    // Clear any pending debounce timer
    if (authCheckDebounceTimer.current) {
      clearTimeout(authCheckDebounceTimer.current)
    }

    // Debounce auth checks
    authCheckDebounceTimer.current = setTimeout(() => {
      checkAuthAndRole()
    }, 50)

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Reset cache to force fresh check
        lastAuthCheckKey = ''
        cachedRole = null
        cachedUser = null
        checkAuthAndRole()
      }
    })

    return () => {
      subscription.unsubscribe()
      if (authCheckDebounceTimer.current) {
        clearTimeout(authCheckDebounceTimer.current)
      }
    }
  }, [checkAuthAndRole, address, isConnected, isLoggingOut])

  return {
    role,
    loading,
    isAuthenticated: isConnected && !!address,
    error,
    user
  }
}