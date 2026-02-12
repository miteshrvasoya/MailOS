'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft, Mail, Clock, Tag, AlertTriangle, Brain,
  Reply, Eye, EyeOff, Loader2, User, Sparkles,
  ChevronRight, Shield, MessageSquare
} from 'lucide-react'
import api from '@/lib/api'

interface EmailInsight {
  id: string
  user_id: string
  gmail_message_id: string
  thread_id: string | null
  sender: string
  subject: string | null
  snippet: string | null
  sent_at: string
  importance_score: number
  category: string
  intent: string | null
  urgency: string
  needs_reply: boolean
  explanation: string | null
  classification_tags: string[]
  is_read: boolean
  is_preview: boolean
  created_at: string
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'high': return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'medium': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    case 'low': return 'bg-green-500/15 text-green-400 border-green-500/30'
    default: return 'bg-secondary text-muted-foreground border-border'
  }
}

function getUrgencyIcon(urgency: string) {
  switch (urgency) {
    case 'high': return <AlertTriangle className="w-4 h-4" />
    case 'medium': return <Clock className="w-4 h-4" />
    case 'low': return <Shield className="w-4 h-4" />
    default: return <Shield className="w-4 h-4" />
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'Work': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Personal': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Newsletter': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Finance': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Promotions': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'Security': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Job': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  }
  return colors[category] || 'bg-secondary text-muted-foreground border-border'
}

function ImportanceBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  const barColor = score >= 0.7 ? 'bg-red-500' : score >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Importance</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string) {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const emailId = params.id as string

  const [email, setEmail] = useState<EmailInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/emails/${emailId}`)
        setEmail(res.data)
      } catch (err: any) {
        console.error('Failed to fetch email:', err)
        if (err.response?.status === 404) {
          setError('Email not found. It may have been deleted or the link is invalid.')
        } else {
          setError('Failed to load email details. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (emailId) fetchEmail()
  }, [emailId])

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading email details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !email) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Email Not Found</h2>
          <p className="text-muted-foreground">{error || 'The email could not be loaded.'}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <span className="text-sm text-muted-foreground">
          {email.is_read ? 'Read' : 'Unread'} · {formatRelativeTime(email.sent_at)}
        </span>
      </div>

      {/* Main Email Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(email.category)}`}>
                <Tag className="w-3 h-3" />
                {email.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(email.urgency)}`}>
                {getUrgencyIcon(email.urgency)}
                {email.urgency.charAt(0).toUpperCase() + email.urgency.slice(1)} Urgency
              </span>
              {email.needs_reply && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-orange-500/15 text-orange-400 border-orange-500/30">
                  <Reply className="w-3 h-3" />
                  Needs Reply
                </span>
              )}
              {email.is_preview && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-secondary text-muted-foreground border-border">
                  <Eye className="w-3 h-3" />
                  Preview
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-secondary text-muted-foreground border-border">
                {email.is_read ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {email.is_read ? 'Read' : 'Unread'}
              </span>
            </div>

            {/* Subject */}
            <CardTitle className="text-2xl font-bold leading-snug">
              {email.subject || '(No Subject)'}
            </CardTitle>

            {/* Sender & Time */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">{email.sender}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(email.sent_at)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Snippet */}
          {email.snippet && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Email Preview</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{email.snippet}</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* AI Analysis Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Analysis</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Importance Score */}
              <Card className="border-border/30 bg-card/50">
                <CardContent className="pt-5 pb-4 px-5">
                  <ImportanceBar score={email.importance_score} />
                </CardContent>
              </Card>

              {/* Intent */}
              <Card className="border-border/30 bg-card/50">
                <CardContent className="pt-5 pb-4 px-5 space-y-1.5">
                  <span className="text-sm text-muted-foreground">Detected Intent</span>
                  <p className="font-medium text-sm">
                    {email.intent
                      ? email.intent.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      : 'No specific intent detected'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Explanation */}
            {email.explanation && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="pt-5 pb-4 px-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Explanation</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{email.explanation}</p>
                </CardContent>
              </Card>
            )}

            {/* Classification Tags */}
            {email.classification_tags && email.classification_tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground font-medium">Classification Tags</span>
                <div className="flex flex-wrap gap-2">
                  {email.classification_tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Gmail ID</span>
                <span className="font-mono text-xs truncate max-w-[200px]">{email.gmail_message_id}</span>
              </div>
              {email.thread_id && (
                <div className="flex justify-between p-3 rounded-lg bg-secondary/20">
                  <span className="text-muted-foreground">Thread ID</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">{email.thread_id}</span>
                </div>
              )}
              <div className="flex justify-between p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Analyzed At</span>
                <span>{formatDate(email.created_at)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Internal ID</span>
                <span className="font-mono text-xs truncate max-w-[200px]">{email.id}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
