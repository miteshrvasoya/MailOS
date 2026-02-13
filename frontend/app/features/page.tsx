'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Brain, Sparkles, Filter, Zap, Shield, Bell,
  Clock, MailOpen, RefreshCcw, CheckCircle2, Layers,
  MessageSquare, AlarmClock, BookOpen, LayoutDashboard,
  Cpu, Eye, TrendingUp, Settings2
} from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'

function FeatureSection({
  id,
  icon: Icon,
  badge,
  badgeColor = 'bg-primary/10 text-primary',
  title,
  subtitle,
  bullets,
  visual,
  reverse = false,
}: {
  id: string
  icon: React.ElementType
  badge: string
  badgeColor?: string
  title: string
  subtitle: string
  bullets: { icon: React.ElementType; text: string }[]
  visual: React.ReactNode
  reverse?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent({
            action: 'feature_section_view',
            category: AnalyticsCategories.FEATURES,
            label: id,
          })
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [id])

  return (
    <section ref={ref} id={id} className="px-6 py-20 md:py-28">
      <div className={`max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center ${reverse ? 'md:[direction:rtl]' : ''}`}>
        <div className={`space-y-6 ${reverse ? 'md:[direction:ltr]' : ''}`}>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
            <Icon className="w-3.5 h-3.5" />
            {badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${reverse ? 'md:[direction:ltr]' : ''}`}>
          {visual}
        </div>
      </div>
    </section>
  )
}

function MockCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-black/5 ${className}`}>
      {children}
    </div>
  )
}

export default function FeaturesPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user

  const handleCTA = () => {
    trackEvent({ action: 'features_cta_click', category: AnalyticsCategories.FEATURES, label: isLoggedIn ? 'dashboard' : 'signup' })
    if (!isLoggedIn) signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="px-6 pt-20 pb-12 md:pt-32 md:pb-20 text-center max-w-5xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Product Overview
        </span>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Everything your inbox needs.<br />
          <span className="text-muted-foreground">Nothing it doesn't.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          MailOS combines AI classification, smart rules, automated digests, and proactive follow-up tracking into one calm, intelligent dashboard. Here's how each piece works.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          {[
            { id: 'ai-classification', label: '🧠 AI Classification' },
            { id: 'smart-rules', label: '⚙️ Smart Rules' },
            { id: 'digest-engine', label: '📬 Digest Engine' },
            { id: 'follow-ups', label: '🔔 Follow-ups' },
            { id: 'snooze', label: '⏰ Snooze' },
            { id: 'suggestions', label: '💡 Suggestions' },
          ].map(f => (
            <a
              key={f.id}
              href={`#${f.id}`}
              onClick={() => trackEvent({ action: 'features_nav_click', category: AnalyticsCategories.FEATURES, label: f.id })}
              className="px-4 py-2 rounded-full border border-border hover:border-primary/30 hover:bg-secondary transition-all duration-200"
            >
              {f.label}
            </a>
          ))}
        </div>
      </section>

      {/* ─── Feature 1: AI Classification ─── */}
      <div className="border-t border-border/50" />
      <FeatureSection
        id="ai-classification"
        icon={Brain}
        badge="Core Intelligence"
        badgeColor="bg-violet-500/10 text-violet-400"
        title="AI that reads between the lines"
        subtitle="Every email is analyzed for category, intent, urgency, and importance — automatically. No rules to set up. It just works."
        bullets={[
          { icon: Layers, text: '8 smart categories: Work, Personal, Finance, Security, Newsletter, Promo, Travel, Job' },
          { icon: TrendingUp, text: 'Importance score (0–100) based on sender, content, and context' },
          { icon: Eye, text: 'Intent detection: meeting requests, invoices, OTP codes, interviews, and more' },
          { icon: Cpu, text: 'Batch processing — classifies 5 emails per AI call for blazing speed' },
        ]}
        visual={
          <MockCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground">AI ANALYSIS</span>
                <span className="text-xs px-2 py-0.5 rounded bg-violet-500/15 text-violet-400 font-medium">Live</span>
              </div>
              {[
                { cat: 'Work', intent: 'meeting_request', score: 87, urgency: 'high', color: 'bg-blue-500' },
                { cat: 'Finance', intent: 'invoice', score: 72, urgency: 'medium', color: 'bg-amber-500' },
                { cat: 'Newsletter', intent: 'weekly_digest', score: 23, urgency: 'low', color: 'bg-emerald-500' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className={`w-2 h-2 rounded-full ${e.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{e.cat}</span>
                      <span className="text-xs text-muted-foreground">· {e.intent.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{e.score}%</div>
                    <div className={`text-[10px] ${e.urgency === 'high' ? 'text-red-400' : e.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{e.urgency}</div>
                  </div>
                </div>
              ))}
            </div>
          </MockCard>
        }
      />

      {/* ─── Feature 2: Smart Rules ─── */}
      <div className="border-t border-border/50" />
      <FeatureSection
        id="smart-rules"
        icon={Settings2}
        badge="Automation"
        badgeColor="bg-blue-500/10 text-blue-400"
        title="Rules that write themselves"
        subtitle="Create powerful email rules in plain English. Tell the AI what you want and it builds the rule for you — or use one of our ready-made templates."
        reverse
        bullets={[
          { icon: Sparkles, text: 'AI Rule Creator — describe in plain English, e.g. "Label all LinkedIn messages as Job"' },
          { icon: Filter, text: '6 pre-built templates: OTP/Security, Archive Promos, Invoices, Newsletters, Job Alerts, Security' },
          { icon: CheckCircle2, text: 'Preview before activating — see exactly what the AI understood' },
          { icon: RefreshCcw, text: 'Toggle rules on/off instantly, adjust priority, or delete anytime' },
        ]}
        visual={
          <MockCard>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                MAGIC RULE CREATOR
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                <p className="text-sm text-muted-foreground italic">"Move all promotional emails to Promo and mark as low priority"</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
                <span className="text-[10px] text-muted-foreground">AI parsing...</span>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-Archive Promotions</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400">Ready</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">When:</span> category = Promo → <span className="font-medium">Then:</span> move to "Promo", priority = low
                </div>
              </div>
            </div>
          </MockCard>
        }
      />

      {/* ─── Feature 3: Digest Engine ─── */}
      <div className="border-t border-border/50" />
      <FeatureSection
        id="digest-engine"
        icon={BookOpen}
        badge="Daily Briefing"
        badgeColor="bg-emerald-500/10 text-emerald-400"
        title="One email. All the context."
        subtitle="Generate daily or weekly digests that summarize your entire inbox into a scannable report — categories, stats, and highlights at a glance."
        bullets={[
          { icon: Clock, text: 'Daily or weekly digest on demand — always up to date' },
          { icon: Layers, text: 'Emails grouped by category with count and key subjects' },
          { icon: TrendingUp, text: 'Stats: total emails, categories breakdown, urgency distribution' },
          { icon: Eye, text: 'Full history — compare this week vs. last week' },
        ]}
        visual={
          <MockCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">DAILY DIGEST</span>
                <span className="text-xs text-muted-foreground">Feb 13, 2026</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: '47', color: 'text-foreground' },
                  { label: 'Important', value: '12', color: 'text-red-400' },
                  { label: 'Need Reply', value: '5', color: 'text-orange-400' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-secondary/30">
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { cat: 'Work', count: 18, bar: 'w-[72%]', color: 'bg-blue-500' },
                  { cat: 'Personal', count: 9, bar: 'w-[36%]', color: 'bg-purple-500' },
                  { cat: 'Finance', count: 7, bar: 'w-[28%]', color: 'bg-amber-500' },
                  { cat: 'Newsletter', count: 13, bar: 'w-[52%]', color: 'bg-emerald-500' },
                ].map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{c.cat}</span>
                      <span className="text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.color} ${c.bar}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MockCard>
        }
      />

      {/* ─── Feature 4: Follow-ups ─── */}
      <div className="border-t border-border/50" />
      <FeatureSection
        id="follow-ups"
        icon={Bell}
        badge="Proactive Tracking"
        badgeColor="bg-orange-500/10 text-orange-400"
        title="Never drop the ball"
        subtitle="MailOS detects emails that need a response, tracks stale threads, and reminds you before deadlines pass. No manual tagging required."
        reverse
        bullets={[
          { icon: MessageSquare, text: 'AI detects "needs reply" and "waiting on response" signals automatically' },
          { icon: AlarmClock, text: 'Deadline detection — surfaces emails with upcoming due dates' },
          { icon: RefreshCcw, text: 'Stale thread detection — flags conversations with no activity' },
          { icon: CheckCircle2, text: 'Resolve or dismiss with one click when done' },
        ]}
        visual={
          <MockCard>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">FOLLOW-UP TRACKER</div>
              {[
                { subject: 'Q1 Report Draft', sender: 'manager@work.com', status: 'Needs your reply', time: '2h ago', urgent: true },
                { subject: 'Contract Review', sender: 'legal@corp.co', status: 'Waiting on them', time: '1d ago', urgent: false },
                { subject: 'Invoice #4521', sender: 'billing@vendor.io', status: 'Due in 3 days', time: '3d ago', urgent: true },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.urgent ? 'bg-orange-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.subject}</div>
                    <div className="text-[10px] text-muted-foreground">{f.sender}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[10px] font-medium ${f.urgent ? 'text-orange-400' : 'text-muted-foreground'}`}>{f.status}</div>
                    <div className="text-[10px] text-muted-foreground">{f.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </MockCard>
        }
      />

      {/* ─── Feature 5: Snooze ─── */}
      <div className="border-t border-border/50" />
      <FeatureSection
        id="snooze"
        icon={AlarmClock}
        badge="Time Management"
        badgeColor="bg-cyan-500/10 text-cyan-400"
        title="Deal with it later. Really."
        subtitle="Snooze emails until the right moment — 1 hour, tomorrow morning, next week, or a custom time. They resurface exactly when you need them."
        bullets={[
          { icon: Clock, text: 'Preset durations: 1 hour, 3 hours, tomorrow, next week' },
          { icon: AlarmClock, text: 'Custom date/time picker for precise scheduling' },
          { icon: Bell, text: 'Automatic resurface notification when snooze expires' },
          { icon: RefreshCcw, text: 'Unsnooze anytime if plans change' },
        ]}
        visual={
          <MockCard>
            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground">SNOOZED EMAILS</div>
              {[
                { subject: 'Team dinner plans', snooze: 'Tomorrow, 9:00 AM', remaining: '14h left', color: 'text-cyan-400' },
                { subject: 'Feedback form', snooze: 'Mon, Feb 17', remaining: '4d left', color: 'text-muted-foreground' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <AlarmClock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.subject}</div>
                    <div className="text-[10px] text-muted-foreground">{s.snooze}</div>
                  </div>
                  <span className={`text-[10px] font-medium ${s.color}`}>{s.remaining}</span>
                </div>
              ))}
            </div>
          </MockCard>
        }
      />

      {/* ─── Feature 6: Suggestions ─── */}
      <div className="border-t border-border/50" />
      <FeatureSection
        id="suggestions"
        icon={Sparkles}
        badge="AI Suggestions"
        badgeColor="bg-pink-500/10 text-pink-400"
        title="Let AI do the heavy lifting"
        subtitle="MailOS suggests labels, categories, and actions for each email. Approve them in one click, or reject to teach the AI your preferences."
        reverse
        bullets={[
          { icon: CheckCircle2, text: 'One-click approve to apply AI-suggested labels in Gmail' },
          { icon: RefreshCcw, text: 'Reject suggestions to refine future classifications' },
          { icon: Layers, text: 'Bulk approve/reject — handle 50 suggestions in seconds' },
          { icon: Clock, text: 'Undo window — reverse any action within 10 seconds' },
        ]}
        visual={
          <MockCard>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">PENDING SUGGESTIONS</div>
              {[
                { subject: 'AWS Bill - January', label: 'Finance', confidence: 94 },
                { subject: 'Sprint Planning Invite', label: 'Work', confidence: 88 },
                { subject: 'React Newsletter #127', label: 'Newsletter', confidence: 96 },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.subject}</div>
                    <div className="text-[10px] text-muted-foreground">Suggested: <span className="text-primary font-medium">{s.label}</span> · {s.confidence}% match</div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-7 h-7 rounded-md bg-green-500/15 text-green-400 flex items-center justify-center cursor-pointer hover:bg-green-500/25 transition">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </MockCard>
        }
      />

      {/* ─── Benefits Banner ─── */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why teams love MailOS</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built for people who get too many emails and too little time.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: '5× Faster Scanning', desc: 'Batch AI classification processes 50 emails in ~35 seconds' },
              { icon: Shield, title: 'Privacy First', desc: 'Read-only Gmail access. We never store full email content' },
              { icon: Brain, title: 'Gets Smarter', desc: 'Feedback loop improves classification accuracy over time' },
              { icon: MailOpen, title: 'Works with Gmail', desc: 'No migration needed. Your emails stay exactly where they are' },
            ].map((b, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-border/50 bg-background space-y-3">
                <div className="w-12 h-12 mx-auto rounded-lg bg-secondary flex items-center justify-center">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">{isLoggedIn ? 'Your intelligent inbox awaits' : 'Ready to take control?'}</h2>
          <p className="text-lg text-muted-foreground">
            {isLoggedIn
              ? 'Head to your dashboard and let AI handle the noise.'
              : 'Connect your Gmail in 30 seconds. No credit card. No commitments.'}
          </p>
          {isLoggedIn ? (
            <Button size="lg" variant="glow" asChild className="group" onClick={handleCTA}>
              <Link href="/dashboard">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="glow" onClick={handleCTA} className="group">
              <MailOpen className="w-5 h-5 mr-2" />
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 MailOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
