import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Check, Gift, ArrowRight, Sparkles, Rocket } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for getting started and exploring.',
    originalPrice: '$0',
    features: [
      'Up to 1,000 emails/month',
      'Smart AI grouping',
      'Weekly digest summary',
      'Basic AI classification',
      'Community support'
    ],
    cta: 'Get Free Access',
    highlighted: false
  },
  {
    name: 'Pro',
    description: 'For power users needing robust email management.',
    originalPrice: '$15',
    features: [
      'Unlimited emails processed',
      'All Starter features',
      'Daily AI digest summary',
      'Custom filtering rules',
      'Priority email support',
    ],
    cta: 'Get Free Access',
    highlighted: false
  },
  {
    name: 'Premium',
    description: 'Advanced AI and total workflow automation.',
    originalPrice: '$29',
    features: [
      'Everything in Pro',
      'Advanced AI learning & adaptation',
      'Create calendar events automatically',
      'Multiple custom digests',
      'Dedicated 24/7 support',
      'Early access to new features'
    ],
    cta: 'Get Free Access',
    highlighted: true,
    badge: 'Best Value',
  }
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Launch Offer Banner */}
      <div className="bg-gradient-to-r from-accent-emerald via-primary to-accent-purple text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" />
            Launch Offer
          </span>
          <span className="text-sm sm:text-base font-semibold">
            🎉 All plans are <strong>100% FREE</strong> during our launch period — no credit card required!
          </span>
        </div>
      </div>
      
      <section className="px-6 py-20 lg:py-28 max-w-7xl mx-auto flex-1 w-full">
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-emerald/10 text-accent-emerald text-sm font-semibold border border-accent-emerald/20 mb-2">
            <Gift className="w-4 h-4" />
            Everything free — limited time only
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            All features, <span className="gradient-text">completely free</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're launching MailOS and want you to experience the full power — every feature, every plan, at zero cost.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl border p-8 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 ${
                plan.highlighted
                  ? 'border-primary shadow-2xl bg-background md:-mt-8 md:mb-8 ring-1 ring-primary/20'
                  : 'border-border bg-card/50 hover:bg-card hover:shadow-lg mt-0'
              }`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground font-medium">/month</span>
                </div>
                {plan.originalPrice !== '$0' && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}/mo</span>
                    <span className="text-xs font-bold text-accent-emerald bg-accent-emerald/10 px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  </div>
                )}
                <div className="mt-3 text-sm font-medium text-accent-emerald flex items-center gap-1.5 bg-accent-emerald/5 dark:bg-accent-emerald/10 w-fit px-3 py-1.5 rounded-lg border border-accent-emerald/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Free during launch
                </div>
              </div>
              
              <Button
                className={`w-full mb-8 h-12 text-base font-semibold group ${plan.highlighted ? 'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30' : ''}`}
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
              >
                <Link href="/login">
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <div className="space-y-4 flex-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Features included:</p>
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex gap-3 items-start">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="px-6 py-24 bg-secondary/30 border-t border-border mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight">Frequently asked questions</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                q: 'Is MailOS really free right now?',
                a: 'Yes! During our launch period, every plan and every feature is completely free. No credit card required — just sign up with Google and start using MailOS.'
              },
              {
                q: 'Will I be charged when the free period ends?',
                a: 'No. We will notify you well in advance before any pricing changes. You will never be charged without your explicit consent.'
              },
              {
                q: 'Which plan should I pick?',
                a: "Since all plans are free, we recommend starting with Premium to get the full experience. You'll have access to every feature including advanced AI and priority support."
              },
              {
                q: 'Is my email data secure?',
                a: 'Absolutely. We use strict read-only access with AES-256 encryption. We never sell your data and you can revoke access at any time.'
              }
            ].map((faq, i) => (
              <div key={i} className="space-y-2">
                <h3 className="font-semibold text-lg">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
