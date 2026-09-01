'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { ConversionFunnelTracker } from '@/components/ConversionFunnelTracker'
import { trackConversion, trackScrollDepth, ConversionEvents } from '@/lib/analytics'
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2,
  RotateCcw,
  Star,
  Layers,
  FileText,
  Mail,
  Brain,
  BarChart3,
  Zap,
  GitFork,
  ListTodo,
  Check,
  LayoutDashboard,
  Github,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signIn } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'

const GITHUB_URL = 'https://github.com/miteshrvasoya/MailOS'

export default function LandingPage() {
  const { isAuthenticated: isLoggedIn, isLoading: isAuthLoading } = useAuth()

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

  useEffect(() => {
    let hasTracked25 = false
    let hasTracked50 = false
    let hasTracked75 = false
    let hasTracked100 = false

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPosition = window.scrollY
      const scrollPercentage = (scrollPosition / scrollHeight) * 100

      if (scrollPercentage >= 25 && !hasTracked25) { trackScrollDepth('25%'); hasTracked25 = true }
      if (scrollPercentage >= 50 && !hasTracked50) { trackScrollDepth('50%'); hasTracked50 = true }
      if (scrollPercentage >= 75 && !hasTracked75) { trackScrollDepth('75%'); hasTracked75 = true }
      if (scrollPercentage >= 90 && !hasTracked100) { trackScrollDepth('100%'); hasTracked100 = true }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="min-h-screen bg-background scroll-smooth">
      <ConversionFunnelTracker>
        <Header />

        {/* ==================== HERO ==================== */}
        <HeroSection isLoggedIn={isLoggedIn} onCTA={() => handleCTAClick('hero')} onSignIn={handleGoogleSignIn} />

        {/* ==================== HOW IT WORKS — Animated Pipeline ==================== */}
        <PipelineSection />

        {/* ==================== FEATURES GRID ==================== */}
        <FeaturesSection />

        {/* ==================== BEFORE / AFTER ==================== */}
        <BeforeAfterSection />

        {/* ==================== TRUST / SECURITY ==================== */}
        <TrustSection />

        {/* ==================== FINAL CTA ==================== */}
        <FinalCTASection isLoggedIn={isLoggedIn} onSignIn={handleGoogleSignIn} />

        <Footer />
      </ConversionFunnelTracker>
    </main>
  )
}

/* ─── HERO SECTION ─── */

const TYPEWRITER_STATES = [
  { label: '187 unread', sub: 'sitting in your inbox right now' },
  { label: '6 decisions', sub: 'is all you actually need to make' },
  { label: '3 minutes', sub: 'to review what matters — daily' },
]

function HeroSection({ isLoggedIn, onCTA, onSignIn }: { isLoggedIn: boolean; onCTA: () => void; onSignIn: () => void }) {
  const router = useRouter()
  const [stateIdx, setStateIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setStateIdx(i => (i + 1) % TYPEWRITER_STATES.length)
        setVisible(true)
      }, 350)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const current = TYPEWRITER_STATES[stateIdx]

  return (
    <section className="relative flex items-center justify-center px-4 sm:px-6 w-full min-h-[100dvh] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 hero-gradient-dark pointer-events-none" />
      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-40" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-primary/10 blur-[80px] animate-glow-orb pointer-events-none" />
      <div className="absolute bottom-1/4 right-[8%] w-80 h-80 rounded-full bg-accent-purple/8 blur-[100px] animate-glow-orb pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="relative w-full max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-12 xl:gap-20 items-center py-24 lg:py-0 -mt-4">

        {/* LEFT — copy */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto lg:mx-0">

          {/* OSS + trust badges */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full oss-badge text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity"
            >
              <Github className="w-3.5 h-3.5" />
              Open Source
            </a>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              Read-only · No emails sent or deleted
            </div>
          </div>

          {/* Headline with typewriter */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-bold tracking-tight leading-[1.05] font-[family-name:var(--font-display)]">
              <span
                className="inline-block transition-all duration-300"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(-12px)',
                }}
              >
                <span className="gradient-text">{current.label}</span>
              </span>
              <br />
              <span className="text-foreground">— not a number.</span>
            </h1>

            {/* Rotating sub-label */}
            <p
              className="text-lg sm:text-xl text-muted-foreground transition-all duration-300 font-medium"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              {current.sub}
            </p>
          </div>

          {/* Value statement — ultra minimal */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            MailOS sits on top of Gmail and turns your{' '}
            <span className="text-foreground font-semibold">inbox chaos</span> into{' '}
            <span className="text-foreground font-semibold">one clean daily summary</span>.{' '}
            No new email client. No migration.
          </p>

          {/* Micro-stats */}
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { v: '10h', l: 'saved/week', c: 'text-important' },
              { v: '98.7%', l: 'AI accuracy', c: 'text-primary' },
              { v: '2 min', l: 'daily review', c: 'text-accent-amber' },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tracking-tight ${s.c}`}>{s.v}</span>
                <span className="text-sm text-muted-foreground">{s.l}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {isLoggedIn ? (
              <Button
                size="lg"
                variant="glow"
                onClick={() => router.push('/dashboard')}
                className="group shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all text-base px-8 h-14 rounded-xl button-interactive"
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="glow"
                onClick={onCTA}
                data-cta="hero-primary"
                className="group shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all text-base px-8 h-14 rounded-xl button-interactive"
              >
                Start Free — Connect Gmail
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            )}

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 h-14 rounded-xl border border-border/80 bg-card hover:bg-secondary text-sm font-semibold text-foreground transition-all duration-200 hover:border-border group"
            >
              <Star className="w-4 h-4 text-accent-amber group-hover:fill-accent-amber transition-all" />
              Star on GitHub
            </a>
          </div>

          <p className="text-xs text-muted-foreground">No credit card. 5-min setup. Self-hostable.</p>
        </div>

        {/* RIGHT — live terminal preview */}
        <div className="animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 xl:pl-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/15 via-transparent to-accent-purple/15 rounded-[2rem] blur-2xl opacity-60" />
            <HeroTerminalPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── HERO TERMINAL — live-classification visual ─── */

const DEMO_EMAILS = [
  { from: 'Sarah Chen', subject: 'Invoice #1042 due Friday', tag: 'Important', tagColor: 'text-important', bg: 'bg-important/10 border-important/20', delay: 0 },
  { from: 'Notion', subject: 'Your weekly digest is ready', tag: 'Grouped', tagColor: 'text-grouped', bg: 'bg-grouped/10 border-grouped/20', delay: 500 },
  { from: 'Linear', subject: '[BUG] Critical crash in v2.1', tag: 'Important', tagColor: 'text-important', bg: 'bg-important/10 border-important/20', delay: 1000 },
  { from: 'ProductHunt', subject: 'Top products of the week', tag: 'Filtered', tagColor: 'text-filtered', bg: 'bg-muted/40 border-border/40', delay: 1500 },
  { from: 'Alex Rivera', subject: 'Re: Partnership proposal', tag: 'Important', tagColor: 'text-important', bg: 'bg-important/10 border-important/20', delay: 2000 },
  { from: 'Stripe', subject: 'Your payout is on its way', tag: 'Important', tagColor: 'text-important', bg: 'bg-important/10 border-important/20', delay: 2500 },
]

function HeroTerminalPreview() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    // Start scanning
    setScanning(true)

    // Reveal emails one by one — stagger 600ms each
    DEMO_EMAILS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleCount(i + 1)
      }, 400 + i * 600))
    })

    // Pause at full, then reset
    const totalRevealTime = 400 + DEMO_EMAILS.length * 600 + 1800
    timers.push(setTimeout(() => {
      setVisibleCount(0)
      setScanning(false)
      setTimeout(() => setCycle(c => c + 1), 500)
    }, totalRevealTime))

    return () => timers.forEach(clearTimeout)
  }, [cycle])

  const importantCount = DEMO_EMAILS.slice(0, visibleCount).filter(e => e.tag === 'Important').length
  const groupedCount = DEMO_EMAILS.slice(0, visibleCount).filter(e => e.tag === 'Grouped').length
  const filteredCount = DEMO_EMAILS.slice(0, visibleCount).filter(e => e.tag === 'Filtered').length

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Terminal titlebar */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/70" />
          <div className="w-3 h-3 rounded-full bg-accent-amber/70" />
          <div className="w-3 h-3 rounded-full bg-accent-emerald/70" />
        </div>
        <div className="flex items-center gap-2">
          {scanning && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-accent-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              AI Processing...
            </span>
          )}
          <span className="text-[11px] text-muted-foreground font-mono">MailOS · Live</span>
        </div>
      </div>

      <div className="p-4 space-y-3 relative scan-overlay min-h-[340px]">
        {/* Email rows */}
        {DEMO_EMAILS.map((email, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all duration-500 ${
              i < visibleCount
                ? `opacity-100 translate-y-0 ${email.bg}`
                : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
            style={{
              transitionDelay: i < visibleCount ? `${i * 40}ms` : '0ms',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-primary">{email.from[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{email.from}</p>
                <p className="text-[11px] text-muted-foreground truncate">{email.subject}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${email.tagColor} bg-current/10`}
              style={{ background: 'transparent', border: '1px solid currentColor', opacity: 0.9 }}>
              {email.tag}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom stats bar */}
      <div className="px-4 py-3 bg-background border-t border-border grid grid-cols-3 gap-2">
        {[
          { label: 'Important', v: importantCount, max: 4, c: 'text-important', bg: 'bg-important' },
          { label: 'Grouped', v: groupedCount, max: 1, c: 'text-grouped', bg: 'bg-grouped' },
          { label: 'Filtered', v: filteredCount, max: 1, c: 'text-muted-foreground', bg: 'bg-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-lg font-bold tabular-nums ${s.c} transition-all duration-300`}>{s.v}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
            <div className="mt-1 h-0.5 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full ${s.bg} transition-all duration-700 rounded-full`}
                style={{ width: `${(s.v / s.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── PIPELINE SECTION ─── */

function PipelineSection() {
  return (
    <section id="how-it-works" className="relative px-4 sm:px-6 py-20 md:py-28 scroll-mt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-emerald/10 text-accent-emerald text-xs font-semibold border border-accent-emerald/20 uppercase tracking-wider mb-2">
            <Zap className="w-3 h-3" />
            Real-time · Event-driven
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Email arrives. <span className="gradient-text">AI acts.</span> You decide.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No polling delays. Every email is classified within seconds of landing in Gmail.
          </p>
        </div>

        {/* Pipeline steps */}
        <div className="relative">
          {/* Animated connector line — desktop */}
          <div className="hidden lg:block absolute top-8 left-[8%] right-[8%] h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="pipeline-line absolute inset-0" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative stagger-children">
            {[
              { n: 1, title: 'Email Arrives', icon: Mail, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20' },
              { n: 2, title: 'Push Notif.', icon: Zap, color: 'text-accent-amber', bg: 'bg-accent-amber/10', ring: 'ring-accent-amber/20' },
              { n: 3, title: 'Webhook Fires', icon: LayoutDashboard, color: 'text-accent-purple', bg: 'bg-accent-purple/10', ring: 'ring-accent-purple/20' },
              { n: 4, title: 'AI Classifies', icon: Brain, color: 'text-important', bg: 'bg-important/10', ring: 'ring-important/20' },
              { n: 5, title: 'Actions Run', icon: ListTodo, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', ring: 'ring-accent-emerald/20' },
              { n: 6, title: 'You Review', icon: BarChart3, color: 'text-grouped', bg: 'bg-grouped/10', ring: 'ring-grouped/20' },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-3 group animate-reveal-up">
                <div className={`w-16 h-16 rounded-2xl ${s.bg} ring-1 ${s.ring} flex flex-col items-center justify-center gap-0.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative`}>
                  <span className="text-[10px] font-bold text-muted-foreground absolute top-1.5 right-2">{s.n}</span>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <p className="text-xs font-semibold text-foreground">{s.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech callout */}
        <div className="mt-14 flex items-center justify-center gap-3 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Gmail Watch API
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <Zap className="w-3.5 h-3.5 text-accent-amber" />
            Google Cloud Pub/Sub
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <Brain className="w-3.5 h-3.5 text-important" />
            Production AI · Gemini Flash
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 hover:text-foreground transition-colors"
          >
            <GitFork className="w-3.5 h-3.5" />
            View Source
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── FEATURES SECTION ─── */

const FEATURES = [
  { title: 'AI Classification', desc: 'Intent, urgency, category — classified within seconds.', icon: Brain, color: 'text-primary', bg: 'bg-primary/10', accent: 'group-hover:border-primary/40', glow: 'group-hover:shadow-primary/10' },
  { title: 'Smart Grouping', desc: 'Newsletters and promos clustered, out of your way.', icon: Layers, color: 'text-grouped', bg: 'bg-grouped/10', accent: 'group-hover:border-grouped/40', glow: 'group-hover:shadow-grouped/10' },
  { title: 'Surface Important', desc: 'Time-sensitive emails never buried again.', icon: Star, color: 'text-important', bg: 'bg-important/10', accent: 'group-hover:border-important/40', glow: 'group-hover:shadow-important/10' },
  { title: 'Task Extraction', desc: 'Action items and deadlines pulled from email body.', icon: ListTodo, color: 'text-tasks', bg: 'bg-tasks/10', accent: 'group-hover:border-tasks/40', glow: 'group-hover:shadow-tasks/10' },
  { title: 'Daily Digest', desc: 'One scannable summary. Read it in 2 minutes.', icon: FileText, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', accent: 'group-hover:border-accent-emerald/40', glow: 'group-hover:shadow-accent-emerald/10' },
  { title: 'Real-time Push', desc: 'No polling. Processed the moment it arrives.', icon: Zap, color: 'text-accent-amber', bg: 'bg-accent-amber/10', accent: 'group-hover:border-accent-amber/40', glow: 'group-hover:shadow-accent-amber/10' },
]

function FeaturesSection() {
  return (
    <section id="features" className="px-4 sm:px-6 py-20 md:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            What MailOS <span className="gradient-text">actually does</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Six focused capabilities. Zero fluff.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group rounded-2xl border border-border bg-card p-6 space-y-4 animate-reveal-up transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${f.accent} ${f.glow} relative overflow-hidden`}
            >
              {/* Colored accent line on top */}
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${f.color.replace('text-', 'via-')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-foreground mb-1 transition-colors duration-200 group-hover:${f.color.replace('text-', 'text-')}`}>{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/features" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors group">
            See all features
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── BEFORE / AFTER SECTION ─── */

function useCountUp(target: number, durationMs = 800) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

function BeforeAfterSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const imp = useCountUp(started ? 6 : 0, 900)
  const grp = useCountUp(started ? 42 : 0, 1100)
  const flt = useCountUp(started ? 139 : 0, 1300)

  return (
    <section ref={ref} id="before-after" className="px-4 sm:px-6 py-20 md:py-28 bg-card/40 border-y border-border scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-destructive/80">187 emails.</span>{' '}
            <span className="text-muted-foreground font-normal">One</span>{' '}
            <span className="gradient-text">clean digest.</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Every morning, MailOS collapses your inbox into what actually requires your attention.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* BEFORE */}
          <div className="rounded-2xl border border-destructive/20 bg-background p-7 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/50 to-transparent" />
            <p className="text-xs font-bold text-destructive uppercase tracking-widest">Before MailOS</p>
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-foreground tabular-nums">187</span>
                <span className="text-muted-foreground">unread emails</span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  '45 min of inbox scrolling daily',
                  '3 important emails missed',
                  'Constant context switching',
                  'Manual filters that constantly break',
                ].map(t => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-destructive/30 flex items-center justify-center flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AFTER */}
          <div className="rounded-2xl border-2 border-primary/25 bg-background p-7 space-y-5 relative overflow-hidden animate-pulse-glow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent-emerald" />
            <p className="text-xs font-bold text-primary uppercase tracking-widest">After MailOS</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-important tabular-nums">{imp}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Important</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-grouped tabular-nums">{grp}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Grouped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground tabular-nums">{flt}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Filtered</div>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  '2-minute daily digest review',
                  'Zero important emails missed',
                  'One clean prioritized view',
                  'Fully automatic — no rules needed',
                ].map(t => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-important/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-important" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── TRUST SECTION ─── */

const TRUST_ITEMS = [
  { text: 'Read-only access', icon: EyeOff, desc: 'Only reads metadata — never email body storage' },
  { text: 'Cannot send emails', icon: Mail, desc: 'Zero outbound access, ever' },
  { text: 'Cannot delete emails', icon: Trash2, desc: 'Your Gmail stays untouched' },
  { text: 'AES-256 encrypted', icon: Lock, desc: 'Data encrypted at rest and in transit' },
  { text: 'Revoke in one click', icon: RotateCcw, desc: 'Disconnect from Google settings anytime' },
]

function TrustSection() {
  return (
    <section className="px-4 sm:px-6 py-20 md:py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-12 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-important/10 text-important text-xs font-semibold border border-important/20 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security First
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Built for trust.{' '}
              <span className="gradient-text">Read-only</span> by default.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              MailOS never modifies your inbox. It's a read-only intelligence layer on top of Gmail — your data stays yours.
            </p>
            <a
              href="/security"
              className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity"
            >
              Read security details
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TRUST_ITEMS.map((t) => (
              <div
                key={t.text}
                className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/20 hover:shadow-sm transition-all group feature-card-minimal"
              >
                <span className="mt-0.5 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <t.icon className="w-4 h-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ─── */

function FinalCTASection({ isLoggedIn, onSignIn }: { isLoggedIn: boolean; onSignIn: () => void }) {
  const router = useRouter()

  return (
    <section id="cta" className="px-4 sm:px-6 py-24 md:py-32 border-t border-border relative overflow-hidden scroll-mt-20">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient-dark opacity-60 pointer-events-none" />
      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full oss-badge text-xs font-semibold uppercase tracking-wider mb-2">
            <Github className="w-3.5 h-3.5" />
            Open Source · Free to self-host
          </div>

          {isLoggedIn ? (
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Welcome back to <span className="gradient-text">inbox clarity</span>
            </h2>
          ) : (
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Reclaim <span className="gradient-text">10 hours</span> this week.
            </h2>
          )}

          <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {isLoggedIn
              ? 'Your intelligent dashboard is ready.'
              : '500+ professionals already have. Join them — free to start, open to inspect.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isLoggedIn ? (
            <Button
              size="lg"
              variant="glow"
              onClick={() => router.push('/dashboard')}
              className="group shadow-lg hover:shadow-xl transition-all text-base px-8 h-14 rounded-xl button-interactive"
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                variant="glow"
                onClick={onSignIn}
                data-cta="footer-primary"
                className="group shadow-xl hover:shadow-primary/25 hover:shadow-2xl transition-all text-base px-8 h-14 rounded-xl button-interactive"
              >
                Start Free — Connect Gmail
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 h-14 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold text-foreground transition-all hover:border-border/80 group"
              >
                <Star className="w-4 h-4 text-accent-amber group-hover:fill-accent-amber transition-all" />
                Star on GitHub
              </a>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-important" />
            <span>Read-only · Never sends emails</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5" />
            <span>MIT Licensed · Self-hostable</span>
          </div>
        </div>
      </div>
    </section>
  )
}
