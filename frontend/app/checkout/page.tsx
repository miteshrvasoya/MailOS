'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Shield, ArrowRight, Loader2, Sparkles, Gift, Rocket, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { signIn } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'

const PLANS: Record<string, { name: string; originalPrice: number; features: string[] }> = {
  free: {
    name: 'Starter',
    originalPrice: 0,
    features: [
      'Up to 1,000 emails/month',
      'Smart AI grouping',
      'Weekly digest summary',
      'Basic AI classification',
    ],
  },
  starter: {
    name: 'Starter',
    originalPrice: 0,
    features: [
      'Up to 1,000 emails/month',
      'Smart AI grouping',
      'Weekly digest summary',
      'Basic AI classification',
    ],
  },
  pro: {
    name: 'Pro',
    originalPrice: 15,
    features: [
      'Unlimited emails processed',
      'Daily AI digest summary',
      'Custom filtering rules',
      'Priority email support',
    ],
  },
  premium: {
    name: 'Premium',
    originalPrice: 29,
    features: [
      'Everything in Pro',
      'Advanced AI learning & adaptation',
      'Multiple custom digests',
      'Dedicated 24/7 support',
      'Early access to new features',
    ],
  },
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan')?.toLowerCase() || 'premium'
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  const selectedPlan = PLANS[planKey] || PLANS.premium

  const [isProcessing, setIsProcessing] = useState(false)

  const handleClaimAccess = () => {
    setIsProcessing(true)

    if (isAuthenticated) {
      // Already logged in — go directly to dashboard
      toast({
        title: '🎉 Welcome to MailOS!',
        description: `You now have full ${selectedPlan.name} access — free during our launch!`,
      })
      setTimeout(() => router.push('/dashboard'), 800)
    } else {
      // Not logged in — trigger Google sign-in
      toast({
        title: 'Redirecting to sign up...',
        description: 'Sign in with Google to activate your free access.',
      })
      setTimeout(() => signIn('google', { callbackUrl: '/dashboard' }), 800)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
      <div className="text-center space-y-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-emerald/10 text-accent-emerald text-sm font-semibold border border-accent-emerald/20">
          <Rocket className="w-4 h-4" />
          Launch Offer — 100% Free
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Claim your <span className="gradient-text">{selectedPlan.name}</span> plan
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          All features are free during our launch period. No credit card. No commitments.
        </p>
      </div>

      <Card className="p-8 md:p-10 border-border shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
        {/* Plan Summary */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedPlan.name} Plan</h2>
            <p className="text-sm text-muted-foreground mt-1">Full access, no restrictions</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            {selectedPlan.originalPrice > 0 && (
              <div className="flex items-center gap-1.5 mt-1 justify-end">
                <span className="text-sm text-muted-foreground line-through">${selectedPlan.originalPrice}/mo</span>
                <span className="text-xs font-bold text-accent-emerald bg-accent-emerald/10 px-2 py-0.5 rounded-full">FREE</span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {selectedPlan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <Check className="w-4 h-4 text-accent-emerald flex-shrink-0" />
              <span className="text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>

        {/* Launch badge */}
        <div className="rounded-xl bg-accent-emerald/5 dark:bg-accent-emerald/10 border border-accent-emerald/20 p-4 mb-8 flex items-start gap-3">
          <Gift className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Free during launch 🎉</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We'll notify you before any pricing changes. You'll never be charged without consent.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full text-base h-13 font-semibold group shadow-lg hover:shadow-primary/25"
          onClick={handleClaimAccess}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setting up your account...</>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {isAuthenticated ? 'Go to Dashboard' : 'Get Free Access with Google'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-accent-emerald" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span>Read-only access</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  )
}


