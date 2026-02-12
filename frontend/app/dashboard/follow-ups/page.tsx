'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  Clock, Reply, Hourglass, Check, X, RefreshCw,
  AlertTriangle, ArrowRight, Loader2, Scan, Mail
} from 'lucide-react'
import { formatDistanceToNow, isPast, format } from 'date-fns'

interface FollowUpItem {
  id: string
  email_id: string
  subject: string | null
  sender: string
  sent_at: string
  urgency: string
  importance_score: number
  snippet: string | null
  follow_up_status: string
  follow_up_deadline: string | null
  waiting_on_reply: boolean
  category: string
}

interface Summary {
  needs_reply_count: number
  waiting_on_others_count: number
  overdue_count: number
}

export default function FollowUpsPage() {
  const [needsReply, setNeedsReply] = useState<FollowUpItem[]>([])
  const [waiting, setWaiting] = useState<FollowUpItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  const { data: session } = useSession()
  const { toast } = useToast()
  const userId = (session?.user as any)?.id

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [summaryRes, replyRes, waitingRes] = await Promise.all([
        api.get(`/follow-ups/summary?user_id=${userId}`),
        api.get(`/follow-ups/needs-reply?user_id=${userId}`),
        api.get(`/follow-ups/waiting?user_id=${userId}`),
      ])
      setSummary(summaryRes.data)
      setNeedsReply(replyRes.data)
      setWaiting(waitingRes.data)
    } catch (e) {
      console.error('Failed to fetch follow-ups:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchData()
  }, [userId, fetchData])

  const handleScan = async () => {
    if (!userId) return
    setScanning(true)
    try {
      const res = await api.post(`/follow-ups/scan?user_id=${userId}`)
      const { follow_ups_flagged, stale_threads_flagged, reminders_created } = res.data
      toast({
        title: 'Scan complete',
        description: `${follow_ups_flagged} follow-ups flagged, ${stale_threads_flagged} stale threads found, ${reminders_created} reminders created.`,
      })
      fetchData()
    } catch (e) {
      console.error('Scan failed:', e)
      toast({ title: 'Scan failed', variant: 'destructive' })
    } finally {
      setScanning(false)
    }
  }

  const handleResolve = async (emailId: string) => {
    setProcessing(emailId)
    try {
      await api.post(`/follow-ups/${emailId}/resolve`)
      setNeedsReply(prev => prev.filter(i => i.id !== emailId))
      setWaiting(prev => prev.filter(i => i.id !== emailId))
      setSummary(prev => prev ? {
        ...prev,
        needs_reply_count: Math.max(0, prev.needs_reply_count - 1),
      } : prev)
      toast({ title: 'Resolved', description: 'Follow-up marked as resolved.' })
    } catch (e) {
      console.error('Failed to resolve:', e)
    } finally {
      setProcessing(null)
    }
  }

  const handleDismiss = async (emailId: string) => {
    setProcessing(emailId)
    try {
      await api.post(`/follow-ups/${emailId}/dismiss`)
      setNeedsReply(prev => prev.filter(i => i.id !== emailId))
      setWaiting(prev => prev.filter(i => i.id !== emailId))
      toast({ title: 'Dismissed', description: 'Follow-up dismissed.' })
    } catch (e) {
      console.error('Failed to dismiss:', e)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Reply className="h-8 w-8 text-primary" />
            Follow-Ups
          </h2>
          <p className="text-muted-foreground mt-2">
            Track emails that need your response and threads waiting for replies.
          </p>
        </div>
        <Button
          onClick={handleScan}
          disabled={scanning}
          variant="outline"
          className="gap-2"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
          Scan Emails
        </Button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Your Reply</p>
                  <p className="text-3xl font-bold mt-1">{summary.needs_reply_count}</p>
                </div>
                <Reply className="w-8 h-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waiting on Others</p>
                  <p className="text-3xl font-bold mt-1">{summary.waiting_on_others_count}</p>
                </div>
                <Hourglass className="w-8 h-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className={`border-l-4 ${summary.overdue_count > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-3xl font-bold mt-1">{summary.overdue_count}</p>
                </div>
                {summary.overdue_count > 0
                  ? <AlertTriangle className="w-8 h-8 text-red-500/30" />
                  : <Check className="w-8 h-8 text-green-500/30" />
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Needs Reply Section */}
      <Section
        title="Needs Your Reply"
        icon={<Reply className="w-5 h-5 text-blue-500" />}
        count={needsReply.length}
        items={needsReply}
        loading={loading}
        processing={processing}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        emptyMessage="No emails need your reply right now."
        emptyIcon={<Mail className="w-12 h-12 text-muted-foreground" />}
      />

      {/* Waiting on Others */}
      <Section
        title="Waiting on Others"
        icon={<Hourglass className="w-5 h-5 text-amber-500" />}
        count={waiting.length}
        items={waiting}
        loading={loading}
        processing={processing}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        emptyMessage="You're not waiting on any replies."
        emptyIcon={<Check className="w-12 h-12 text-muted-foreground" />}
      />
    </div>
  )
}


// ─── Section Component ───────────────────────────────────────────

interface SectionProps {
  title: string
  icon: React.ReactNode
  count: number
  items: FollowUpItem[]
  loading: boolean
  processing: string | null
  onResolve: (id: string) => void
  onDismiss: (id: string) => void
  emptyMessage: string
  emptyIcon: React.ReactNode
}

function Section({
  title, icon, count, items, loading,
  processing, onResolve, onDismiss,
  emptyMessage, emptyIcon,
}: SectionProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title} ({count})
        </h3>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            {emptyIcon}
            <p className="text-muted-foreground mt-3">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <FollowUpCard
              key={item.id}
              item={item}
              processing={processing === item.id}
              onResolve={() => onResolve(item.id)}
              onDismiss={() => onDismiss(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}


// ─── Follow-Up Card Component ────────────────────────────────────

interface FollowUpCardProps {
  item: FollowUpItem
  processing: boolean
  onResolve: () => void
  onDismiss: () => void
}

function FollowUpCard({ item, processing, onResolve, onDismiss }: FollowUpCardProps) {
  const isOverdue = item.follow_up_deadline && isPast(new Date(item.follow_up_deadline))

  return (
    <Card className={`group transition-all hover:shadow-md ${
      isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent hover:border-l-primary/30'
    }`}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-base line-clamp-1">{item.subject || 'No subject'}</h4>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 gap-0.5 flex-shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">From: {item.sender}</p>
            {item.snippet && (
              <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1">{item.snippet}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">
                {item.category}
              </Badge>

              <Badge
                variant="outline"
                className={`text-[10px] ${
                  item.urgency === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                  item.urgency === 'medium' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                  'text-gray-500'
                }`}
              >
                {item.urgency} urgency
              </Badge>

              {item.follow_up_deadline && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {isOverdue
                    ? `${formatDistanceToNow(new Date(item.follow_up_deadline))} overdue`
                    : `Due ${formatDistanceToNow(new Date(item.follow_up_deadline), { addSuffix: true })}`
                  }
                </span>
              )}

              <span className="text-[10px] text-muted-foreground">
                Received {formatDistanceToNow(new Date(item.sent_at))} ago
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={onDismiss}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              Dismiss
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={onResolve}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Resolved
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
