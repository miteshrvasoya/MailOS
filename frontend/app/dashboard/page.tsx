'use client'

import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Mail, TrendingUp, Zap, AlertCircle, ArrowRight, CheckCircle, Star, Layers, Filter, ListTodo, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/page-loader'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRef, useState, useEffect } from 'react'
import api, { EmailInsight } from '@/lib/api'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'
import { useToast } from '@/components/ui/use-toast'

export default function DashboardPage() {
  const { user, userId } = useAuth()
  const router = useRouter()
  const [emails, setEmails] = useState<EmailInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const [digestPreviewSections, setDigestPreviewSections] = useState<{ category: string; count: number }[]>([])

  const [stats, setStats] = useState([
    { label: 'Emails processed', value: '0', trend: '+12%', icon: Mail, color: 'text-foreground', borderColor: 'border-l-primary', bgColor: 'bg-primary/10' },
    { label: 'Important detected', value: '0', trend: '+4%', icon: Star, color: 'text-important', borderColor: 'border-l-important', bgColor: 'bg-important/10' },
    { label: 'Groups created', value: '0', trend: '+2', icon: Layers, color: 'text-grouped', borderColor: 'border-l-grouped', bgColor: 'bg-grouped/10' },
    { label: 'AI confidence', value: '0%', trend: '+0.5%', icon: Zap, color: 'text-tasks', borderColor: 'border-l-tasks', bgColor: 'bg-tasks/10' },
  ])

  const { toast } = useToast()

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
      checkSyncStatus()
    }
  }, [userId])

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startPolling = () => {
    stopPolling()

    pollRef.current = setInterval(async () => {
      if (!userId) return

      try {
        const res = await api.get(`/gmail/sync/status/${userId}`, {
          params: { user_id: userId },
        })
        const status = res.data

        if (status.status === 'running') {
          setScanning(true)
          setSyncProgress(status.message || 'Syncing...')
        } else if (status.status === 'completed') {
          stopPolling()
          setScanning(false)
          setSyncProgress('')
          toast({ title: "Sync complete", description: status.message })
          fetchDashboardData()
        } else if (status.status === 'error') {
          stopPolling()
          setScanning(false)
          setSyncProgress('')
          toast({ title: "Sync failed", description: status.message, variant: "destructive" })
        } else {
          setScanning(false)
          stopPolling()
        }
      } catch (e) {
        // ignore polling errors to avoid breaking the dashboard UI
      }
    }, 10000)
  }

  const checkSyncStatus = async () => {
    if (!userId) {
      return
    }
    try {
      const res = await api.get(`/gmail/sync/status/${userId}`, {
        params: { user_id: userId },
      })
      if (res.data?.status === 'running') {
        setScanning(true)
        setSyncProgress(res.data.message || 'Resuming sync...')
        startPolling()
      }
    } catch (e) {
      // ignore
    }
  }

  const fetchDashboardData = async () => {
    if (!userId) {
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/dashboard/overview', { params: { user_id: userId } })
      
      const { stats: s, important_emails, digest_preview } = res.data

      setStats([
        { label: 'Emails processed', value: s.total_emails.toString(), trend: '+12%', icon: Mail, color: 'text-foreground', borderColor: 'border-l-primary', bgColor: 'bg-primary/10' },
        { label: 'Important detected', value: s.important_emails.toString(), trend: '+4%', icon: Star, color: 'text-important', borderColor: 'border-l-important', bgColor: 'bg-important/10' },
        { label: 'Active rules', value: s.active_rules.toString(), trend: '+2', icon: Layers, color: 'text-grouped', borderColor: 'border-l-grouped', bgColor: 'bg-grouped/10' },
        { label: 'AI confidence', value: `${(s.ai_confidence ?? 0).toFixed?.(1) ?? s.ai_confidence}%`, trend: '+0.5%', icon: Zap, color: 'text-tasks', borderColor: 'border-l-tasks', bgColor: 'bg-tasks/10' },
      ])

      setEmails(important_emails || [])

      if (digest_preview?.sections && Array.isArray(digest_preview.sections)) {
        setDigestPreviewSections(
          digest_preview.sections.map((s: any) => ({
            category: s.category,
            count: s.count,
          })),
        )
      } else {
        setDigestPreviewSections([])
      }
    } catch (error) {
      // ignore; dashboard will re-try on next sync/poll
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    if (!userId) return;
    setScanning(true);
    setSyncProgress('Starting...');

    toast({
      title: "Scanning initiated",
      description: "Checking your Gmail for new important emails...",
    })

    try {
      trackEvent({ action: 'scan_gmail', category: AnalyticsCategories.DASHBOARD, label: 'manual_scan' })

      await api.post(
        '/gmail/sync',
        {
          user_id: userId,
          mode: 'full'
        },
        {
          params: { user_id: userId },
        }
      );

      startPolling()

    } catch (error) {
      toast({
        title: "Scan failed",
        description: "There was an error triggering the sync.",
        variant: "destructive"
      })
      setScanning(false);
    }
  }

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header area */}
        <div className="mb-10 animate-blur-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1 text-foreground font-[family-name:var(--font-display)]">
              {getGreeting()}, <span className="gradient-text">{user?.name || 'there'}</span>
            </h1>
            <p className="text-base text-muted-foreground">Here's what matters today</p>
          </div>
          <Button
            size="lg"
            variant="glow"
            className="gap-2 shadow-lg hover:shadow-xl transition-all rounded-xl"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {scanning ? syncProgress : 'Scan Gmail'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card
                key={i}
                className={`p-5 card-hover border-border/50 hover:border-primary/20 group border-l-[3px] ${stat.borderColor} animate-scale-in animate-border-glow`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                    <Icon className={`w-5 h-5 ${stat.color} transition-transform duration-300 group-hover:rotate-6`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${stat.color} stat-value-enter tabular-nums`} style={{ animationDelay: `${i * 0.12 + 0.3}s` }}>{stat.value}</p>
                  {stat.trend && (
                    <span className="text-[10px] font-bold text-accent-emerald bg-accent-emerald/10 px-1.5 py-0.5 rounded-md flex items-center animate-fade-in" style={{ animationDelay: `${i * 0.12 + 0.5}s` }}>
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        {/* Important Emails */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-important" />
              Important Emails
            </h2>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80 hover:bg-primary/5">
              <Link
                href="/dashboard/groups"
                prefetch={false}
                className="flex items-center gap-2"
                onClick={() => trackEvent({ action: 'view_all_important', category: AnalyticsCategories.DASHBOARD })}
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {emails.length === 0 ? (
              <Card className="p-12 border-border/50 border-dashed text-center flex flex-col items-center justify-center bg-card/30">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/10 to-transparent border border-primary/20 flex items-center justify-center relative shadow-sm">
                      <Mail className="w-8 h-8 text-primary/60" />
                   </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Inbox Zero</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-4">You're all caught up! Run a new scan to see if anything new requires your attention.</p>
                <Button variant="outline" size="sm" onClick={handleScan} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Scan Now
                </Button>
              </Card>
            ) : (
              emails.map((email, idx) => (
                <div
                  key={email.id}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  className="animate-stagger-fade"
                >
                  <Card className="p-5 card-hover border-border/50 hover:border-primary/20 cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-important" />
                          <p className="font-semibold text-foreground group-hover:text-primary transition">
                            {email.subject}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          From{' '}
                          <span className="text-foreground/70">{email.sender}</span> •{' '}
                          {new Date(email.sent_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          asChild
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
                          onClick={() =>
                            trackEvent({
                              action: 'view_email_details',
                              category: AnalyticsCategories.DASHBOARD,
                              label: email.id,
                            })
                          }
                        >
                          <Link href={`/dashboard/emails/${email.id}`} prefetch={false}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Digest Preview + Stats */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="animate-blur-in" style={{ animationDelay: '0.25s' }}>
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-grouped" />
              Today's Digest Preview
            </span>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80 hover:bg-primary/5 text-sm h-8">
              <Link href="/dashboard/digests" prefetch={false} className="flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </h2>
            <div className="space-y-3">
              {digestPreviewSections.length > 0 ? (
                <>
                  {digestPreviewSections.slice(0, 5).map((section, i) => (
                    <Link href="/dashboard/digests" key={i} prefetch={false}>
                      <Card
                        className="p-4 card-hover border-border/50 hover:border-primary/20 flex items-center justify-between group cursor-pointer animate-stagger-fade"
                        style={{ animationDelay: `${i * 0.08 + 0.3}s` }}
                      >
                        <span className="font-medium text-foreground">{section.category}</span>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full transition">
                          {section.count} emails
                        </span>
                      </Card>
                    </Link>
                  ))}
                  {digestPreviewSections.length > 5 && (
                    <Link href="/dashboard/digests" prefetch={false}>
                      <div className="text-center py-2 text-sm text-muted-foreground hover:text-primary transition cursor-pointer flex items-center justify-center gap-1">
                        +{digestPreviewSections.length - 5} more categories <ArrowRight className="w-3 h-3" />
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <Card className="p-8 border-border/50 border-dashed text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-grouped/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-grouped" />
                    </div>
                    <p className="font-medium text-foreground">No digest data yet</p>
                    <p className="text-sm text-muted-foreground">Run a Gmail scan to generate your inbox digest.</p>
                    <span className="text-2xl font-bold text-muted-foreground/30 mt-1">0 categories</span>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Why digests card */}
          <div className="space-y-6 animate-blur-in" style={{ animationDelay: '0.35s' }}>
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-tasks" />
              Quick Info
            </h2>

            <Card className="p-5 border-border/50 bg-gradient-to-br from-primary/5 to-tasks/5 border-primary/10">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Why use digests?
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-important mt-0.5 flex-shrink-0" />
                  Save time by scanning a single summarized email instead of dozens of threads.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-important mt-0.5 flex-shrink-0" />
                  Reduce inbox chaos and focus quickly on truly important messages.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-important mt-0.5 flex-shrink-0" />
                  Still keep up with valuable newsletters without letting them drown your inbox.
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Real-time feed & Quick Actions */}
        <div className="grid lg:grid-cols-[1fr_350px] gap-8 animate-scale-in" style={{ animationDelay: '0.45s' }}>
          
          {/* Quick Actions (Command Palette Style) */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Quick Commands</h2>
            </div>
            
            <div className="space-y-2">
              <Link href="/dashboard/digests" prefetch={false} onClick={() => trackEvent({ action: 'quick_action_digest', category: AnalyticsCategories.DASHBOARD })}>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-grouped/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CheckCircle className="w-4 h-4 text-grouped" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Create Custom Digest</p>
                      <p className="text-xs text-muted-foreground">Set up filtered emails</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <kbd className="px-2 py-1 text-[10px] font-sans font-semibold bg-background border border-border rounded-md shadow-sm">⌘</kbd>
                    <kbd className="px-2 py-1 text-[10px] font-sans font-semibold bg-background border border-border rounded-md shadow-sm">D</kbd>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/rules" prefetch={false} onClick={() => trackEvent({ action: 'quick_action_rule', category: AnalyticsCategories.DASHBOARD })}>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-tasks/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4 text-tasks" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Add a Rule</p>
                      <p className="text-xs text-muted-foreground">Auto-organize emails</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <kbd className="px-2 py-1 text-[10px] font-sans font-semibold bg-background border border-border rounded-md shadow-sm">⌘</kbd>
                    <kbd className="px-2 py-1 text-[10px] font-sans font-semibold bg-background border border-border rounded-md shadow-sm">R</kbd>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/settings" prefetch={false} onClick={() => trackEvent({ action: 'quick_action_settings', category: AnalyticsCategories.DASHBOARD })}>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Adjust Settings</p>
                      <p className="text-xs text-muted-foreground">Customize experience</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <kbd className="px-2 py-1 text-[10px] font-sans font-semibold bg-background border border-border rounded-md shadow-sm">⌘</kbd>
                    <kbd className="px-2 py-1 text-[10px] font-sans font-semibold bg-background border border-border rounded-md shadow-sm">,</kbd>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-6 text-foreground flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-emerald"></span>
              </span>
              Activity Feed
            </h2>
            
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-border/60 ml-2">
              {[
                { time: 'Just now', event: 'Rule executed', target: 'Newsletter filter', color: 'bg-primary' },
                { time: '2m ago', event: 'Email classified', target: 'Important', color: 'bg-important' },
                { time: '1h ago', event: 'Digest created', target: 'Morning Briefing', color: 'bg-grouped' },
              ].map((activity, idx) => (
                <div key={idx} className="relative pl-8 animate-stagger-fade" style={{ animationDelay: `${idx * 0.15 + 0.5}s` }}>
                  <div className={`absolute left-2.5 -translate-x-1/2 w-2 h-2 rounded-full ${activity.color} ring-4 ring-background shadow-sm`} />
                  <p className="text-xs text-muted-foreground mb-0.5">{activity.time}</p>
                  <p className="text-sm font-medium text-foreground">{activity.event}</p>
                  <p className="text-xs text-muted-foreground">{activity.target}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
