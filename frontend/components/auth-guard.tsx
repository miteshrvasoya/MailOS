'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7489/ingest/e464efb9-3f59-4123-a70c-2cb6541aad5c'
const DEBUG_SESSION_ID = '22f7dc'

/**
 * Wraps dashboard pages — redirects to landing page if user is not authenticated.
 * Uses the shared useAuth hook so landing + header + dashboard all agree on auth state.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // #region debug log H1_authguard_redirect_if_unauth
      fetch(DEBUG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': DEBUG_SESSION_ID,
        },
        body: JSON.stringify({
          sessionId: DEBUG_SESSION_ID,
          runId: 'debug_initial',
          hypothesisId: 'H2_authguard_redirect_loop_or_false_auth',
          location: 'frontend/components/auth-guard.tsx:redirect',
          message: 'AuthGuard redirect fired',
          data: { isLoading, isAuthenticated },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    // #region debug log H1_authguard_loading_forever
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
        location: 'frontend/components/auth-guard.tsx:render_loader',
        message: 'AuthGuard rendering loading screen',
        data: { isLoading, isAuthenticated },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Redirecting
  }

  return <>{children}</>
}
