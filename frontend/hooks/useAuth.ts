'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

const STORAGE_KEY = 'mailos_user'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
}

/**
 * Centralized auth hook that:
 * 1. Syncs next-auth session → localStorage on login
 * 2. Reads user from localStorage for instant access
 * 3. Clears localStorage on sign-out
 * 4. Provides { user, userId, isAuthenticated, isLoading, signOut }
 */
export function useAuth() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Sync session and localStorage
  useEffect(() => {
    // 1. Try to hydrate from localStorage on mount (only once)
    if (!isHydrated) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser
          if (parsed?.id && parsed?.email) {
            setUser(parsed)
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
      setIsHydrated(true)
      return
    }

    // 2. Sync with next-auth session
    if (status === 'loading') return

    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as any
      const authUser: AuthUser = {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: sessionUser.name || '',
        image: sessionUser.image || undefined,
      }

      if (authUser.id) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
        setUser(authUser)
      }
    } else if (status === 'unauthenticated') {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
  }, [session, status, isHydrated])

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    await nextAuthSignOut({ callbackUrl: '/' })
  }, [])

  // isLoading should be true:
  // 1. During initial hydration from localStorage
  // 2. While next-auth session is loading
  // 3. If next-auth is authenticated but we haven't synced the user to state yet
  const isLoading = !isHydrated || status === 'loading' || (status === 'authenticated' && !user)

  return {
    user,
    userId: user?.id || null,
    isAuthenticated: !!user?.id,
    isLoading,
    signOut,
  }
}
