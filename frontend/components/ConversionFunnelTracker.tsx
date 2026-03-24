'use client'

import { useEffect } from 'react'
import { trackEvent, trackTimeOnPage, AnalyticsCategories } from '@/lib/analytics'

interface ConversionFunnelTrackerProps {
  children: React.ReactNode
}

export function ConversionFunnelTracker({ children }: ConversionFunnelTrackerProps) {
  useEffect(() => {
    // Track page view
    trackEvent({
      action: 'page_view',
      category: AnalyticsCategories.NAVIGATION,
      label: 'Landing Page',
    })

    // Track time on page when user leaves
    const startTime = Date.now()
    
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000)
      trackTimeOnPage(timeOnPage)
    }

    // Track user engagement events
    const handleEngagement = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Track CTA clicks
      if (target.closest('[data-cta]')) {
        trackEvent({
          action: 'cta_engagement',
          category: AnalyticsCategories.CONVERSION,
          label: target.closest('[data-cta]')?.getAttribute('data-cta') || 'unknown',
        })
      }

      // Track demo interactions
      if (target.closest('[data-demo-action]')) {
        trackEvent({
          action: 'demo_engagement',
          category: AnalyticsCategories.DEMO,
          label: target.closest('[data-demo-action]')?.getAttribute('data-demo-action') || 'unknown',
        })
      }

      // Track testimonial interactions
      if (target.closest('[data-testimonial]')) {
        trackEvent({
          action: 'testimonial_engagement',
          category: AnalyticsCategories.TESTIMONIALS,
          label: target.closest('[data-testimonial]')?.getAttribute('data-testimonial') || 'unknown',
        })
      }
    }

    // Track form interactions
    const handleFormInteraction = (event: FocusEvent) => {
      const target = event.target as HTMLInputElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        trackEvent({
          action: 'form_interaction',
          category: AnalyticsCategories.CONVERSION,
          label: target.name || target.type || 'unknown',
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleEngagement)
    document.addEventListener('focus', handleFormInteraction, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleEngagement)
      document.removeEventListener('focus', handleFormInteraction, true)
    }
  }, [])

  return <>{children}</>
}
