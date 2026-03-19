'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

const STORAGE_KEY = 'mailos_user'
const DEBUG_ENDPOINT = 'http://127.0.0.1:7489/ingest/e464efb9-3f59-4123-a70c-2cb6541aad5c'
const DEBUG_SESSION_ID = '22f7dc'

async function resolveBackendUserIdByEmail(email: string): Promise<string | null> {
  // Use the configured API base when available.
  const backendBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const url = `${backendBase}/users/by-email/${encodeURIComponent(email)}`

  // #region debug log H2_backend_lookup_request_details
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: 'debug_initial',
      hypothesisId: 'H2_backend_lookup_failed_reason',
      location: 'frontend/hooks/useAuth.ts:resolveBackendUserIdByEmail:beforeFetch',
      message: 'backend lookup request',
      data: {
        backendBase,
        urlHost: (() => {
          try {
            return new URL(url).host
          } catch {
            return null
          }
        })(),
        emailPrefix: email ? String(email).slice(0, 3) : null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  try {
    const res = await fetch(url, { method: 'GET' })
    // #region debug log H2_backend_lookup_response_status
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': DEBUG_SESSION_ID,
      },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'debug_initial',
        hypothesisId: 'H2_backend_lookup_failed_reason',
        location: 'frontend/hooks/useAuth.ts:resolveBackendUserIdByEmail:afterFetch',
        message: 'backend lookup response received',
        data: {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (!res.ok) return null
    const data: any = await res.json()
    return data?.id || null
  } catch (e: any) {
    // #region debug log H2_backend_lookup_network_error
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': DEBUG_SESSION_ID,
      },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'debug_initial',
        hypothesisId: 'H2_backend_lookup_failed_reason',
        location: 'frontend/hooks/useAuth.ts:resolveBackendUserIdByEmail:catch',
        message: 'backend lookup network error',
        data: {
          name: e?.name,
          message: e?.message,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
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
    // #region debug log H1_useAuth_status_transition
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': DEBUG_SESSION_ID,
      },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'debug_initial',
        hypothesisId: 'H1_missing_user_id_in_nextauth_session',
        location: 'frontend/hooks/useAuth.ts:useEffect(status)',
        message: 'useAuth effect tick',
        data: {
          status,
          isHydrated,
          hasSessionUser: !!(session as any)?.user,
          hasSessionUserId: !!((session as any)?.user?.id || ''),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

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

      // #region debug log H1_session_userid_missing_before_resolve
      if (!authUser.id && sessionEmail) {
        fetch(DEBUG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': DEBUG_SESSION_ID,
          },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: 'debug_initial',
            hypothesisId: 'H1_missing_user_id_in_nextauth_session',
            location: 'frontend/hooks/useAuth.ts:resolveBackendUserIdByEmail',
            message: 'session.user.id missing; attempting backend lookup by email',
            data: {
              emailPrefix: sessionEmail ? String(sessionEmail).slice(0, 3) : null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
      }
      // #endregion

      if (authUser.id) {
        // #region debug log H1_useAuth_authenticated_user_id_present
        fetch(DEBUG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': DEBUG_SESSION_ID,
          },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: 'debug_initial',
            hypothesisId: 'H1_missing_user_id_in_nextauth_session',
            location: 'frontend/hooks/useAuth.ts:authUser_setUser',
            message: 'authUser.id present; syncing user state',
            data: {
              userIdPrefix: authUser.id ? String(authUser.id).slice(0, 8) : null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion

        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
        setUser(authUser)
      } else if (sessionEmail) {
        // Resolve backend user id by email as a fallback.
        ;(async () => {
          const backendId = await resolveBackendUserIdByEmail(sessionEmail)

          // #region debug log H1_backend_lookup_result
          fetch(DEBUG_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Session-Id': DEBUG_SESSION_ID,
            },
            body: JSON.stringify({
              sessionId: DEBUG_SESSION_ID,
              runId: 'debug_initial',
              hypothesisId: 'H1_missing_user_id_in_nextauth_session',
              location: 'frontend/hooks/useAuth.ts:backendId_lookup_result',
              message: 'backend lookup attempted',
              data: {
                emailPrefix: String(sessionEmail).slice(0, 3),
                backendIdPresent: !!backendId,
                backendIdPrefix: backendId ? String(backendId).slice(0, 8) : null,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {})
          // #endregion

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
      // #region debug log H1_useAuth_unauthenticated
      fetch(DEBUG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': DEBUG_SESSION_ID,
        },
        body: JSON.stringify({
          sessionId: DEBUG_SESSION_ID,
          runId: 'debug_initial',
          hypothesisId: 'H1_missing_user_id_in_nextauth_session',
          location: 'frontend/hooks/useAuth.ts:unauthenticated',
          message: 'useAuth status unauthenticated; clearing user',
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

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
