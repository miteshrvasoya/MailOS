'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  FileText, RefreshCw, Loader2, Mail, Star,
  MessageSquare, AlertTriangle, Clock, ChevronDown,
  Sparkles, BarChart3, ArrowRight
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Highlight {
  id: string
  subject: string
  sender: string
  importance: number
  urgency: string
  needs_reply: boolean
  snippet: string
}

interface Section {
  category: string
  count: number
  important_count: number
  highlights: Highlight[]
}

interface DigestData {
  id: string
  digest_type: string
  period_start: string
  period_end: string
  summary: string | null
  stats: {
    total_emails: number
    important: number
    needs_reply: number
    high_urgency: number
  }
  sections: Section[]
  generated_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: 'bg-blue-100 text-blue-700 border-blue-200',
  Finance: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Security: 'bg-red-100 text-red-700 border-red-200',
  Newsletters: 'bg-purple-100 text-purple-700 border-purple-200',
  Personal: 'bg-pink-100 text-pink-700 border-pink-200',
  Promotions: 'bg-amber-100 text-amber-700 border-amber-200',
  Orders: 'bg-orange-100 text-orange-700 border-orange-200',
  Travel: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Job Applications': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Uncategorized: 'bg-gray-100 text-gray-700 border-gray-200',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Work: '💼', Finance: '💰', Security: '🔒', Newsletters: '📰',
  Personal: '👤', Promotions: '🏷️', Orders: '📦', Travel: '✈️',
  'Job Applications': '💼', Uncategorized: '📧',
}

export default function DigestsPage() {
  const [latest, setLatest] = useState<DigestData | null>(null)
  const [history, setHistory] = useState<DigestData[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [digestType, setDigestType] = useState<'daily' | 'weekly'>('daily')
  const [showHistory, setShowHistory] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const { data: session } = useSession()
  const { toast } = useToast()
  const userId = (session?.user as any)?.id

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [latestRes, historyRes] = await Promise.all([
        api.get(`/digests/latest?user_id=${userId}&digest_type=${digestType}`),
        api.get(`/digests/history?user_id=${userId}&limit=10`),
      ])
      setLatest(latestRes.data)
      setHistory(historyRes.data || [])
    } catch (e) {
      console.error('Failed to fetch digests:', e)
    } finally {
      setLoading(false)
    }
  }, [userId, digestType])

  useEffect(() => {
    if (userId) fetchData()
  }, [userId, fetchData])

  const handleGenerate = async () => {
    if (!userId) return
    setGenerating(true)
    try {
      const res = await api.post('/digests/generate', { user_id: userId, digest_type: digestType })
      setLatest(res.data)
      toast({ title: 'Digest generated!', description: `Your ${digestType} digest is ready.` })
      fetchData()
    } catch (e) {
      console.error('Generate failed:', e)
      toast({ title: 'Generation failed', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const toggleSection = (category: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Email Digests
          </h2>
          <p className="text-muted-foreground mt-2">
            AI-powered summaries of your inbox activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Type Toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                digestType === 'daily'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-secondary text-muted-foreground'
              }`}
              onClick={() => setDigestType('daily')}
            >
              Daily
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                digestType === 'weekly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-secondary text-muted-foreground'
              }`}
              onClick={() => setDigestType('weekly')}
            >
              Weekly
            </button>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Now
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : !latest ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No digest yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Generate your first {digestType} digest to see an AI-powered summary of your inbox activity.
            </p>
            <Button onClick={handleGenerate} disabled={generating} size="lg" className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate {digestType.charAt(0).toUpperCase() + digestType.slice(1)} Digest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Emails"
              value={latest.stats.total_emails}
              icon={<Mail className="w-5 h-5" />}
              color="text-blue-500"
            />
            <StatCard
              label="Important"
              value={latest.stats.important}
              icon={<Star className="w-5 h-5" />}
              color="text-amber-500"
            />
            <StatCard
              label="Needs Reply"
              value={latest.stats.needs_reply}
              icon={<MessageSquare className="w-5 h-5" />}
              color="text-green-500"
            />
            <StatCard
              label="High Urgency"
              value={latest.stats.high_urgency}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="text-red-500"
            />
          </div>

          {/* Digest Info */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Generated {formatDistanceToNow(new Date(latest.generated_at))} ago •{' '}
              Covering {format(new Date(latest.period_start), 'MMM d')} – {format(new Date(latest.period_end), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Category Sections */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              By Category ({latest.sections.length})
            </h3>

            <div className="grid gap-3">
              {latest.sections.map(section => {
                const isExpanded = expandedSections.has(section.category)
                const colorClass = CATEGORY_COLORS[section.category] || CATEGORY_COLORS.Uncategorized
                const emoji = CATEGORY_EMOJIS[section.category] || '📧'

                return (
                  <Card
                    key={section.category}
                    className="transition-all hover:shadow-md cursor-pointer"
                    onClick={() => toggleSection(section.category)}
                  >
                    <CardContent className="pt-5 pb-4 px-5">
                      {/* Section Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{emoji}</span>
                          <div>
                            <h4 className="font-semibold">{section.category}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm text-muted-foreground">
                                {section.count} email{section.count !== 1 ? 's' : ''}
                              </span>
                              {section.important_count > 0 && (
                                <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                                  {section.important_count} important
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </div>

                      {/* Highlights */}
                      {isExpanded && section.highlights.length > 0 && (
                        <div className="mt-4 space-y-2 border-t pt-3">
                          {section.highlights.map(h => (
                            <div
                              key={h.id}
                              className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm line-clamp-1">{h.subject}</span>
                                  {h.needs_reply && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] px-1 flex-shrink-0">
                                      Reply
                                    </Badge>
                                  )}
                                  {h.urgency === 'high' && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] px-1 flex-shrink-0">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{h.sender}</p>
                                {h.snippet && (
                                  <p className="text-xs text-muted-foreground/60 line-clamp-1 mt-0.5">{h.snippet}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: `hsl(${Math.round(h.importance * 120)}, 70%, 50%)` }}
                                  title={`Importance: ${Math.round(h.importance * 100)}%`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* History */}
          {history.length > 1 && (
            <div className="space-y-3">
              <button
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                onClick={() => setShowHistory(!showHistory)}
              >
                <Clock className="w-4 h-4" />
                Past Digests ({history.length - 1})
                <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>

              {showHistory && (
                <div className="grid gap-2">
                  {history.slice(1).map(d => (
                    <Card key={d.id} className="hover:shadow-sm transition-all">
                      <CardContent className="py-3 px-5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{d.digest_type}</Badge>
                            <span className="text-sm font-medium">
                              {format(new Date(d.period_start), 'MMM d')} – {format(new Date(d.period_end), 'MMM d')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {d.stats.total_emails} emails • {d.stats.important} important
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(d.generated_at))} ago
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}


function StatCard({
  label, value, icon, color,
}: {
  label: string; value: number; icon: React.ReactNode; color: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`${color} opacity-30`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
