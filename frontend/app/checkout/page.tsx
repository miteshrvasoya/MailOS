'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Shield, Lock, CreditCard, ArrowRight, Loader2, Tag } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const PLANS = {
  free: { name: 'Free', price: 0, interval: 'month' },
  pro: { name: 'Pro', price: 15, interval: 'month' },
  premium: { name: 'Premium', price: 29, interval: 'month' },
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan')?.toLowerCase() || 'pro'
  const { toast } = useToast()

  const selectedPlan = PLANS[planKey as keyof typeof PLANS] || PLANS.pro
  
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponError, setCouponError] = useState('')

  const basePrice = selectedPlan.price
  const discountAmount = appliedCoupon ? (basePrice * appliedCoupon.discount) / 100 : 0
  const finalPrice = Math.max(0, basePrice - discountAmount)

  const handleApplyCoupon = () => {
    setCouponError('')
    if (!coupon.trim()) return

    // Mock coupon logic
    if (coupon.toUpperCase() === 'LAUNCH20') {
      setAppliedCoupon({ code: 'LAUNCH20', discount: 20 })
      toast({ title: 'Coupon applied!', description: 'You got 20% off your subscription.' })
    } else if (coupon.toUpperCase() === 'PREMIUM50' && planKey === 'premium') {
      setAppliedCoupon({ code: 'PREMIUM50', discount: 50 })
      toast({ title: 'Special discount applied!', description: 'You got 50% off the Premium plan.' })
    } else {
      setCouponError('Invalid or expired coupon code.')
      setAppliedCoupon(null)
    }
  }

  const handleCheckout = () => {
    setIsProcessing(true)
    // Simulate API call for payment processing
    setTimeout(() => {
      setIsProcessing(false)
      toast({
        title: 'Payment successful!',
        description: `Welcome to the ${selectedPlan.name} plan.`,
      })
      router.push('/dashboard')
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          
          {/* Left Column: Checkout Form */}
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Complete your upgrade</h1>
              <p className="text-muted-foreground">You are upgrading to the <span className="font-semibold text-foreground">{selectedPlan.name}</span> plan. Secure payment powered by Stripe.</p>
            </div>

            <Card className="p-6 md:p-8 border-border shadow-sm">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Details
              </h2>
              
              <div className="space-y-4">
                {/* Mock Payment Form */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Card Information</label>
                  <div className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 flex items-center justify-between opacity-70 cursor-not-allowed">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> 
                      •••• •••• •••• 4242
                    </span>
                    <span className="text-xs text-muted-foreground">MM/YY CVC</span>
                  </div>
                  <p className="text-xs text-muted-foreground">This is a mock checkout for demonstration.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Name on Card</label>
                  <input 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Jane Doe"
                    defaultValue="Test User"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button 
                  className="w-full text-base h-12" 
                  onClick={handleCheckout} 
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                     <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    <>Pay ${finalPrice.toFixed(2)} / {selectedPlan.interval} <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full md:w-80 lg:w-96 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
            <Card className="p-6 bg-secondary/20 border-border">
              <h3 className="font-semibold mb-6">Order Summary</h3>
              
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="font-medium text-foreground">{selectedPlan.name} Plan</span>
                <span>${basePrice.toFixed(2)}/{selectedPlan.interval}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between items-center mb-4 text-sm text-green-600 font-medium">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount ({appliedCoupon.code})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-border/50 my-4 pt-4 flex justify-between items-center">
                <span className="font-semibold">Total due today</span>
                <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
              </div>

              {/* Coupon input */}
              <div className="pt-4 border-t border-border/50">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Have a coupon code?</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="e.g. LAUNCH20"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors uppercase"
                  />
                  <Button variant="secondary" size="sm" onClick={handleApplyCoupon} className="h-9">Apply</Button>
                </div>
                {couponError && <p className="text-xs text-destructive mt-2">{couponError}</p>}
              </div>
            </Card>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">30-Day Guarantee</h4>
                  <p className="text-xs text-muted-foreground">Not satisfied? Get a full refund within 30 days, no questions asked.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Cancel Anytime</h4>
                  <p className="text-xs text-muted-foreground">You can cancel your subscription at any moment from your settings.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
