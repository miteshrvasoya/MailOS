'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, Clock, DollarSign, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackROIInteraction, ConversionEvents } from '@/lib/analytics'

interface ROIResult {
  timeSaved: number
  timeSavedPerMonth: number
  timeSavedPerWeek: number
  productivityGain: number
  emailsProcessed: number
  importantEmailsNeverMissed: number
}

interface ROICalculatorProps {
  className?: string
}

export function ROICalculator({ className = '' }: ROICalculatorProps) {
  const [emailsPerDay, setEmailsPerDay] = useState(50)
  const [timePerEmail, setTimePerEmail] = useState(2)
  const [hourlyRate, setHourlyRate] = useState(75)
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(22)
  const [result, setResult] = useState<ROIResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateROI = () => {
    setIsCalculating(true)
    
    // Track calculation start
    trackROIInteraction('calculation_started')
    
    // Simulate calculation delay for UX
    setTimeout(() => {
      const emailsPerMonth = emailsPerDay * workDaysPerMonth
      const totalTimePerMonth = (emailsPerMonth * timePerEmail) / 60 // hours
      const mailOSTimePerMonth = (emailsPerMonth * 0.5) / 60 // 30 seconds per email with MailOS
      const timeSavedPerMonth = totalTimePerMonth - mailOSTimePerMonth
      const timeSavedPerYear = timeSavedPerMonth * 12
      const timeSavedPerWeek = timeSavedPerMonth * 12 / 52 // Weekly time saved
      
      // Calculate important emails that would never be missed (15% of emails are typically important)
      const importantEmailsPerMonth = Math.round(emailsPerMonth * 0.15)
      const importantEmailsNeverMissed = importantEmailsPerMonth * 12
      
      const productivityGain = ((timeSavedPerMonth / totalTimePerMonth) * 100)
      
      setResult({
        timeSaved: Math.round(timeSavedPerYear),
        timeSavedPerMonth: Math.round(timeSavedPerMonth),
        timeSavedPerWeek: Math.round(timeSavedPerWeek),
        productivityGain: Math.round(productivityGain),
        emailsProcessed: emailsPerMonth * 12,
        importantEmailsNeverMissed: importantEmailsNeverMissed
      })
      
      // Track calculation completion with time saved value
      trackROIInteraction(ConversionEvents.ROI_CALCULATED, Math.round(timeSavedPerYear))
      setIsCalculating(false)
    }, 1500)
  }

  useEffect(() => {
    calculateROI()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (hours: number) => {
    const days = Math.floor(hours / 8)
    const remainingHours = hours % 8
    
    if (days > 0) {
      return `${days} days ${remainingHours} hours`
    }
    return `${hours} hours`
  }

  return (
    <div className={`bg-card rounded-2xl border border-border p-8 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Calculate Your ROI
          </h2>
          <p className="text-muted-foreground text-lg">
            See how much time and money MailOS can save you
          </p>
        </div>

        {/* Calculator Form */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Input Fields */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Current Situation</h3>
            
            {/* Emails per day */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Emails received per day
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={emailsPerDay}
                  onChange={(e) => setEmailsPerDay(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="w-16 text-center">
                  <span className="text-lg font-bold text-primary">{emailsPerDay}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10</span>
                <span>200</span>
              </div>
            </div>

            {/* Time per email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Average time per email (minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={timePerEmail}
                  onChange={(e) => setTimePerEmail(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <div className="w-16 text-center">
                  <span className="text-lg font-bold text-primary">{timePerEmail}m</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>30s</span>
                <span>5m</span>
              </div>
            </div>

            {/* Hourly rate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hourly rate ($)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="25"
                  max="300"
                  step="25"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="w-20 text-center">
                  <span className="text-lg font-bold text-primary">${hourlyRate}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$25</span>
                <span>$300</span>
              </div>
            </div>

            {/* Work days */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Work days per month
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="30"
                  value={workDaysPerMonth}
                  onChange={(e) => setWorkDaysPerMonth(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="w-16 text-center">
                  <span className="text-lg font-bold text-primary">{workDaysPerMonth}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            <Button 
              onClick={calculateROI} 
              disabled={isCalculating}
              className="w-full button-interactive"
            >
              {isCalculating ? 'Calculating...' : 'Calculate Savings'}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Annual Savings</h3>
            
            {isCalculating ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg loading-skeleton" />
                ))}
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium text-foreground">Time Saved Weekly</span>
                    </div>
                    <div className="text-2xl font-bold text-accent-emerald">
                      {result.timeSavedPerWeek}h
                    </div>
                    <p className="text-sm text-muted-foreground">Every week</p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-important">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium text-foreground">Important Emails Never Missed</span>
                    </div>
                    <div className="text-2xl font-bold text-important">
                      {result.importantEmailsNeverMissed}
                    </div>
                    <p className="text-sm text-muted-foreground">Per year</p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-accent-purple">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-medium text-foreground">Productivity Gain</span>
                    </div>
                    <div className="text-2xl font-bold text-accent-purple">
                      {result.productivityGain}%
                    </div>
                    <p className="text-sm text-muted-foreground">More efficient</p>
                  </div>
                </div>
                
                {/* Emails Processed */}
                <div className="bg-gradient-to-r from-accent-purple/10 to-accent-purple/5 rounded-xl p-4 border border-accent-purple/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-accent-purple" />
                    <span className="font-medium text-foreground">Emails Processed</span>
                  </div>
                  <div className="text-2xl font-bold text-accent-purple">
                    {result.emailsProcessed.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Per year with MailOS</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Adjust the sliders to see your potential savings</p>
              </div>
            )}
          </div>
        </div>

        {/* Benefits List */}
        <div className="border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">How MailOS Delivers These Results</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'AI classification reduces manual sorting by 80%',
              'Smart grouping handles similar emails automatically',
              'Daily digest saves hours of scrolling',
              'Follow-up tracking prevents missed opportunities',
              'One-click actions speed up email processing',
              'Priority detection ensures important emails are seen first'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-important flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
