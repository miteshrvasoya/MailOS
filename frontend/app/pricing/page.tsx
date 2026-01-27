import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: '$0',
    features: [
      'Up to 1,000 emails/month',
      'Smart grouping',
      'Weekly digest',
      'Basic AI classification',
      'Email support'
    ],
    cta: 'Get Started'
  },
  {
    name: 'Pro',
    description: 'For power users',
    price: '$12',
    period: '/month',
    features: [
      'Unlimited emails',
      'All Free features',
      'Daily digest',
      'Custom rules',
      'Advanced AI learning',
      'Priority support',
      'Multiple digests'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Self-Hosted',
    description: 'Enterprise privacy',
    price: 'Custom',
    features: [
      'Full source code',
      'Deploy anywhere',
      'Unlimited users',
      'Premium features',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ],
    cta: 'Contact Sales'
  }
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your email management needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-xl border p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-primary bg-card ring-2 ring-primary/20 scale-105'
                  : 'border-border bg-card'
              }`}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </div>
              
              <Button
                className="w-full mb-8"
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
              >
                <Link href="/login">{plan.cta}</Link>
              </Button>
              
              <div className="space-y-4 flex-1">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
          
          <div className="space-y-8">
            {[
              {
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes! You can change your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and bank transfers for enterprise plans.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer 30-day money-back guarantee if you\'re not satisfied.'
              },
              {
                q: 'Is there a free trial for Pro?',
                a: 'Yes, get 14 days free to try all Pro features before committing.'
              }
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 MailOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
