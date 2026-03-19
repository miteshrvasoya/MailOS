'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

const STORAGE_KEY = 'mailos_user'

async function resolveBackendUserIdByEmail(email: string): Promise<string | null> {
  // Use the configured API base when available.
  const backendBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const url = `${backendBase}/users/by-email/${encodeURIComponent(email)}`

  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data: any = await res.json()
    return data?.id || null
  } catch (e: any) {
    return null
  }
}

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
      const sessionUserId = sessionUser.id || ''
      const sessionEmail = sessionUser.email || ''

      const authUser: AuthUser = {
        id: sessionUserId,
        email: sessionEmail,
        name: sessionUser.name || '',
        image: sessionUser.image || undefined,
      }

      if (authUser.id) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
        setUser(authUser)
      } else if (sessionEmail) {
        // Resolve backend user id by email as a fallback.
        ;(async () => {
          const backendId = await resolveBackendUserIdByEmail(sessionEmail)

          if (backendId) {
            const resolvedUser: AuthUser = {
              ...authUser,
              id: backendId,
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedUser))
            setUser(resolvedUser)
          }
        })()
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
  const isLoading =
    !isHydrated || status === 'loading' || (status === 'authenticated' && !user)

  // Treat next-auth session as the source of truth for auth;
  // localStorage/user state only refines the details (id, name, etc.)
  const isAuthenticated = status === 'authenticated' && !!user?.id

  return {
    user,
    userId: user?.id || null,
    isAuthenticated,
    isLoading,
    signOut,
  }
}
