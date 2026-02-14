'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function UTMTrackerContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const source = searchParams.get('utm_source')
    const medium = searchParams.get('utm_medium')
    const campaign = searchParams.get('utm_campaign')

    if (source || medium || campaign) {
      const utm = {
        source: source || '',
        medium: medium || '',
        campaign: campaign || '',
        timestamp: new Date().toISOString()
      }
      try {
        localStorage.setItem('mailos_utm', JSON.stringify(utm))
      } catch (e) {
        // ignore storage access errors
      }
    }
  }, [searchParams])

  return null
}

export function UTMTracker() {
  return (
    <Suspense fallback={null}>
      <UTMTrackerContent />
    </Suspense>
  )
}
