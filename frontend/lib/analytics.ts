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

// Enhanced conversion tracking
export const trackConversion = (event: string, value?: number) => {
  trackEvent({
    action: event,
    category: 'Conversion',
    label: 'Landing Page',
    value: value,
  })
}

// Track demo interactions
export const trackDemoInteraction = (action: string, step?: number) => {
  trackEvent({
    action: action,
    category: 'Demo',
    label: step ? `Step ${step}` : undefined,
  })
}

// Track testimonial engagement
export const trackTestimonialEngagement = (testimonialId: string, action: string) => {
  trackEvent({
    action: action,
    category: 'Testimonials',
    label: testimonialId,
  })
}

// Track ROI calculator usage
export const trackROIInteraction = (action: string, value?: number) => {
  trackEvent({
    action: action,
    category: 'ROI Calculator',
    value: value,
  })
}

// Track scroll depth
export const trackScrollDepth = (depth: string) => {
  trackEvent({
    action: 'scroll_depth',
    category: 'Engagement',
    label: depth,
  })
}

// Track time on page
export const trackTimeOnPage = (seconds: number) => {
  trackEvent({
    action: 'time_on_page',
    category: 'Engagement',
    value: seconds,
  })
}

// Predefined event categories for consistency
export const AnalyticsCategories = {
  AUTH: 'Authentication',
  NAVIGATION: 'Navigation',
  RULES: 'Rules',
  EMAILS: 'Emails',
  AI: 'AI',
  DASHBOARD: 'Dashboard',
  FEATURES: 'Features',
  CONVERSION: 'Conversion',
  DEMO: 'Demo',
  TESTIMONIALS: 'Testimonials',
  ENGAGEMENT: 'Engagement',
  ROI_CALCULATOR: 'ROI Calculator',
}

// Conversion events
export const ConversionEvents = {
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  DEMO_STARTED: 'demo_started',
  DEMO_COMPLETED: 'demo_completed',
  CTA_CLICKED: 'cta_clicked',
  ROI_CALCULATED: 'roi_calculated',
  TESTIMONIAL_VIEWED: 'testimonial_viewed',
  TESTIMONIAL_VIDEO_PLAYED: 'testimonial_video_played',
}
