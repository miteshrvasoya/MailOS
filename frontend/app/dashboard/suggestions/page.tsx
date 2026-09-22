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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight text-foreground">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Brain className="h-6 w-6" />
            </div>
            AI Suggestions
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl leading-relaxed">
            Review and organize AI label proposals. Use bulk actions to quickly sort your inbox, or redefine categories on the fly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-2 rounded-xl border border-border/50">
            <Sparkles className="h-4 w-4 text-accent-indigo" />
            <span>{actions.length} pending</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-2 rounded-xl border border-border/50">
            <FolderOpen className="h-4 w-4 text-accent-amber" />
            <span>{groups.length} groups</span>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="glass-premium px-6 py-4 rounded-2xl shadow-2xl border border-border flex items-center justify-between gap-8 min-w-[400px]">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {selected.size}
              </div>
              <span className="text-sm font-semibold text-foreground">
                selected of {actions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/50 rounded-xl transition-all"
                onClick={handleBulkReject} disabled={bulkProcessing}
              >
                {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-md shadow-primary/20"
                onClick={handleBulkApprove} disabled={bulkProcessing}
              >
                {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Approve All Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast Stack */}
      {undoItems.length > 0 && (
        <div className="fixed bottom-28 right-6 z-50 space-y-3">
          {undoItems.map(item => (
            <div
              key={item.actionId}
              className="glass-premium border border-border rounded-xl px-5 py-4 shadow-xl flex items-center gap-4 min-w-[340px] animate-in slide-in-from-bottom-2 duration-300"
            >
              <div className={`p-2 rounded-full ${
                item.type === 'approve' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {item.type === 'approve' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {item.type === 'approve' ? 'Approved' : 'Rejected'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.subject}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 tabular-nums">
                  <Timer className="w-3.5 h-3.5" /> {item.seconds}s
                </span>
                <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 gap-1.5 text-xs border-border/50 hover:bg-secondary/80" onClick={() => handleUndo(item.actionId)}>
                  <Undo2 className="w-3.5 h-3.5" /> Undo
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {actions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-border/60 bg-secondary/20 relative overflow-hidden group">
          <div className="absolute inset-0 noise-overlay opacity-30" />
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight relative z-10">Inbox Zero achieved!</h2>
          <p className="text-muted-foreground max-w-sm mt-3 relative z-10 text-sm">
            AI has no pending suggestions right now. Want it done automatically? Check your <a href="/dashboard/settings" className="text-primary hover:underline font-medium">settings</a> to configure auto-apply.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const visibleActions = group.expanded
              ? group.actions
              : group.actions.slice(0, EMAILS_PER_GROUP)
            const hasMore = group.actions.length > EMAILS_PER_GROUP
            const avgConfidence = group.actions.reduce((sum, a) => sum + a.confidence, 0) / group.actions.length

            return (
              <Card key={group.label} className="overflow-hidden spotlight-card border-border/50 bg-card/40 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-primary/5">
                {/* Group Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-secondary/40 to-transparent border-b border-border/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={isGroupSelected(group)}
                      // @ts-ignore
                      indeterminate={isGroupPartiallySelected(group)}
                      onCheckedChange={() => toggleSelectGroup(group)}
                      className="w-4 h-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary border-muted-foreground/30"
                    />

                    <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                      {editingGroupLabel === group.label ? (
                        <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                          <select
                            value={newGroupLabel}
                            onChange={(e) => setNewGroupLabel(e.target.value)}
                            className="px-2 py-1 text-xs rounded bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary min-w-[120px] transition-all shadow-sm"
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
                            className="px-2 py-1 text-xs rounded bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary flex-1 min-w-[120px] transition-all shadow-sm"
                          />
                          <Button
                            size="sm" className="h-6 rounded px-2 bg-primary text-primary-foreground text-[10px] font-medium shadow-sm"
                            disabled={reassigning}
                            onClick={() => handleReassignGroupLabel(group.label, newGroupLabel)}
                          >
                            {reassigning ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-6 rounded px-2 text-[10px] text-muted-foreground hover:bg-secondary/80"
                            onClick={() => setEditingGroupLabel(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                            <h3 className="font-semibold text-sm truncate text-foreground tracking-tight">{group.label}</h3>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="shrink-0 bg-primary/5 text-primary border-primary/10 px-1.5 py-0 text-[10px] font-medium leading-4">
                              {group.actions.length} {group.actions.length === 1 ? 'email' : 'emails'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`shrink-0 px-1.5 py-0 text-[10px] font-medium leading-4 ${
                                avgConfidence > 0.9 ? 'text-accent-emerald bg-accent-emerald/5 border-accent-emerald/20' :
                                avgConfidence > 0.7 ? 'text-accent-amber bg-accent-amber/5 border-accent-amber/20' :
                                'text-muted-foreground bg-secondary border-border/50'
                              }`}
                            >
                              {Math.round(avgConfidence * 100)}% conf
                            </Badge>
                            <Button
                              size="sm" variant="ghost"
                              className="h-5 px-1.5 rounded text-[10px] gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                              onClick={() => { setEditingGroupLabel(group.label); setNewGroupLabel(group.label) }}
                            >
                              <Pencil className="h-2.5 w-2.5" /> Edit Label
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Group Bulk Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-[11px] font-medium rounded px-2 h-6"
                      onClick={() => handleRejectGroup(group)}
                      disabled={bulkProcessing}
                    >
                      <XCircle className="h-3 w-3" /> Reject All
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 text-[11px] font-medium rounded px-2 h-6 shadow-sm transition-all"
                      onClick={() => handleApproveGroup(group)}
                      disabled={bulkProcessing}
                    >
                      <CheckCheck className="h-3 w-3" /> Approve All
                    </Button>
                  </div>
                </div>

                {/* Email List - Compact Gmail Style */}
                <div className="divide-y divide-border/30">
                  {visibleActions.map((action) => (
                    <div
                      key={action.id}
                      className={`px-4 py-1.5 flex items-center gap-3 transition-all duration-200 hover:bg-secondary/40 group/item text-sm ${
                        selected.has(action.id) ? 'bg-primary/5 border-l-2 border-l-primary pl-[14px]' : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={selected.has(action.id)}
                        onCheckedChange={() => toggleSelect(action.id)}
                        className="w-4 h-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary border-muted-foreground/30 transition-all shrink-0"
                      />
                      
                      {/* Sender (approx 20%) */}
                      <div className="w-[180px] shrink-0 font-medium text-foreground truncate text-[13px]">
                        {action.email_sender}
                      </div>

                      {/* Subject and Reason (flexible) */}
                      <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                        <span className="font-semibold text-foreground text-[13px] truncate">
                          {action.email_subject}
                        </span>
                        {action.reason && (
                          <span className="text-muted-foreground text-[13px] truncate opacity-70">
                            - {action.reason}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="w-[100px] shrink-0 text-[12px] text-muted-foreground text-right hidden md:block">
                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true }).replace('about ', '')}
                      </div>

                      {/* Right side: Confidence & Actions */}
                      <div className="flex items-center gap-2 shrink-0 w-[120px] justify-end relative">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-medium px-1.5 py-0 leading-4 group-hover/item:opacity-0 transition-opacity absolute right-0 ${
                            action.confidence > 0.9 ? 'text-accent-emerald bg-accent-emerald/10' :
                            action.confidence > 0.7 ? 'text-accent-amber bg-accent-amber/10' :
                            'text-muted-foreground bg-secondary'
                          }`}
                        >
                          {Math.round(action.confidence * 100)}%
                        </Badge>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity absolute right-0 bg-background/50 backdrop-blur-sm rounded-md px-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 rounded-md text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            onClick={() => handleReject(action)}
                            disabled={!!processing || bulkProcessing}
                            title="Reject"
                          >
                            {processing === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 rounded-md text-green-500 hover:text-green-600 hover:bg-green-500/10 transition-colors"
                            onClick={() => handleApprove(action)}
                            disabled={!!processing || bulkProcessing}
                            title="Approve"
                          >
                            {processing === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expand/Collapse */}
                {hasMore && (
                  <button
                    onClick={() => toggleGroupExpand(group.label)}
                    className="w-full px-4 py-2 text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-secondary/40 flex items-center justify-center gap-1.5 transition-all border-t border-border/30 group/btn"
                  >
                    {group.expanded ? (
                      <><ChevronDown className="h-3.5 w-3.5 transition-transform group-hover/btn:-translate-y-0.5" /> Show less</>
                    ) : (
                      <><ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" /> Show {group.actions.length - EMAILS_PER_GROUP} more suggestions</>
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
