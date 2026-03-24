import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Check, Tag, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started and exploring.',
    price: '$0',
    period: '/month',
    features: [
      'Up to 1,000 emails/month',
      'Smart AI grouping',
      'Weekly digest summary',
      'Basic AI classification',
      'Community support'
    ],
    cta: 'Start for Free',
    href: '/login',
    highlighted: false
  },
  {
    name: 'Pro',
    description: 'For power users needing robust email management.',
    price: '$15',
    period: '/month',
    features: [
      'Unlimited emails processed',
      'All Free features',
      'Daily AI digest summary',
      'Custom filtering rules',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    href: '/checkout?plan=pro',
    highlighted: false
  },
  {
    name: 'Premium',
    description: 'Advanced AI and total workflow automation.',
    price: '$29',
    period: '/month',
    features: [
      'Everything in Pro',
      'Advanced AI learning & adaptation',
      'Create calendar events automatically',
      'Multiple custom digests',
      'Dedicated 24/7 support',
      'Early access to new features'
    ],
    cta: 'Get Premium',
    href: '/checkout?plan=premium',
    highlighted: true,
    badge: 'Most Popular',
    discountCode: 'PREMIUM50',
    discountText: 'Save 50% with code'
  }
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-primary to-accent-purple text-white py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase">Launch Offer</span>
          <span className="text-sm font-medium">Use code <strong>LAUNCH20</strong> at checkout for 20% off all plans!</span>
        </div>
      </div>
      
      <section className="px-6 py-20 lg:py-28 max-w-7xl mx-auto flex-1 w-full">
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan to reclaim hours of your time every week.
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
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground font-medium">{plan.period}</span>}
                </div>
                {plan.discountCode && (
                  <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 w-fit px-2.5 py-1 rounded-md">
                    <Tag className="w-3.5 h-3.5" />
                    {plan.discountText} <span className="font-bold">{plan.discountCode}</span>
                  </div>
                )}
              </div>
              
              <Button
                className={`w-full mb-8 h-12 text-base font-semibold group ${plan.highlighted ? 'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30' : ''}`}
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.href}>
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
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes! You can change your plan at any time from your dashboard. Changes take effect immediately and are prorated.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards including Visa, Mastercard, American Express, and Discover via Stripe.'
              },
              {
                q: 'Do you offer refunds?',
                a: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with the product. No questions asked."
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
