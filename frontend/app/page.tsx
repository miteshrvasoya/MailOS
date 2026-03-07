'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signIn } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

export default function LandingPage() {
  const { isAuthenticated: isLoggedIn, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
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

  return (
    <main className="min-h-screen bg-background scroll-smooth">
      <Header />

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto scroll-mt-20 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />

        <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Zap className="w-4 h-4" />
              AI-powered inbox intelligence
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance leading-[1.05] tracking-tight font-[family-name:var(--font-display)]">
              Drowning in{' '}
              <span className="gradient-text">200 emails</span>{' '}
              a day?
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-xl leading-relaxed">
              MailOS automatically{' '}
              <span className="text-foreground font-medium">detects</span> important emails,{' '}
              <span className="text-foreground font-medium">groups</span> the rest, and shows one{' '}
              <span className="text-foreground font-medium">clean daily summary</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {isLoggedIn ? (
                <Button
                  size="lg"
                  variant="glow"
                  onClick={() => router.push('/dashboard')}
                  className="group shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 rounded-xl"
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  {primaryCtaLabel}
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="glow"
                  onClick={handleGoogleSignIn}
                  className="group shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 rounded-xl"
                >
                  Get Inbox Clarity
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              )}

              <Button size="lg" variant="outline" asChild className="hover:bg-secondary transition-colors rounded-xl px-8 py-6">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-important" />
              Read-only by default. We never send or delete emails.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
            <HeroDashboardPreview />
          </div>
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
              No new inbox. No new workflow. Just clarity on top of Gmail.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: 'Detect Important Emails',
                desc: 'Surfaces time-sensitive messages so they don\'t get buried.',
                icon: Star,
                color: 'text-important',
                bg: 'bg-important/10',
              },
              {
                title: 'Group Similar Emails',
                desc: 'Clusters newsletters, promotions, alerts, and updates.',
                icon: Layers,
                color: 'text-grouped',
                bg: 'bg-grouped/10',
              },
              {
                title: 'Filter Noise',
                desc: 'Pushes low-priority emails out of your main view.',
                icon: Filter,
                color: 'text-filtered',
                bg: 'bg-filtered/10',
              },
              {
                title: 'Extract Tasks',
                desc: 'Detects action items and deadlines from email content.',
                icon: ListTodo,
                color: 'text-tasks',
                bg: 'bg-tasks/10',
              },
              {
                title: 'Daily Inbox Digest',
                desc: 'A scannable summary with sections, counts, and highlights.',
                icon: FileText,
                color: 'text-primary',
                bg: 'bg-primary/10',
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
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="px-6 py-20 md:py-28 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Four steps to inbox clarity.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Short, simple, and designed for high-volume inboxes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-[3.5rem] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          {[
            { n: 1, title: 'Connect Gmail', desc: 'Read-only access, one click', icon: Mail },
            { n: 2, title: 'MailOS analyzes emails', desc: 'AI classifies every message', icon: Brain },
            { n: 3, title: 'Important emails surfaced', desc: 'See what actually matters', icon: Star },
            { n: 4, title: 'View your daily digest', desc: 'One clean summary each day', icon: BarChart3 },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-lg transition-all group card-hover relative">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-5 group-hover:scale-110 transition-transform shadow-lg relative z-10">
                {s.n}
              </div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                {s.title}
              </p>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
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
          </div>
        </div>
      </section>

      {/* ===================== SOCIAL PROOF ===================== */}
      <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Built in public.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Early beta users are already using MailOS to stay on top of high-volume inboxes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Founder inbox → one daily scan.',
              body: 'See what matters without scrolling threads all morning.',
              icon: '💼',
            },
            {
              title: 'Newsletter-heavy → grouped, not overwhelming.',
              body: 'Keep the value, lose the noise.',
              icon: '📰',
            },
            {
              title: 'Job search → important replies surfaced.',
              body: "Don't miss recruiters, interviews, or time-sensitive steps.",
              icon: '🎯',
            },
          ].map((q) => (
            <div
              key={q.title}
              className="rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-lg transition-all space-y-4 card-hover relative overflow-hidden"
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
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-tasks/5 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-5">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              {isLoggedIn ? 'Welcome back!' : (
                <>Ready for <span className="gradient-text">inbox clarity</span>?</>
              )}
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              {isLoggedIn
                ? 'Your dashboard is ready.'
                : 'Stop missing important emails. Get one clean daily summary.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" variant="glow" asChild className="group shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 rounded-xl">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  {primaryCtaLabel}
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="glow" onClick={handleGoogleSignIn} className="group shadow-lg hover:shadow-xl transition-all text-base px-8 py-6 rounded-xl">
                Join MailOS Beta
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-important" />
            Read-only by default. We never send or delete emails.
          </p>
        </div>
      </section>

      <Footer />
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
