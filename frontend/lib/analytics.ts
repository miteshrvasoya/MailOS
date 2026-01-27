type GTagEvent = {
  action: string
  category: string
  label?: string
  value?: number
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const trackEvent = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
    })
  }
}
