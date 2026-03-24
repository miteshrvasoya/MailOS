'use client'

import { useState, useEffect } from 'react'
import { Mail, Brain, Star, Layers, Filter, FileText, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackDemoInteraction, ConversionEvents } from '@/lib/analytics'

interface DemoStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  action: string
}

export function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [emailCount, setEmailCount] = useState(187)
  const [processedCount, setProcessedCount] = useState(0)

  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: "Connect Gmail",
      description: "Secure read-only access in one click. No data stored.",
      icon: Mail,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: "Connecting to Gmail..."
    },
    {
      id: 2,
      title: "AI Analysis",
      description: "Our AI analyzes and categorizes every email automatically",
      icon: Brain,
      color: "text-accent-purple",
      bgColor: "bg-accent-purple/10",
      action: "Analyzing 187 emails..."
    },
    {
      id: 3,
      title: "Smart Detection",
      description: "Important emails are surfaced automatically, never missed",
      icon: Star,
      color: "text-important",
      bgColor: "bg-important/10",
      action: "Found 6 important emails"
    },
    {
      id: 4,
      title: "Daily Digest Ready",
      description: "Your clean, prioritized email summary is ready",
      icon: FileText,
      color: "text-accent-emerald",
      bgColor: "bg-accent-emerald/10",
      action: "Digest generated successfully"
    }
  ]

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= demoSteps.length - 1) {
          return prev
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying, demoSteps.length])

  // Track interactions and handle demo completion safely outside of the state updater
  useEffect(() => {
    if (!isPlaying) return

    if (currentStep === demoSteps.length - 1) {
      setIsPlaying(false)
      trackDemoInteraction(ConversionEvents.DEMO_COMPLETED, demoSteps.length)
    } else {
      trackDemoInteraction(`demo_step_${currentStep + 1}`, currentStep + 1)
    }
  }, [currentStep, isPlaying, demoSteps.length])

  useEffect(() => {
    if (currentStep === 1 && isPlaying) {
      // Simulate email processing
      const processInterval = setInterval(() => {
        setProcessedCount((prev) => {
          if (prev >= emailCount) {
            clearInterval(processInterval)
            return emailCount
          }
          return prev + Math.floor(Math.random() * 10) + 5
        })
      }, 100)

      return () => clearInterval(processInterval)
    }
  }, [currentStep, isPlaying, emailCount])

  const startDemo = () => {
    setCurrentStep(0)
    setProcessedCount(0)
    setIsPlaying(true)
    trackDemoInteraction(ConversionEvents.DEMO_STARTED)
  }

  const resetDemo = () => {
    setCurrentStep(0)
    setProcessedCount(0)
    setIsPlaying(false)
  }

  const currentDemoStep = demoSteps[currentStep]

  return (
    <div className="w-full flex flex-col min-h-[520px] bg-slate-50/50 dark:bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800 shadow-inner">
      {/* Enhanced background with subtle patterns */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,theme(colors.primary/15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,theme(colors.accent.purple/10),transparent_50%)]" />
      </div>
      
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block">
        <div className="absolute top-10 left-10 w-2 h-2 bg-primary/30 rounded-full animate-float" />
        <div className="absolute top-20 right-20 w-3 h-3 bg-accent-amber/30 rounded-full animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-accent-emerald/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-accent-purple/30 rounded-full animate-float-delayed" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative flex-1 p-6 md:p-8 flex flex-col justify-between">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-base md:text-lg leading-tight">MailOS processing</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Simulation</p>
            </div>
          </div>
          
          {/* Enhanced Progress */}
          <div className="flex flex-col items-end gap-1.5 md:gap-2">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
              Step {currentStep + 1} of {demoSteps.length}
            </div>
            <div className="flex gap-1">
              {demoSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-500 ${
                    index <= currentStep ? 'bg-primary shadow-sm shadow-primary/40 scale-110' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center w-full my-4">
          <div className="text-center space-y-6 md:space-y-8 w-full max-w-sm">
            {/* Enhanced Icon */}
            <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-3xl md:rounded-[2rem] ${currentDemoStep.bgColor} flex items-center justify-center mx-auto transition-all duration-700 shadow-xl border border-white/50 dark:border-white/5 ${
              isPlaying ? 'animate-scale-in-bounce' : ''
            }`}>
              <currentDemoStep.icon className={`w-10 h-10 md:w-12 md:h-12 ${currentDemoStep.color}`} />
            </div>

            {/* Enhanced Text */}
            <div className="space-y-2 md:space-y-3 px-2 md:px-4">
              <h4 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{currentDemoStep.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">{currentDemoStep.description}</p>
            </div>

            {/* Enhanced Action / Status Area */}
            <div className="min-h-[130px] flex flex-col items-center justify-start w-full relative">
              {isPlaying && currentStep !== 1 && (
                <div className="absolute top-0 flex items-center justify-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10 animate-in fade-in duration-300">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-sm font-semibold">{currentDemoStep.action}</span>
                </div>
              )}

              {/* Enhanced Processing indicator for step 2 */}
              {currentStep === 1 && isPlaying && (
                <div className="absolute top-0 space-y-4 w-full animate-in fade-in duration-300">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${(processedCount / emailCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-bold flex justify-between px-1">
                    <span>Analyzing...</span>
                    <span className="font-mono">{processedCount} / {emailCount}</span>
                  </div>
                </div>
              )}

              {/* Enhanced Success indicator for final step */}
              {currentStep === demoSteps.length - 1 && !isPlaying && (
                <div className="absolute top-0 space-y-6 w-full animate-in zoom-in duration-500">
                  <div className="flex items-center justify-center gap-2 text-accent-emerald bg-accent-emerald/10 px-4 py-2 rounded-full border border-accent-emerald/20 w-fit mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">Demo Complete!</span>
                  </div>
                  
                  {/* Enhanced Results */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:scale-105">
                      <div className="text-2xl font-black text-important mb-1">6</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Important</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:scale-105">
                      <div className="text-2xl font-black text-grouped mb-1">42</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Grouped</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:scale-105">
                      <div className="text-2xl font-black text-slate-400 mb-1">139</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Filtered</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800/60">
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Interactive simulation
          </div>
          
          <div className="flex items-center gap-3">
            {!isPlaying ? (
              <Button
                onClick={resetDemo}
                variant="outline"
                className="bg-white dark:bg-transparent border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Reset
              </Button>
            ) : null}
            <Button
              onClick={startDemo}
              disabled={isPlaying && currentStep !== demoSteps.length - 1}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 font-semibold px-6"
            >
              {currentStep === demoSteps.length - 1 ? (
                <>Retry Demo <ArrowRight className="w-4 h-4 ml-2" /></>
              ) : isPlaying ? (
                <>Running... </>
              ) : (
                <>Start Demo <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
