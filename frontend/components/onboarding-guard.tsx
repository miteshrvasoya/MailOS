'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import api from '@/lib/api'
import { Loader2 } from 'lucide-react'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { userId, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoading) return
      
      if (!userId) {
        setChecking(false)
        setPassed(true) // Let middleware handle auth
        return
      }
      
      try {
        const res = await api.get(`/onboarding/state/${userId}`)
        const { completed } = res.data
        
        if (!completed && !pathname.startsWith('/onboarding')) {
          router.replace('/onboarding')
        } else {
          setPassed(true)
        }
      } catch (e) {
        // If API fails, allow access (fail-open)
        console.error('Onboarding check failed:', e)
        setPassed(true)
      } finally {
        setChecking(false)
      }
    }
    
    checkOnboarding()
  }, [userId, isLoading, pathname, router])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  if (!passed) {
    return null // Redirecting
  }

  return <>{children}</>
}
