'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Check, X, Sparkles, Brain, Loader2, AlertCircle,
  CheckCheck, XCircle, Undo2, Timer
} from 'lucide-react'
import api from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { trackEvent } from '@/lib/analytics'
import { useToast } from '@/components/ui/use-toast'

interface Action {
  id: string
  email_id: string
  email_subject: string
  email_sender: string
  suggested_label: string
  confidence: number
  reason: string
  created_at: string
  status: string
}

interface UndoItem {
  actionId: string
  type: 'approve' | 'reject'
  subject: string
  timeoutId: ReturnType<typeof setTimeout>
  seconds: number
}

const UNDO_WINDOW = 10 // seconds

export default function SuggestionsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [undoItems, setUndoItems] = useState<UndoItem[]>([])
  const undoIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const { toast } = useToast()

  useEffect(() => {
    fetchActions()
    return () => {
      // Cleanup undo timers
      undoIntervalsRef.current.forEach(interval => clearInterval(interval))
    }
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

  // ─── Undo Management ────────────────────────────────────────────

  const addUndoItem = useCallback((actionId: string, type: 'approve' | 'reject', subject: string) => {
    // Auto-dismiss after UNDO_WINDOW seconds
    const timeoutId = setTimeout(() => {
      setUndoItems(prev => prev.filter(u => u.actionId !== actionId))
      const interval = undoIntervalsRef.current.get(actionId)
      if (interval) {
        clearInterval(interval)
        undoIntervalsRef.current.delete(actionId)
      }
    }, UNDO_WINDOW * 1000)

    // Countdown timer
    const interval = setInterval(() => {
      setUndoItems(prev =>
        prev.map(u => u.actionId === actionId ? { ...u, seconds: Math.max(0, u.seconds - 1) } : u)
      )
    }, 1000)
    undoIntervalsRef.current.set(actionId, interval)

    setUndoItems(prev => [...prev, { actionId, type, subject, timeoutId, seconds: UNDO_WINDOW }])
  }, [])

  const handleUndo = async (actionId: string) => {
    try {
      await api.post(`/actions/${actionId}/undo`)
      // Remove from undo list
      setUndoItems(prev => {
        const item = prev.find(u => u.actionId === actionId)
        if (item) clearTimeout(item.timeoutId)
        return prev.filter(u => u.actionId !== actionId)
      })
      const interval = undoIntervalsRef.current.get(actionId)
      if (interval) {
        clearInterval(interval)
        undoIntervalsRef.current.delete(actionId)
      }
      // Refetch to get the action back
      fetchActions()
      toast({ title: 'Action undone', description: 'The suggestion is back to pending.' })
    } catch (error: any) {
      toast({
        title: 'Undo failed',
        description: error?.response?.data?.detail || 'Could not undo the action.',
        variant: 'destructive',
      })
    }
  }

  // ─── Single Actions ─────────────────────────────────────────────

  const handleApprove = async (action: Action) => {
    setProcessing(action.id)
    try {
      trackEvent({ action: 'approve_suggestion', category: 'Suggestions', label: action.id })
      await api.post(`/actions/${action.id}/approve`)
      setActions(prev => prev.filter(a => a.id !== action.id))
      setSelected(prev => { const n = new Set(prev); n.delete(action.id); return n })
      addUndoItem(action.id, 'approve', action.email_subject)
    } catch (error) {
      console.error('Failed to approve:', error)
      toast({ title: 'Approve failed', description: 'Could not approve the suggestion.', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (action: Action) => {
    setProcessing(action.id)
    try {
      trackEvent({ action: 'reject_suggestion', category: 'Suggestions', label: action.id })
      await api.post(`/actions/${action.id}/reject`)
      setActions(prev => prev.filter(a => a.id !== action.id))
      setSelected(prev => { const n = new Set(prev); n.delete(action.id); return n })
      addUndoItem(action.id, 'reject', action.email_subject)
    } catch (error) {
      console.error('Failed to reject:', error)
      toast({ title: 'Reject failed', description: 'Could not reject the suggestion.', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  // ─── Bulk Actions ───────────────────────────────────────────────

  const handleBulkApprove = async () => {
    if (selected.size === 0) return
    setBulkProcessing(true)
    const ids = Array.from(selected)
    try {
      trackEvent({ action: 'bulk_approve', category: 'Suggestions', label: `${ids.length} items` })
      await api.post('/actions/bulk-approve', { action_ids: ids })
      const approvedActions = actions.filter(a => ids.includes(a.id))
      setActions(prev => prev.filter(a => !ids.includes(a.id)))
      setSelected(new Set())
      // Add undo items for the first few
      approvedActions.slice(0, 3).forEach(a => addUndoItem(a.id, 'approve', a.email_subject))
      toast({ title: `${ids.length} approved`, description: 'Labels are being applied in Gmail.' })
    } catch (error) {
      console.error('Bulk approve failed:', error)
      toast({ title: 'Bulk approve failed', variant: 'destructive' })
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleBulkReject = async () => {
    if (selected.size === 0) return
    setBulkProcessing(true)
    const ids = Array.from(selected)
    try {
      trackEvent({ action: 'bulk_reject', category: 'Suggestions', label: `${ids.length} items` })
      await api.post('/actions/bulk-reject', { action_ids: ids })
      setActions(prev => prev.filter(a => !ids.includes(a.id)))
      setSelected(new Set())
      toast({ title: `${ids.length} rejected`, description: 'Feedback recorded for AI learning.' })
    } catch (error) {
      console.error('Bulk reject failed:', error)
      toast({ title: 'Bulk reject failed', variant: 'destructive' })
    } finally {
      setBulkProcessing(false)
    }
  }

  // ─── Selection ──────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === actions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(actions.map(a => a.id)))
    }
  }

  const allSelected = actions.length > 0 && selected.size === actions.length

  // ─── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
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

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-10 bg-card/95 backdrop-blur border border-border rounded-xl px-5 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              id="select-all-bar"
            />
            <span className="text-sm font-medium">
              {selected.size} of {actions.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={handleBulkReject}
              disabled={bulkProcessing}
            >
              {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject All
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleBulkApprove}
              disabled={bulkProcessing}
            >
              {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Approve All
            </Button>
          </div>
        </div>
      )}

      {/* Undo Toast Stack */}
      {undoItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2">
          {undoItems.map(item => (
            <div
              key={item.actionId}
              className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl flex items-center gap-3 min-w-[320px] animate-in slide-in-from-bottom-2 duration-300"
            >
              <div className={`p-1.5 rounded-full ${
                item.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {item.type === 'approve' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.type === 'approve' ? 'Approved' : 'Rejected'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.subject}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                  <Timer className="w-3 h-3" />
                  {item.seconds}s
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={() => handleUndo(item.actionId)}
                >
                  <Undo2 className="w-3 h-3" />
                  Undo
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
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
        <div className="space-y-1">
          {/* Select All Row */}
          <div className="flex items-center gap-3 px-5 py-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
              Select all {actions.length} suggestions
            </label>
          </div>

          <div className="grid gap-3">
            {actions.map((action) => (
              <Card
                key={action.id}
                className={`p-5 transition-all hover:shadow-md border-l-4 ${
                  selected.has(action.id)
                    ? 'border-l-primary bg-primary/[0.02] ring-1 ring-primary/20'
                    : 'border-l-primary/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selected.has(action.id)}
                      onCheckedChange={() => toggleSelect(action.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-start justify-between md:hidden">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(action.created_at))} ago
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg line-clamp-1">{action.email_subject}</h3>
                      <p className="text-sm text-muted-foreground">From: {action.email_sender}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          {action.suggested_label}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`gap-1 ${
                            action.confidence > 0.9 ? 'text-green-600 bg-green-50 border-green-200' :
                            action.confidence > 0.7 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                            'text-gray-600 bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Brain className="h-3 w-3" />
                          {Math.round(action.confidence * 100)}%
                        </Badge>

                        <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {action.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:border-l md:pl-6 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:block mr-2 whitespace-nowrap">
                      {formatDistanceToNow(new Date(action.created_at))} ago
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(action)}
                      disabled={!!processing || bulkProcessing}
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
                      onClick={() => handleApprove(action)}
                      disabled={!!processing || bulkProcessing}
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
        </div>
      )}
    </div>
  )
}
