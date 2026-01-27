'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, X, Sparkles, Brain, Loader2, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { trackEvent } from '@/lib/analytics'

interface Action {
  id: string
  email_id: string
  email_subject: string
  email_sender: string
  suggested_label: string
  confidence: number
  reason: string
  created_at: string
}

export default function SuggestionsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [])

  const fetchActions = async () => {
    try {
      const res = await api.get('/actions/pending-list')
      setActions(res.data)
    } catch (error) {
      console.error('Failed to fetch actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      trackEvent({ action: 'approve_suggestion', category: 'Suggestions', label: id })
      await api.post(`/actions/${id}/approve`)
      setActions(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      trackEvent({ action: 'reject_suggestion', category: 'Suggestions', label: id })
      await api.post(`/actions/${id}/reject`)
      setActions(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to reject:', error)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Suggestions
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve AI organization proposals.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          <Sparkles className="h-4 w-4" />
          <span>{actions.length} pending</span>
        </div>
      </div>

      {actions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">All caught up!</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            AI has no pending suggestions for you. Why not check your <a href="/dashboard/settings" className="text-primary hover:underline">settings</a>?
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {actions.map((action) => (
            <Card key={action.id} className="p-5 transition-all hover:shadow-md border-l-4 border-l-primary/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-start justify-between md:hidden">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(action.created_at))} ago
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg line-clamp-1">{action.email_subject}</h3>
                  <p className="text-sm text-muted-foreground">From: {action.email_sender}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      <span>Suggestion:</span>
                      <span className="font-bold">{action.suggested_label}</span>
                    </div>
                    
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      action.confidence > 0.9 ? 'text-green-600 bg-green-100' : 
                      action.confidence > 0.7 ? 'text-yellow-600 bg-yellow-100' : 
                      'text-gray-600 bg-gray-100'
                    }`}>
                      <Brain className="h-3 w-3" />
                      {Math.round(action.confidence * 100)}% confidence
                    </div>

                    <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {action.reason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:border-l md:pl-6">
                  <span className="text-xs text-muted-foreground hidden md:block mr-2 whitespace-nowrap">
                    {formatDistanceToNow(new Date(action.created_at))} ago
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleReject(action.id)}
                    disabled={!!processing}
                  >
                    {processing === action.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(action.id)}
                    disabled={!!processing}
                  >
                    {processing === action.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
