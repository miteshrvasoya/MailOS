'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, LayoutDashboard } from 'lucide-react'
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
    // Smooth scroll for anchor links
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
      
      {/* Hero Section */}
      <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance leading-[1.05] tracking-tight">
              Drowning in 200 emails a day?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-xl leading-relaxed">
              MailOS <span className="text-foreground font-medium">detects</span> what matters,
              <span className="text-foreground font-medium"> groups</span> similar emails,
              <span className="text-foreground font-medium"> filters</span> low-priority noise,
              and <span className="text-foreground font-medium">summarizes</span> everything into one clean daily digest.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {isLoggedIn ? (
                <Button size="lg" variant="glow" onClick={() => router.push('/dashboard')} className="group shadow-lg hover:shadow-xl transition-all">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  {primaryCtaLabel}
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button size="lg" variant="glow" onClick={handleGoogleSignIn} className="group shadow-lg hover:shadow-xl transition-all">
                  Get Inbox Clarity
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              )}

              <Button size="lg" variant="outline" asChild className="hover:bg-secondary transition-colors">
                <a href="#how-it-works" className="smooth-scroll">See how it works</a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Read-only by default. We never send or delete emails.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
            <HeroDashboardPreview />
          </div>
        </div>
      </section>

      {/* Trust (moved higher) */}
      <section className="px-6 py-16 md:py-20 bg-card border-y border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for trust. Read-only by default.</h2>
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
              MailOS works on top of Gmail. You stay in Gmail — we add clarity.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Read-only by default',
              'Cannot send emails',
              'Cannot delete emails',
              'Data encrypted',
              'Revoke access anytime',
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-xl border border-border bg-background px-5 py-4 hover:shadow-md transition-all group">
                <span className="mt-0.5 text-primary flex-shrink-0">
                  <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </span>
                <span className="text-sm text-foreground/90 font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Before / After */}
      <section id="before-after" className="px-6 py-20 md:py-24 max-w-7xl mx-auto scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stop missing important emails in the noise.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              The workflow is simple: detect what matters, group the rest, and scan one summary.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-border bg-card p-8 space-y-5 shadow-sm hover:shadow-lg transition-all">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Before MailOS</p>
              <ul className="space-y-4 text-base">
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">187</span>
                  <span className="text-muted-foreground">unread emails</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-muted-foreground">Missed</span>
                  <span className="text-3xl font-bold text-foreground">3</span>
                  <span className="text-muted-foreground">important messages</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">45 min</span>
                  <span className="text-muted-foreground">scrolling</span>
                </li>
                <li className="text-muted-foreground">Manual filters</li>
              </ul>
            </div>

            <div className="rounded-xl border-2 border-primary/20 bg-background p-8 space-y-5 shadow-lg hover:shadow-xl transition-all">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">After MailOS</p>
              <ul className="space-y-4 text-base">
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">6</span>
                  <span className="text-muted-foreground">important surfaced</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">42</span>
                  <span className="text-muted-foreground">grouped automatically</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">139</span>
                  <span className="text-muted-foreground">filtered as low priority</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">3 min</span>
                  <span className="text-muted-foreground">daily summary</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What it actually does */}
      <section id="features" className="px-6 py-20 md:py-24 bg-card border-y border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">What it actually does</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              No new inbox. No new workflow. Just clarity on top of Gmail.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Detects important emails automatically',
                desc: 'Surfaces time-sensitive messages so they don’t get buried.',
              },
              {
                title: 'Groups similar emails together',
                desc: 'Clusters newsletters, promotions, alerts, and updates into bundles.',
              },
              {
                title: 'Shows one structured daily summary',
                desc: 'A scannable digest with sections, counts, and top highlights.',
              },
              {
                title: 'Optional auto-labeling in Gmail',
                desc: 'If you enable it, MailOS applies labels for approved categories.',
              },
            ].map((f, i) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-6 shadow-sm hover:shadow-lg transition-all group space-y-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 md:py-24 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Four steps to inbox clarity.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Short, simple, and designed for high-volume inboxes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: 1, title: 'Connect Gmail (read-only access)' },
            { n: 2, title: 'MailOS analyzes emails' },
            { n: 3, title: 'Important emails are surfaced' },
            { n: 4, title: 'You receive a clean daily summary' },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-7 shadow-sm hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-lg bg-secondary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center font-bold text-lg mb-4 transition-colors">
                {s.n}
              </div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{s.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiation */}
      <section className="px-6 py-20 md:py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">MailOS is not another email client.</h2>
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
              It works <span className="text-foreground font-medium">on top of Gmail</span>. You keep using Gmail —
              MailOS adds clarity so you stop missing what matters.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-8 shadow-lg space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              No migration. No new inbox to learn.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { verb: 'Detect', desc: 'Important emails' },
                { verb: 'Group', desc: 'Newsletters & promos' },
                { verb: 'Filter', desc: 'Low priority noise' },
                { verb: 'Summarize', desc: 'One daily digest' },
              ].map((item) => (
                <div key={item.verb} className="rounded-lg border border-border bg-card px-5 py-4 hover:shadow-md transition-all group">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.verb}</p>
                  <p className="text-muted-foreground text-xs mt-1.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-20 md:py-24 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Built in public.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Early beta users are already using MailOS to stay on top of high-volume inboxes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Founder inbox → one daily scan.',
              body: 'See what matters without scrolling threads all morning.',
            },
            {
              title: 'Newsletter-heavy → grouped, not overwhelming.',
              body: 'Keep the value, lose the noise.',
            },
            {
              title: 'Job search → important replies surfaced.',
              body: 'Don’t miss recruiters, interviews, or time-sensitive steps.',
            },
          ].map((q) => (
            <div key={q.title} className="rounded-xl border border-border bg-card p-7 shadow-sm hover:shadow-lg transition-all space-y-3">
              <p className="font-semibold text-foreground">{q.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{q.body}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Chrome Extension Section - Hidden for now */}

      {/* CTA */}
      <section id="waitlist" className="px-6 py-24 md:py-28 bg-card border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-5">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{isLoggedIn ? 'Welcome back!' : 'Ready for inbox clarity?'}</h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              {isLoggedIn
                ? 'Your dashboard is ready.'
                : 'Stop missing important emails. Get one clean daily summary.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" variant="glow" asChild className="group shadow-lg hover:shadow-xl transition-all">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  {primaryCtaLabel}
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="glow" onClick={handleGoogleSignIn} className="group shadow-lg hover:shadow-xl transition-all">
                Get Inbox Clarity
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Read-only by default. We never send or delete emails.
          </p>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // Ease-out cubic
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
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">Dashboard</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-xs text-muted-foreground">MailOS</div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'Important', v: '6' },
              { k: 'Needs reply', v: '3' },
              { k: 'High urgency', v: '2' },
              { k: 'Grouped', v: '42' },
            ].map((c) => (
              <div key={c.k} className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground">{c.k}</p>
                <p className="text-2xl font-bold leading-tight">{c.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Important emails</p>
              <p className="text-xs text-muted-foreground">Top</p>
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

      {/* Overlay stats */}
      <div className="absolute -top-5 -left-4 sm:-left-6 rounded-xl border border-border bg-background shadow-lg px-5 py-4 w-[260px] backdrop-blur-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Inbox Today
        </p>
        <div className="space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Received</span>
            <span className="font-bold text-foreground text-lg">{values[0]}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Important</span>
            <span className="font-bold text-primary text-lg">{values[1]}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Grouped</span>
            <span className="font-bold text-foreground text-lg">{values[2]}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Filtered</span>
            <span className="font-bold text-foreground text-lg">{values[3]}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary transition">
      <span className="text-muted-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{meta}</span>
    </div>
  )
}

function RowStrong({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-secondary">
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{meta}</span>
    </div>
  )
}
