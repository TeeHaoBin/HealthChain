'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { supabase } from '@/lib/supabase/client'
import { getUserByWallet, type UserRole, type User } from '@/lib/supabase/helpers'
import { logoutStateManager } from '@/lib/auth/logoutState'

interface UseRoleReturn {
  role: UserRole | null
  loading: boolean
  isAuthenticated: boolean
  error: string | null
  user: User | null
}

export function useRole(): UseRoleReturn {
  const { address, isConnected } = useAccount()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(logoutStateManager.getIsLoggingOut())

  // Subscribe to logout state changes
  useEffect(() => {
    const unsubscribe = logoutStateManager.subscribe(() => {
      const currentLogoutState = logoutStateManager.getIsLoggingOut()
      console.log('🔄 useRole: Logout state changed to:', currentLogoutState ? 'LOGGING OUT' : 'NOT LOGGING OUT')
      setIsLoggingOut(currentLogoutState)
      
      // If logout started, immediately clear auth state
      if (currentLogoutState) {
        console.log('🚫 useRole: Immediately clearing auth state due to logout')
        setRole(null)
        setUser(null)
        setLoading(false)
        setError(null)
      }
    })
    
    return unsubscribe
  }, [])

  useEffect(() => {
    const checkAuthAndRole = async () => {
      // CRITICAL: Block all authentication during logout (check real-time state)
      if (isLoggingOut || logoutStateManager.getIsLoggingOut()) {
        console.log('🚫 useRole blocked - logout in progress')
        setRole(null)
        setUser(null)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // First check Supabase Auth session
        const sessionResult = await logoutStateManager.blockAuthDuringLogout(
          () => supabase.auth.getSession(),
          'Supabase session check'
        )
        
        if (!sessionResult) {
          // Blocked during logout
          setRole(null)
          setUser(null)
          setLoading(false)
          return
        }

        const { data: { session }, error: sessionError } = sessionResult
        
        if (sessionError) throw sessionError

        if (session?.user) {
          // User is authenticated with Supabase Auth
          const walletAddress = session.user.user_metadata?.wallet_address
          
          if (walletAddress) {
            // Get user role from our custom users table (with logout protection)
            const userData = await logoutStateManager.blockAuthDuringLogout(
              () => getUserByWallet(walletAddress),
              'User lookup by wallet (from session)'
            )
            
            if (userData) {
              setRole(userData.role)
              setUser(userData)
            } else {
              setRole(null)
              setUser(null)
            }
          } else {
            // Session exists but no wallet address (legacy auth)
            setRole(null)
            setUser(null)
          }
        } else if (address && isConnected) {
          // Fallback wallet authentication when no Supabase session exists
          console.log('ℹ️ Wallet connected but no Supabase session - attempting wallet-based auth for:', address)
          
          // Check if user exists (for fallback to old system) - with logout protection
          const userData = await logoutStateManager.blockAuthDuringLogout(
            () => getUserByWallet(address),
            'User lookup by wallet (fallback)'
          )
          
          if (userData) {
            console.log('✅ Wallet-based authentication successful - user found:', userData.role)
            setRole(userData.role)
            setUser(userData)
          } else {
            console.log('ℹ️ Wallet connected but no user record found - user needs to register')
            setRole(null)
            setUser(null)
          }
        } else {
          // No wallet connection and no session
          setRole(null)
          setUser(null)
        }
      } catch (err) {
        setError('Failed to fetch user role')
        console.error('Error fetching user role:', err)
        setRole(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkAuthAndRole()
      }
    })

    return () => subscription.unsubscribe()
  }, [address, isConnected, isLoggingOut]) // Added isLoggingOut to dependencies

  return {
    role,
    loading,
    isAuthenticated: isConnected && !!address,
    error,
    user
  }
}