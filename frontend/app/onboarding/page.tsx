'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Sparkles, Shield, Eye, Tag, Check, ChevronRight, 
  Loader2, Mail, Brain, FileText, DollarSign, Megaphone, Briefcase 
} from 'lucide-react'
import api from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

const STEPS = ['welcome', 'how_it_works', 'mode_selection', 'category_selection', 'preview', 'confirm']

const CATEGORIES = [
  { id: 'important', label: 'Important Emails', icon: Sparkles, default: true },
  { id: 'newsletters', label: 'Newsletters', icon: FileText, default: true },
  { id: 'job', label: 'Job Applications', icon: Briefcase, default: true },
  { id: 'finance', label: 'Finance', icon: DollarSign, default: false },
  { id: 'promotions', label: 'Promotions', icon: Megaphone, default: false },
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [actionMode, setActionMode] = useState('review_first')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORIES.filter(c => c.default).map(c => c.id)
  )
  const [previewResults, setPreviewResults] = useState<{category: string, count: number}[]>([])
  const [loading, setLoading] = useState(false)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID from session
    if (session?.user?.id) {
      setUserId(session.user.id as string)
    }
  }, [session])

  const nextStep = async () => {
    // Save state to backend at key steps
    if (userId) {
      try {
        if (currentStep === 2) { // Mode selection
          trackEvent({ action: 'select_mode', category: 'Onboarding', label: actionMode })
          await api.post(`/onboarding/update-mode/${userId}`, { action_mode: actionMode })
        }
        if (currentStep === 3) { // Category selection
          await api.post(`/onboarding/update-categories/${userId}`, { categories: selectedCategories })
        }
        await api.post(`/onboarding/update-step/${userId}`, { step: STEPS[currentStep + 1] })
      } catch (e) {
        console.error('Failed to save state:', e)
      }
    }
    
    // If moving to preview step, kick off sync in the BACKGROUND (non-blocking)
    if (currentStep === 3) {
      setSyncInProgress(true)
      api.post('/gmail/sync', { user_id: userId, mode: 'preview' })
        .then(res => {
          const groups = res.data.groups || []
          setPreviewResults(groups.map((g: any) => ({ category: g.name, count: g.count })))
        })
        .catch(e => {
          console.error('Background sync failed:', e)
        })
        .finally(() => {
          setSyncInProgress(false)
        })
    }
    
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  const completeOnboarding = async () => {
    if (userId) {
      try {
        trackEvent({ action: 'complete_onboarding', category: 'Onboarding', label: userId })
        await api.post(`/onboarding/complete/${userId}`)
      } catch (e) {
        console.error('Failed to complete:', e)
      }
    }
    router.push('/dashboard')
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // Step Indicator
  const StepIndicator = () => (
    <div className="flex justify-center gap-2 mb-8">
      {STEPS.map((_, idx) => (
        <div 
          key={idx}
          className={`w-2 h-2 rounded-full transition-all ${
            idx === currentStep ? 'w-6 bg-primary' : 
            idx < currentStep ? 'bg-primary/60' : 'bg-secondary'
          }`}
        />
      ))}
    </div>
  )

  // Step 0: Welcome
  if (currentStep === 0) {
    return (
      <Card className="p-8 text-center">
        <StepIndicator />
        <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Welcome to MailOS</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Let's set up your inbox intelligence in 2 minutes.
        </p>
        <Button size="lg" onClick={nextStep} className="gap-2">
          Start Setup <ChevronRight className="h-4 w-4" />
        </Button>
        <button 
          onClick={() => router.push('/dashboard')}
          className="block mx-auto mt-4 text-sm text-muted-foreground hover:underline"
        >
          Skip for now
        </button>
      </Card>
    )
  }

  // Step 1: How it Works
  if (currentStep === 1) {
    const features = [
      { icon: Eye, text: 'We read your emails (read-only)' },
      { icon: Shield, text: 'We never send or delete emails' },
      { icon: Tag, text: 'We only add labels (if you allow)' },
      { icon: Check, text: 'You review before we apply changes' },
    ]
    return (
      <Card className="p-8">
        <StepIndicator />
        <h2 className="text-2xl font-bold mb-2 text-center">How MailOS Works</h2>
        <p className="text-muted-foreground mb-8 text-center">Your privacy and control are our priorities.</p>
        
        <div className="space-y-4 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{f.text}</span>
            </div>
          ))}
        </div>
        
        <Button className="w-full" size="lg" onClick={nextStep}>
          Continue <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    )
  }

  // Step 2: Mode Selection
  if (currentStep === 2) {
    return (
      <Card className="p-8">
        <StepIndicator />
        <h2 className="text-2xl font-bold mb-2 text-center">How should MailOS organize?</h2>
        <p className="text-muted-foreground mb-8 text-center">You can change this anytime in Settings.</p>
        
        <div className="grid gap-4 mb-8">
          <div 
            onClick={() => setActionMode('review_first')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
              actionMode === 'review_first' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                actionMode === 'review_first' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {actionMode === 'review_first' && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div>
                <h3 className="font-semibold mb-1">Review before applying</h3>
                <p className="text-sm text-muted-foreground">MailOS suggests labels. You approve before changes.</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setActionMode('auto_apply')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
              actionMode === 'auto_apply' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                actionMode === 'auto_apply' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {actionMode === 'auto_apply' && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div>
                <h3 className="font-semibold mb-1">Auto-apply labels</h3>
                <p className="text-sm text-muted-foreground">MailOS organizes automatically. Zero friction.</p>
              </div>
            </div>
          </div>
        </div>
        
        <Button className="w-full" size="lg" onClick={nextStep}>
          Continue <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    )
  }

  // Step 3: Category Selection
  if (currentStep === 3) {
    return (
      <Card className="p-8">
        <StepIndicator />
        <h2 className="text-2xl font-bold mb-2 text-center">What should we organize?</h2>
        <p className="text-muted-foreground mb-8 text-center">Select the categories to focus on first.</p>
        
        <div className="grid gap-3 mb-8">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const selected = selectedCategories.includes(cat.id)
            return (
              <div 
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4 ${
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  selected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium flex-1">{cat.label}</span>
                <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                  selected ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}>
                  {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            )
          })}
        </div>
        
        <Button className="w-full" size="lg" onClick={nextStep} disabled={selectedCategories.length === 0}>
          Continue <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    )
  }

  // Step 4: Preview
  if (currentStep === 4) {
    return (
      <Card className="p-8">
        <StepIndicator />
        <h2 className="text-2xl font-bold mb-2 text-center">
          {syncInProgress && previewResults.length === 0 ? 'Scanning your inbox...' : 'Here\'s what we found'}
        </h2>
        <p className="text-muted-foreground mb-8 text-center">
          {syncInProgress ? 'Sync is running in the background. You can continue anytime.' : 'Nothing has been changed yet.'}
        </p>
        
        {syncInProgress && previewResults.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">This won&apos;t take long...</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {previewResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">{r.category}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {r.count} emails
                </span>
              </div>
            ))}
            {syncInProgress && (
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Still syncing...
              </div>
            )}
          </div>
        )}
        
        <Button className="w-full" size="lg" onClick={nextStep}>
          {previewResults.length > 0 ? 'Looks good' : 'Continue'} <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    )
  }

  // Step 5: Confirm
  if (currentStep === 5) {
    return (
      <Card className="p-8 text-center">
        <StepIndicator />
        <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Ready to organize!</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {actionMode === 'review_first' 
            ? 'We\'ll suggest labels for you to approve.' 
            : 'We\'ll automatically organize your inbox.'}
        </p>
        
        <Button size="lg" onClick={completeOnboarding} className="gap-2">
          Go to Dashboard <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    )
  }

  return null
}
