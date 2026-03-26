'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from '@/components/VideoPlayer'
import { StatsCounter, mailOSStats } from '@/components/StatsCounter'
import { ROICalculator } from '@/components/ROICalculator'
import { InteractiveDemo } from '@/components/InteractiveDemo'
import { ConversionFunnelTracker } from '@/components/ConversionFunnelTracker'
import { trackConversion, trackScrollDepth, ConversionEvents } from '@/lib/analytics'
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2,
  RotateCcw,
  Star,
  Layers,
  Filter,
  ListTodo,
  FileText,
  Mail,
  Brain,
  BarChart3,
  Zap,
  Play,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signIn } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

export default function LandingPage() {
  const { isAuthenticated: isLoggedIn, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const handleGoogleSignIn = () => {
    trackConversion(ConversionEvents.SIGNUP_STARTED)
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleCTAClick = (ctaLocation: string) => {
    trackConversion(ConversionEvents.CTA_CLICKED)
    if (!isLoggedIn) {
      handleGoogleSignIn()
    } else {
      router.push('/dashboard')
    }
  }

  const primaryCtaLabel = isLoggedIn ? 'Go to Dashboard' : 'Get Inbox Clarity'

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && href.startsWith('#')) {
          e.preventDefault()
          const id = href.slice(1)
          const element = document.getElementById(id)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }
    }
    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [])

  // Scroll depth tracking
  useEffect(() => {
    let hasTracked25 = false
    let hasTracked50 = false
    let hasTracked75 = false
    let hasTracked100 = false

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPosition = window.scrollY
      const scrollPercentage = (scrollPosition / scrollHeight) * 100

      if (scrollPercentage >= 25 && !hasTracked25) {
        trackScrollDepth('25%')
        hasTracked25 = true
      }
      if (scrollPercentage >= 50 && !hasTracked50) {
        trackScrollDepth('50%')
        hasTracked50 = true
      }
      if (scrollPercentage >= 75 && !hasTracked75) {
        trackScrollDepth('75%')
        hasTracked75 = true
      }
      if (scrollPercentage >= 90 && !hasTracked100) {
        trackScrollDepth('100%')
        hasTracked100 = true
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="min-h-screen bg-background scroll-smooth">
      <ConversionFunnelTracker>
        <Header />

        {/* ===================== HERO SECTION ===================== */}
        <section className="relative flex items-center justify-center px-4 md:px-2 w-full h-[100dvh] min-h-[750px] overflow-hidden">
          {/* Enhanced mesh gradient background */}
          <div className="absolute inset-0 mesh-gradient pointer-events-none" />

          {/* Floating particles */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-primary/30 rounded-full animate-float" />
          <div className="absolute top-20 right-20 w-3 h-3 bg-accent-amber/30 rounded-full animate-float-delayed" />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-accent-emerald/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-accent-purple/30 rounded-full animate-float-delayed" style={{ animationDelay: '2s' }} />

          <div className="relative w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-12 xl:gap-20 items-center -mt-20 lg:-mt-32">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto lg:mx-0">
              {/* Enhanced Trust Badge */}
              <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-important/10 text-important text-sm font-medium border border-important/20">
                  <Zap className="w-4 h-4" />
                  AI-powered inbox intelligence
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <ShieldCheck className="w-4 h-4 text-important" />
                  <span>Trusted by 500+ professionals</span>
                </div>
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl sm:text-6xl lg:text-[4.2rem] font-bold text-balance leading-[1.08] tracking-tight font-[family-name:var(--font-display)]">
                  <span className="text-foreground">200 emails</span>{' '}
                  <span className="gradient-text">→ 5 decisions</span>
                </h1>

                <h2 className="text-xl sm:text-2xl font-medium text-muted-foreground text-balance leading-relaxed">
                  Stop scrolling. Start deciding. Reclaim your focus.
                </h2>
              </div>

              <div className="space-y-6">
                <p className="text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed">
                  MailOS AI{' '}
                  <span className="text-foreground font-semibold">detects</span> what matters,{' '}
                  <span className="text-foreground font-semibold">groups</span> the rest, and delivers{' '}
                  <span className="text-foreground font-semibold">one clean summary</span>.
                  <br className="hidden sm:block" />
                  <span className="text-primary font-medium mt-1 inline-block">Never miss important emails again.</span>
                </p>

                {/* Key benefits */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 pt-2">
                  {[
                    { stat: '10hrs', desc: 'Saved/week', color: 'text-important', bg: 'bg-important/5' },
                    { stat: '98.7%', desc: 'AI accuracy', color: 'text-accent-emerald', bg: 'bg-accent-emerald/5' },
                    { stat: '2min', desc: 'Daily review', color: 'text-accent-amber', bg: 'bg-accent-amber/5' }
                  ].map((item, i) => (
                    <div key={i} className={`text-center p-4 rounded-xl border border-border/60 ${item.bg} shadow-sm backdrop-blur-sm`}>
                      <div className={`text-2xl sm:text-3xl font-bold ${item.color} mb-1 tracking-tight`}>{item.stat}</div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    variant="glow"
                    onClick={() => router.push('/dashboard')}
                    className="group shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all text-base px-8 h-14 rounded-xl button-interactive"
                  >
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    {primaryCtaLabel}
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="glow"
                    onClick={() => handleCTAClick('hero')}
                    data-cta="hero-primary"
                    className="group shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all text-base px-8 h-14 rounded-xl button-interactive"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                )}

                <Button size="lg" variant="outline" asChild className="hover:bg-secondary border-border/80 transition-colors text-base rounded-xl px-8 h-14 group">
                  <a href="#demo">
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-foreground/80" />
                    Watch Demo
                  </a>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm font-medium text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-important" />
                  <span>Read-only by default</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 xl:pl-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 via-transparent to-accent-purple/20 rounded-[2.5rem] blur-2xl opacity-50"></div>
                <HeroDashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ===================== INTERACTIVE DEMO SECTION ===================== */}
        <section id="demo" className="relative px-4 md:px-6 py-24 md:py-32 bg-slate-50/50 dark:bg-secondary/30 border-y border-border/60 scroll-mt-20 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 dark:bg-primary/5 blur-[100px] dark:blur-[120px] rounded-[100%] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center space-y-6 mb-20 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-foreground font-[family-name:var(--font-display)]">
                See MailOS in <span className="gradient-text">action</span>
              </h2>
              <p className="text-slate-600 dark:text-muted-foreground text-lg sm:text-xl leading-relaxed">
                Watch how MailOS transforms your inbox from chaos to clarity in just 90 seconds. No new email client—just a smarter Gmail.
              </p>
              <div className="flex items-center justify-center pt-2">
                <Button variant="outline" className="rounded-full p-1.5 pr-6 h-auto group bg-white dark:bg-background shadow-sm hover:shadow-primary/20 hover:border-primary/40 transition-all" asChild>
                  <a
                    href="https://www.youtube.com/watch?v=demo-video-id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Play className="w-4 h-4 ml-0.5 text-primary group-hover:text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-foreground">Watch Full 90s Demo</span>
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 xl:gap-24 items-center">
              {/* Interactive Demo with Glowing Frame */}
              <div className="relative w-full animate-in fade-in slide-in-from-left-8 duration-1000 group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/15 dark:from-primary/20 via-transparent to-accent-emerald/15 dark:to-accent-emerald/20 rounded-[2rem] blur-xl dark:blur-2xl opacity-60 dark:opacity-40 group-hover:opacity-100 dark:group-hover:opacity-70 transition-opacity duration-700"></div>
                <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl shadow-black/5 dark:shadow-2xl bg-white dark:bg-card">
                  <InteractiveDemo />
                </div>
              </div>

              {/* Key Features List */}
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-foreground">
                    What you'll experience
                  </h3>
                  <p className="text-slate-600 dark:text-muted-foreground text-lg">
                    Interact with the demo to see how we route emails.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      title: "1. AI Classification",
                      description: "Watch our AI instantly categorize incoming emails by intent.",
                      icon: Brain,
                      color: "text-primary",
                      hoverBorder: "hover:border-primary/40"
                    },
                    {
                      title: "2. Smart Grouping",
                      description: "See newsletters and promotions grouped out of your way.",
                      icon: Layers,
                      color: "text-grouped",
                      hoverBorder: "hover:border-grouped/40"
                    },
                    {
                      title: "3. Daily Digest",
                      description: "Experience the clean summary that saves hours of doom scrolling.",
                      icon: FileText,
                      color: "text-important",
                      hoverBorder: "hover:border-important/40"
                    },
                    {
                      title: "4. Follow-up Tracking",
                      description: "Never miss important replies or deadlines again.",
                      icon: BarChart3,
                      color: "text-accent-amber",
                      hoverBorder: "hover:border-accent-amber/40"
                    }
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-start gap-5 p-5 rounded-2xl border border-border/60 bg-white dark:bg-card shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-lg transition-all duration-300 card-hover-modern ${feature.hoverBorder}`}>
                      <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-secondary flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-border/50 shadow-sm`}>
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-base font-bold text-slate-900 dark:text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 animate-in fade-in zoom-in duration-500 delay-300">
                  <Button size="lg" asChild className="group shadow-xl hover:shadow-primary/25 hover:shadow-2xl transition-all rounded-xl button-interactive px-8 h-14 w-full sm:w-auto text-base font-semibold">
                    <Link href="/pricing">
                      View Plans & Pricing
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== LIVE STATS SECTION ===================== */}
        <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Trusted by <span className="gradient-text-accent">thousands</span> of professionals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Real-time statistics from MailOS users worldwide
            </p>
          </div>

          <StatsCounter stats={mailOSStats} className="mb-16" />

          {/* ROI Calculator Section */}
          <div className="mb-16">
            <ROICalculator />
          </div>
        </section>

        {/* ===================== TRUST & SECURITY ===================== */}
        <section className="px-6 py-16 md:py-24 bg-card/50 border-y border-border scroll-mt-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                Built for trust.{' '}
                <span className="gradient-text">Read-only</span> by default.
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
                MailOS works on top of Gmail. You stay in Gmail — we add clarity.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { text: 'Read-only access', icon: EyeOff, desc: 'We only read email metadata' },
                { text: 'Cannot send emails', icon: Mail, desc: 'No outbound access ever' },
                { text: 'Cannot delete emails', icon: Trash2, desc: 'Your emails stay untouched' },
                { text: 'Encrypted data', icon: Lock, desc: 'AES-256 encryption at rest' },
                { text: 'Revoke access anytime', icon: RotateCcw, desc: 'One-click disconnect' },
              ].map((t) => (
                <div
                  key={t.text}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background px-5 py-4 hover:shadow-md hover:border-primary/20 transition-all group card-hover"
                >
                  <span className="mt-0.5 text-primary flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <t.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </span>
                  <div>
                    <span className="text-sm text-foreground font-semibold">{t.text}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== BEFORE vs AFTER ===================== */}
        <section id="before-after" className="px-6 py-20 md:py-28 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Stop missing important emails in the noise.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              The workflow is simple: detect what matters, group the rest, and scan one summary.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="rounded-2xl border border-destructive/20 bg-card p-8 space-y-5 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/60 to-destructive/20" />
              <p className="text-sm font-semibold text-destructive uppercase tracking-wide">
                Inbox Chaos
              </p>
              <ul className="space-y-4 text-base">
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">187</span>
                  <span className="text-muted-foreground">unread emails</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-muted-foreground">Missed</span>
                  <span className="text-3xl font-bold text-destructive">3</span>
                  <span className="text-muted-foreground">important messages</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">45 min</span>
                  <span className="text-muted-foreground">scrolling fatigue</span>
                </li>
                <li className="text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive/50" />
                  Manual filters that break
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border-2 border-primary/30 bg-background p-8 space-y-5 shadow-lg hover:shadow-xl transition-all relative overflow-hidden animate-pulse-glow">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-tasks" />
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                MailOS Clarity
              </p>
              <ul className="space-y-4 text-base">
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-important">6</span>
                  <span className="text-muted-foreground">important surfaced</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-grouped">42</span>
                  <span className="text-muted-foreground">grouped automatically</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-filtered">139</span>
                  <span className="text-muted-foreground">filtered as low priority</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">3 min</span>
                  <span className="text-muted-foreground">daily summary</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===================== WHAT MAILOS DOES ===================== */}
        <section id="features" className="px-6 py-20 md:py-28 bg-card/50 border-y border-border scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                What MailOS actually does
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Real-time AI processing on top of Gmail. No new inbox. No new workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Real-time Push Processing',
                  desc: 'Emails are processed within seconds of arriving via Gmail Push Notifications — no polling delays.',
                  icon: Zap,
                  color: 'text-accent-amber',
                  bg: 'bg-accent-amber/10',
                },
                {
                  title: 'AI Intent Classification',
                  desc: 'Every email is classified by category, urgency, and importance using production-grade AI.',
                  icon: Brain,
                  color: 'text-primary',
                  bg: 'bg-primary/10',
                },
                {
                  title: 'Detect Important Emails',
                  desc: 'Time-sensitive messages are surfaced instantly so they never get buried.',
                  icon: Star,
                  color: 'text-important',
                  bg: 'bg-important/10',
                },
                {
                  title: 'Smart Grouping',
                  desc: 'Newsletters, promotions, alerts, and updates are clustered automatically.',
                  icon: Layers,
                  color: 'text-grouped',
                  bg: 'bg-grouped/10',
                },
                {
                  title: 'Auto Task Extraction',
                  desc: 'Action items and deadlines are detected and tracked from email content.',
                  icon: ListTodo,
                  color: 'text-tasks',
                  bg: 'bg-tasks/10',
                },
                {
                  title: 'Daily Inbox Digest',
                  desc: 'A scannable summary with sections, smart counts, and key highlights delivered daily.',
                  icon: FileText,
                  color: 'text-accent-emerald',
                  bg: 'bg-accent-emerald/10',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm hover:shadow-lg transition-all group space-y-4 card-hover"
                >
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Button size="lg" variant="outline" asChild className="group rounded-xl border-primary/20 hover:bg-primary/5 transition-all px-8">
                <Link href="/pricing">
                  Compare Premium Features
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ===================== HOW IT WORKS — Real-time Pipeline ===================== */}
        <section id="how-it-works" className="px-6 py-20 md:py-28 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-emerald/10 text-accent-emerald text-sm font-medium border border-accent-emerald/20 mb-4">
              <Zap className="w-3.5 h-3.5" />
              Real-time, event-driven architecture
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              How MailOS <span className="gradient-text">processes your emails</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              No polling. No delays. Emails are processed the instant they arrive in your inbox via Gmail Push Notifications.
            </p>
          </div>

          {/* Pipeline flow */}
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-[4rem] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/60 to-accent-emerald/20">
              {/* Animated pulse on the line */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse opacity-60" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-5 relative">
              {[
                {
                  n: 1,
                  title: 'New Email Arrives',
                  desc: 'A new email lands in your Gmail inbox',
                  icon: Mail,
                  color: 'text-primary',
                  bg: 'bg-primary',
                  iconBg: 'bg-primary/10',
                },
                {
                  n: 2,
                  title: 'Gmail Notifies',
                  desc: 'Gmail sends instant push notification via Pub/Sub',
                  icon: Zap,
                  color: 'text-accent-amber',
                  bg: 'bg-accent-amber',
                  iconBg: 'bg-accent-amber/10',
                },
                {
                  n: 3,
                  title: 'MailOS Receives',
                  desc: 'Our webhook catches the event in real-time',
                  icon: LayoutDashboard,
                  color: 'text-accent-purple',
                  bg: 'bg-accent-purple',
                  iconBg: 'bg-accent-purple/10',
                },
                {
                  n: 4,
                  title: 'AI Classifies',
                  desc: 'Categorized by intent, urgency & importance',
                  icon: Brain,
                  color: 'text-important',
                  bg: 'bg-important',
                  iconBg: 'bg-important/10',
                },
                {
                  n: 5,
                  title: 'Smart Actions',
                  desc: 'Labels applied, tasks extracted, rules executed',
                  icon: ListTodo,
                  color: 'text-accent-emerald',
                  bg: 'bg-accent-emerald',
                  iconBg: 'bg-accent-emerald/10',
                },
                {
                  n: 6,
                  title: 'You Review',
                  desc: 'One clean digest — see what matters instantly',
                  icon: BarChart3,
                  color: 'text-grouped',
                  bg: 'bg-grouped',
                  iconBg: 'bg-grouped/10',
                },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-lg transition-all group card-hover relative flex flex-col">
                  <div className={`w-12 h-12 rounded-2xl ${s.bg} text-white flex items-center justify-center font-bold text-sm mb-4 group-hover:scale-110 transition-transform shadow-lg relative z-10`}>
                    {s.n}
                  </div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5 text-sm">
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech detail callout */}
          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-foreground">Gmail Push via Google Pub/Sub</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  MailOS uses the official Gmail Watch API and Google Cloud Pub/Sub for secure, real-time notifications.
                  No polling — emails are processed within seconds of arriving, with idempotent deduplication and automatic retry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== DIFFERENTIATION ===================== */}
        <section className="px-6 py-20 md:py-28 bg-card/50 border-y border-border">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                MailOS is{' '}
                <span className="gradient-text">not another email client.</span>
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
                It works{' '}
                <span className="text-foreground font-medium">on top of Gmail</span>. You keep using Gmail —
                MailOS adds clarity so you stop missing what matters.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8 shadow-lg space-y-4">
              <p className="text-sm text-muted-foreground font-medium">
                No migration. No new inbox to learn.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { verb: 'Detect', desc: 'Important emails', color: 'text-important', bg: 'bg-important/10' },
                  { verb: 'Group', desc: 'Newsletters & promos', color: 'text-grouped', bg: 'bg-grouped/10' },
                  { verb: 'Filter', desc: 'Low priority noise', color: 'text-filtered', bg: 'bg-filtered/10' },
                  { verb: 'Summarize', desc: 'One daily digest', color: 'text-primary', bg: 'bg-primary/10' },
                ].map((item) => (
                  <div key={item.verb} className="rounded-xl border border-border bg-card px-5 py-4 hover:shadow-md transition-all group card-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${item.bg} ${item.color}`} style={{ background: 'currentColor' }} />
                      <p className={`font-semibold ${item.color}`}>{item.verb}</p>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border mt-6">
                <Button className="w-full group rounded-xl shadow-md" asChild>
                  <Link href="/pricing">
                    Get Started Today
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== SOCIAL PROOF ===================== */}
        <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Trusted by <span className="gradient-text-success">innovative teams</span> worldwide
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From startups to Fortune 500s, professionals rely on MailOS for inbox clarity
            </p>
          </div>

          {/* Customer logos */}
          <div className="mb-16">
            <div className="text-center text-sm text-muted-foreground mb-8 font-medium">
              JOINING 500+ COMPANIES SAVING TIME WITH MAILAI
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-60 hover:opacity-100 transition-opacity">
              {[
                'TechCorp', 'StartupXYZ', 'GlobalInc', 'InnovationLab', 'FutureSystems', 'DataDriven'
              ].map((company, i) => (
                <div key={i} className="flex items-center justify-center p-4 rounded-lg bg-card border border-border">
                  <div className="w-24 h-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">{company}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Use case cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Founder inbox → one daily scan.',
                body: 'See what matters without scrolling threads all morning.',
                icon: '💼',
                bgColor: 'bg-primary/5',
                borderColor: 'border-primary/20'
              },
              {
                title: 'Newsletter-heavy → grouped, not overwhelming.',
                body: 'Keep the value, lose the noise.',
                icon: '📰',
                bgColor: 'bg-accent-emerald/5',
                borderColor: 'border-accent-emerald/20'
              },
              {
                title: 'Job search → important replies surfaced.',
                body: "Don't miss recruiters, interviews, or time-sensitive steps.",
                icon: '🎯',
                bgColor: 'bg-accent-amber/5',
                borderColor: 'border-accent-amber/20'
              }
            ].map((q) => (
              <div
                key={q.title}
                className={`rounded-2xl border ${q.borderColor} bg-card p-7 shadow-sm hover:shadow-lg transition-all space-y-4 card-hover-modern relative overflow-hidden ${q.bgColor}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent" />
                <span className="text-3xl">{q.icon}</span>
                <p className="font-semibold text-foreground">{q.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{q.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== FINAL CTA ===================== */}
        <section id="waitlist" className="px-6 py-24 md:py-32 border-t border-border relative overflow-hidden">
          {/* Enhanced gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent-emerald/5 pointer-events-none" />

          {/* Floating elements */}
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float" />
          <div className="absolute bottom-10 right-1/4 w-2 h-2 bg-accent-amber/20 rounded-full animate-float-delayed" />

          <div className="relative max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-5">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                {isLoggedIn ? (
                  <>Welcome back to <span className="gradient-text">inbox clarity</span></>
                ) : (
                  <>Ready to reclaim <span className="gradient-text-accent">10 hours</span> per week?</>
                )}
              </h2>
              <p className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                {isLoggedIn
                  ? 'Your intelligent dashboard is ready. Start processing emails smarter.'
                  : 'Join 500+ professionals who transformed their inbox from chaos to clarity.'}
              </p>
            </div>

            {/* Value proposition cards */}
            {!isLoggedIn && (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { title: 'Free Trial', desc: '14 days, no credit card', icon: '🎯' },
                  { title: '5 min Setup', desc: 'Connect Gmail instantly', icon: '⚡' },
                  { title: 'Cancel Anytime', desc: 'No commitments', icon: '🔓' }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border card-hover-modern">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="font-semibold text-foreground mb-1">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isLoggedIn ? (
                <Button size="lg" variant="glow" asChild className="group shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 rounded-xl button-interactive">
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="glow" onClick={handleGoogleSignIn} className="group shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 rounded-xl button-interactive">
                    Start Your Free Trial
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                  <Button size="lg" variant="outline" asChild className="hover:bg-secondary transition-colors rounded-xl px-8 py-6 group">
                    <a href="#demo">
                      <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Watch Demo
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-important" />
                <span>Read-only by default</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </ConversionFunnelTracker>
    </main>
  )
}

/* ─── Helper Hooks & Components ─── */

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(from + (target - from) * eased)
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

function HeroDashboardPreview() {
  const stats = useMemo(
    () => [
      { label: 'emails received', value: 187 },
      { label: 'important', value: 6 },
      { label: 'grouped', value: 42 },
      { label: 'filtered', value: 139 },
    ],
    [],
  )

  const v0 = useCountUp(stats[0].value)
  const v1 = useCountUp(stats[1].value)
  const v2 = useCountUp(stats[2].value)
  const v3 = useCountUp(stats[3].value)
  const values = [v0, v1, v2, v3]

  return (
    <div className="relative">
      {/* Main dashboard card */}
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">Dashboard</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-important animate-pulse" />
            <span className="text-xs text-muted-foreground">MailOS</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'Important', v: '6', color: 'text-important', border: 'border-l-important' },
              { k: 'Needs reply', v: '3', color: 'text-warning', border: 'border-l-warning' },
              { k: 'High urgency', v: '2', color: 'text-destructive', border: 'border-l-destructive' },
              { k: 'Grouped', v: '42', color: 'text-grouped', border: 'border-l-grouped' },
            ].map((c) => (
              <div key={c.k} className={`rounded-lg border border-border border-l-[3px] ${c.border} bg-background px-4 py-3`}>
                <p className="text-xs text-muted-foreground">{c.k}</p>
                <p className={`text-2xl font-bold leading-tight ${c.color}`}>{c.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Important emails</p>
              <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                Top
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <RowStrong title="Interview schedule confirmed" meta="2h" />
              <Row title="Weekly newsletter" meta="4h" />
              <RowStrong title="Invoice due tomorrow" meta="6h" />
              <Row title="Product update" meta="8h" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating stats overlay */}
      <div className="absolute -top-5 -left-4 sm:-left-6 rounded-2xl border border-border bg-background shadow-2xl px-5 py-4 w-[260px] animate-float">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
          Inbox Today
        </p>
        <div className="space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Received</span>
            <span className="font-bold text-foreground text-lg">{values[0]}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Important</span>
            <span className="font-bold text-important text-lg">{values[1]}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Grouped</span>
            <span className="font-bold text-grouped text-lg">{values[2]}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Filtered</span>
            <span className="font-bold text-filtered text-lg">{values[3]}</span>
          </p>
        </div>
      </div>

      {/* Floating task card */}
      <div className="absolute -bottom-4 -right-3 sm:-right-5 rounded-2xl border border-border bg-background shadow-2xl px-5 py-4 w-[220px] animate-float" style={{ animationDelay: '1.5s' }}>
        <p className="text-xs font-semibold text-tasks uppercase tracking-wide mb-2">
          Tasks Detected
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-tasks" />
            <span className="text-foreground">Submit invoice by Friday</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-foreground">Reply to recruiter</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-important" />
            <span className="text-foreground">Approve payment</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/50 transition">
      <span className="text-muted-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{meta}</span>
    </div>
  )
}

function RowStrong({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-primary/5 border border-primary/10">
      <span className="font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{meta}</span>
    </div>
  )
}
