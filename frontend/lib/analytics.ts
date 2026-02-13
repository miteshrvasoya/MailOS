type GTagEvent = {
  action: string
  category: string
  label?: string
  value?: number
}

export const trackEvent = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Predefined event categories for consistency
export const AnalyticsCategories = {
  AUTH: 'Authentication',
  NAVIGATION: 'Navigation',
  RULES: 'Rules',
  EMAILS: 'Emails',
  AI: 'AI',
  DASHBOARD: 'Dashboard',
}
