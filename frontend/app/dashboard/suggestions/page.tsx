'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Check, X, Sparkles, Brain, Loader2, AlertCircle,
  CheckCheck, XCircle, Undo2, Timer, ChevronDown, ChevronRight,
  Tag, Pencil, FolderOpen, Hash
} from 'lucide-react'
import api from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { trackEvent } from '@/lib/analytics'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'

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

interface LabelGroup {
  label: string
  actions: Action[]
  expanded: boolean
}

const UNDO_WINDOW = 10
const EMAILS_PER_GROUP = 5 // Show first N, collapse rest

export default function SuggestionsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [undoItems, setUndoItems] = useState<UndoItem[]>([])
  const [usedLabels, setUsedLabels] = useState<string[]>([])
  const [editingGroupLabel, setEditingGroupLabel] = useState<string | null>(null)
  const [newGroupLabel, setNewGroupLabel] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [reassigning, setReassigning] = useState(false)
  const undoIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const { userId } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchActions()
    fetchUsedLabels()
    return () => {
      undoIntervalsRef.current.forEach(interval => clearInterval(interval))
    }
  }, [userId])

  const fetchActions = async () => {
    try {
      if (!userId) return
      const res = await api.get('/actions/pending-list', { params: { user_id: userId } })
      setActions(res.data)
    } catch (error) {
      console.error('Failed to fetch actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsedLabels = async () => {
    try {
      if (!userId) return
      const res = await api.get('/actions/used-labels', { params: { user_id: userId } })
      setUsedLabels(res.data || [])
    } catch (error) {
      console.error('Failed to fetch used labels:', error)
    }
  }

  // ─── Group actions by label ──────────────────────────────────────

  const groups = useMemo<LabelGroup[]>(() => {
    const map = new Map<string, Action[]>()
    for (const action of actions) {
      const label = action.suggested_label || 'Uncategorized'
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(action)
    }
    // Sort: largest groups first
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([label, acts]) => ({
        label,
        actions: acts,
        expanded: expandedGroups.has(label),
      }))
  }, [actions, expandedGroups])

  const toggleGroupExpand = (label: string) => {
    setExpandedGroups(prev => {
      const n = new Set(prev)
      if (n.has(label)) n.delete(label)
      else n.add(label)
      return n
    })
  }

  // ─── Undo Management ──────────────────────────────────────────

  const addUndoItem = useCallback((actionId: string, type: 'approve' | 'reject', subject: string) => {
    const timeoutId = setTimeout(() => {
      setUndoItems(prev => prev.filter(u => u.actionId !== actionId))
      const interval = undoIntervalsRef.current.get(actionId)
      if (interval) { clearInterval(interval); undoIntervalsRef.current.delete(actionId) }
    }, UNDO_WINDOW * 1000)

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
      setUndoItems(prev => {
        const item = prev.find(u => u.actionId === actionId)
        if (item) clearTimeout(item.timeoutId)
        return prev.filter(u => u.actionId !== actionId)
      })
      const interval = undoIntervalsRef.current.get(actionId)
      if (interval) { clearInterval(interval); undoIntervalsRef.current.delete(actionId) }
      fetchActions()
      toast({ title: 'Action undone', description: 'The suggestion is back to pending.' })
    } catch (error: any) {
      toast({ title: 'Undo failed', description: error?.response?.data?.detail || 'Could not undo.', variant: 'destructive' })
    }
  }

  // ─── Single Actions ──────────────────────────────────────────

  const handleApprove = async (action: Action) => {
    setProcessing(action.id)
    try {
      trackEvent({ action: 'approve_suggestion', category: 'Suggestions', label: action.id })
      await api.post(`/actions/${action.id}/approve`)
      setActions(prev => prev.filter(a => a.id !== action.id))
      setSelected(prev => { const n = new Set(prev); n.delete(action.id); return n })
      addUndoItem(action.id, 'approve', action.email_subject)
    } catch (error) {
      toast({ title: 'Approve failed', variant: 'destructive' })
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
      toast({ title: 'Reject failed', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  // ─── Group Actions ──────────────────────────────────────────

  const handleApproveGroup = async (group: LabelGroup) => {
    setBulkProcessing(true)
    const ids = group.actions.map(a => a.id)
    try {
      trackEvent({ action: 'approve_group', category: 'Suggestions', label: `${group.label} (${ids.length})` })
      await api.post('/actions/bulk-approve', { action_ids: ids })
      setActions(prev => prev.filter(a => !ids.includes(a.id)))
      setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
      toast({ title: `${ids.length} emails approved`, description: `Label "${group.label}" applied in Gmail.` })
    } catch (error) {
      toast({ title: 'Group approve failed', variant: 'destructive' })
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleRejectGroup = async (group: LabelGroup) => {
    setBulkProcessing(true)
    const ids = group.actions.map(a => a.id)
    try {
      trackEvent({ action: 'reject_group', category: 'Suggestions', label: `${group.label} (${ids.length})` })
      await api.post('/actions/bulk-reject', { action_ids: ids })
      setActions(prev => prev.filter(a => !ids.includes(a.id)))
      setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
      toast({ title: `${ids.length} emails rejected`, description: 'Feedback recorded.' })
    } catch (error) {
      toast({ title: 'Group reject failed', variant: 'destructive' })
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleReassignGroupLabel = async (oldLabel: string, newLabel: string) => {
    if (!newLabel.trim() || newLabel.trim() === oldLabel) {
      setEditingGroupLabel(null)
      return
    }
    setReassigning(true)
    const groupActions = actions.filter(a => a.suggested_label === oldLabel)
    const ids = groupActions.map(a => a.id)
    try {
      await api.post('/actions/bulk-update-label', {
        action_ids: ids,
        new_label: newLabel.trim(),
      })
      setActions(prev => prev.map(a =>
        ids.includes(a.id) ? { ...a, suggested_label: newLabel.trim() } : a
      ))
      // Add new label to usedLabels if not already present
      setUsedLabels(prev => prev.includes(newLabel.trim()) ? prev : [...prev, newLabel.trim()].sort())
      toast({ title: 'Label updated', description: `${ids.length} emails moved to "${newLabel.trim()}"` })
    } catch (error) {
      toast({ title: 'Label update failed', variant: 'destructive' })
    } finally {
      setReassigning(false)
      setEditingGroupLabel(null)
    }
  }

  // ─── Bulk Actions (selected) ──────────────────────────────────

  const handleBulkApprove = async () => {
    if (selected.size === 0) return
    setBulkProcessing(true)
    const ids = Array.from(selected)
    try {
      trackEvent({ action: 'bulk_approve', category: 'Suggestions', label: `${ids.length} items` })
      await api.post('/actions/bulk-approve', { action_ids: ids })
      setActions(prev => prev.filter(a => !ids.includes(a.id)))
      setSelected(new Set())
      toast({ title: `${ids.length} approved`, description: 'Labels applied in Gmail.' })
    } catch (error) {
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
      toast({ title: `${ids.length} rejected`, description: 'Feedback recorded.' })
    } catch (error) {
      toast({ title: 'Bulk reject failed', variant: 'destructive' })
    } finally {
      setBulkProcessing(false)
    }
  }

  // ─── Selection ─────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const toggleSelectGroup = (group: LabelGroup) => {
    const ids = group.actions.map(a => a.id)
    setSelected(prev => {
      const n = new Set(prev)
      const allIn = ids.every(id => n.has(id))
      if (allIn) ids.forEach(id => n.delete(id))
      else ids.forEach(id => n.add(id))
      return n
    })
  }

  const isGroupSelected = (group: LabelGroup) =>
    group.actions.length > 0 && group.actions.every(a => selected.has(a.id))

  const isGroupPartiallySelected = (group: LabelGroup) =>
    group.actions.some(a => selected.has(a.id)) && !isGroupSelected(group)

  // All available labels (AI + user's existing)
  const allLabels = useMemo(() => {
    const aiLabels = [...new Set(actions.map(a => a.suggested_label).filter(Boolean))]
    return [...new Set([...usedLabels, ...aiLabels])].sort()
  }, [usedLabels, actions])

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
            Review AI label proposals grouped by category. Approve, reassign, or reject in bulk.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <Sparkles className="h-4 w-4" />
            <span>{actions.length} pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <FolderOpen className="h-4 w-4" />
            <span>{groups.length} groups</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-10 bg-card/95 backdrop-blur border border-border rounded-xl px-5 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selected.size} of {actions.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={handleBulkReject} disabled={bulkProcessing}
            >
              {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject Selected
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleBulkApprove} disabled={bulkProcessing}
            >
              {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Approve Selected
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
                  <Timer className="w-3 h-3" /> {item.seconds}s
                </span>
                <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => handleUndo(item.actionId)}>
                  <Undo2 className="w-3 h-3" /> Undo
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
            AI has no pending suggestions. Check your <a href="/dashboard/settings" className="text-primary hover:underline">settings</a> to configure auto-apply.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const visibleActions = group.expanded
              ? group.actions
              : group.actions.slice(0, EMAILS_PER_GROUP)
            const hasMore = group.actions.length > EMAILS_PER_GROUP
            const avgConfidence = group.actions.reduce((sum, a) => sum + a.confidence, 0) / group.actions.length

            return (
              <Card key={group.label} className="overflow-hidden">
                {/* Group Header */}
                <div className="px-5 py-4 bg-secondary/30 border-b border-border/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={isGroupSelected(group)}
                        // @ts-ignore
                        indeterminate={isGroupPartiallySelected(group)}
                        onCheckedChange={() => toggleSelectGroup(group)}
                      />

                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {editingGroupLabel === group.label ? (
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={newGroupLabel}
                              onChange={(e) => setNewGroupLabel(e.target.value)}
                              className="px-2 py-1 text-sm rounded-md bg-background border border-border focus:outline-none focus:border-primary min-w-[160px]"
                            >
                              <option value={group.label}>{group.label} (current)</option>
                              {allLabels.filter(l => l !== group.label).map(l => (
                                <option key={l} value={l}>{l}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Or type custom label..."
                              value={newGroupLabel && !allLabels.includes(newGroupLabel) ? newGroupLabel : ''}
                              onChange={(e) => setNewGroupLabel(e.target.value)}
                              className="px-2 py-1 text-sm rounded-md bg-background border border-border focus:outline-none focus:border-primary flex-1 min-w-[140px]"
                            />
                            <Button
                              size="sm" variant="default" className="h-7 text-xs"
                              disabled={reassigning}
                              onClick={() => handleReassignGroupLabel(group.label, newGroupLabel)}
                            >
                              {reassigning ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 text-xs"
                              onClick={() => setEditingGroupLabel(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Tag className="h-4 w-4 text-primary shrink-0" />
                            <h3 className="font-semibold text-base truncate">{group.label}</h3>
                            <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20">
                              <Hash className="h-3 w-3 mr-0.5" />
                              {group.actions.length}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`shrink-0 gap-1 ${
                                avgConfidence > 0.9 ? 'text-green-600 bg-green-50 border-green-200' :
                                avgConfidence > 0.7 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                                'text-gray-600 bg-gray-50 border-gray-200'
                              }`}
                            >
                              <Brain className="h-3 w-3" />
                              {Math.round(avgConfidence * 100)}% avg
                            </Badge>
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                              onClick={() => { setEditingGroupLabel(group.label); setNewGroupLabel(group.label) }}
                            >
                              <Pencil className="h-3 w-3" /> Change Label
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Group Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline" size="sm"
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                        onClick={() => handleRejectGroup(group)}
                        disabled={bulkProcessing}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject All
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                        onClick={() => handleApproveGroup(group)}
                        disabled={bulkProcessing}
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Approve All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email List */}
                <div className="divide-y divide-border/50">
                  {visibleActions.map((action) => (
                    <div
                      key={action.id}
                      className={`px-5 py-3 flex items-center gap-3 transition-colors hover:bg-secondary/20 ${
                        selected.has(action.id) ? 'bg-primary/[0.02]' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selected.has(action.id)}
                        onCheckedChange={() => toggleSelect(action.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{action.email_subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.email_sender}
                          <span className="mx-1.5 opacity-40">•</span>
                          {formatDistanceToNow(new Date(action.created_at))} ago
                          {action.reason && (
                            <>
                              <span className="mx-1.5 opacity-40">•</span>
                              <span className="italic">{action.reason}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1 text-xs ${
                          action.confidence > 0.9 ? 'text-green-600 bg-green-50 border-green-200' :
                          action.confidence > 0.7 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                          'text-gray-600 bg-gray-50 border-gray-200'
                        }`}
                      >
                        {Math.round(action.confidence * 100)}%
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(action)}
                          disabled={!!processing || bulkProcessing}
                        >
                          {processing === action.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(action)}
                          disabled={!!processing || bulkProcessing}
                        >
                          {processing === action.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expand/Collapse */}
                {hasMore && (
                  <button
                    onClick={() => toggleGroupExpand(group.label)}
                    className="w-full px-5 py-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-secondary/20 flex items-center justify-center gap-1.5 transition-colors border-t border-border/40"
                  >
                    {group.expanded ? (
                      <><ChevronDown className="h-3.5 w-3.5" /> Show less</>
                    ) : (
                      <><ChevronRight className="h-3.5 w-3.5" /> Show {group.actions.length - EMAILS_PER_GROUP} more emails</>
                    )}
                  </button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
