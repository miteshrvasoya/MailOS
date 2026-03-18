'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import {
  Plus, Settings2, Trash2, Zap, Shield, Mail,
  DollarSign, Briefcase, BookOpen,
  ToggleLeft, ToggleRight, ArrowRight, Sparkles,
  Loader2, Check, X, Wand2, Archive, Clock,
  Megaphone, AlertTriangle, Tag, Filter
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// ─── Unified Rule type (wraps both backend models) ──────────────

interface UnifiedRule {
  id: string
  name: string
  description?: string
  ruleKind: 'organize' | 'clean' // Which backend it comes from
  is_active: boolean

  // Organize-specific
  priority?: number
  conditions?: any
  actions?: any

  // Clean-specific
  rule_type?: string
  action?: string        // trash | delete | archive
  retention_hours?: number
  clean_conditions?: any
}

interface AnyTemplate {
  id: string
  name: string
  description: string
  kind: 'organize' | 'clean'
  // Organize
  conditions?: any
  actions?: any
  priority?: number
  // Clean
  rule_type?: string
  action?: string
  retention_hours?: number
}

interface ParsedRulePreview {
  name: string
  description: string
  conditions: any
  actions: any
  priority: number
  explanation: string
}

// ─── Helpers ────────────────────────────────────────────────────

function getTemplateIcon(template: AnyTemplate) {
  if (template.kind === 'clean') {
    switch (template.rule_type) {
      case 'otp': return <Shield className="w-5 h-5" />
      case 'newsletter': return <Mail className="w-5 h-5" />
      case 'promotion': return <Megaphone className="w-5 h-5" />
      default: return <Sparkles className="w-5 h-5" />
    }
  }
  switch (template.id) {
    case 'otp_security': return <Shield className="w-5 h-5" />
    case 'archive_promotions': return <Mail className="w-5 h-5" />
    case 'important_invoices': return <DollarSign className="w-5 h-5" />
    case 'newsletter_archive': return <BookOpen className="w-5 h-5" />
    case 'job_alerts': return <Briefcase className="w-5 h-5" />
    case 'security_alerts': return <Shield className="w-5 h-5" />
    default: return <Zap className="w-5 h-5" />
  }
}

function getTemplateColor(template: AnyTemplate) {
  if (template.kind === 'clean') {
    switch (template.rule_type) {
      case 'otp': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'newsletter': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'promotion': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
      default: return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    }
  }
  switch (template.id) {
    case 'otp_security': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'archive_promotions': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    case 'important_invoices': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'newsletter_archive': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'job_alerts': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'security_alerts': return 'bg-red-500/10 text-red-500 border-red-500/20'
    default: return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  }
}

function formatConditions(conditions: any): string {
  const criteria = conditions?.all || []
  if (criteria.length === 0) return 'No conditions'
  return criteria.map((c: any) => {
    const field = c.field?.charAt(0).toUpperCase() + c.field?.slice(1)
    const op = c.operator?.replace(/_/g, ' ')
    return `${field} ${op} "${c.value}"`
  }).join(' AND ')
}

function formatActions(actions: any): string[] {
  const result: string[] = []
  if (actions?.move_to_category) result.push(`Move to ${actions.move_to_category}`)
  if (actions?.mark_important) result.push('Mark important')
  if (actions?.mark_read) result.push('Mark as read')
  if (actions?.apply_label) result.push(`Label: ${actions.apply_label}`)
  if (actions?.stop_processing) result.push('Stop processing')
  return result
}

function getActionLabel(action: string) {
  switch (action) {
    case 'trash': return 'Trash'
    case 'delete': return 'Delete'
    case 'archive': return 'Archive'
    default: return action
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'trash': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'delete': return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'archive': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    default: return 'text-muted-foreground bg-secondary'
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case 'trash': return <Trash2 className="w-3.5 h-3.5" />
    case 'delete': return <AlertTriangle className="w-3.5 h-3.5" />
    case 'archive': return <Archive className="w-3.5 h-3.5" />
    default: return <Trash2 className="w-3.5 h-3.5" />
  }
}

function formatRetention(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function getKindLabel(kind: string) {
  switch (kind) {
    case 'organize': return 'Organize'
    case 'clean': return 'Auto-Clean'
    default: return kind
  }
}

function getKindColor(kind: string) {
  switch (kind) {
    case 'organize': return 'text-primary bg-primary/10 border-primary/20'
    case 'clean': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    default: return 'text-muted-foreground bg-secondary'
  }
}

// ─── Component ──────────────────────────────────────────────────

export default function RulesPage() {
  // All rules (unified)
  const [allRules, setAllRules] = useState<UnifiedRule[]>([])
  const [allTemplates, setAllTemplates] = useState<AnyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [enablingTemplate, setEnablingTemplate] = useState<string | null>(null)
  const [togglingRule, setTogglingRule] = useState<string | null>(null)
  const [templateFilter, setTemplateFilter] = useState<'all' | 'organize' | 'clean'>('all')

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createKind, setCreateKind] = useState<'organize' | 'clean'>('clean')
  // Clean fields
  const [cleanName, setCleanName] = useState('')
  const [cleanType, setCleanType] = useState('custom')
  const [cleanAction, setCleanAction] = useState('trash')
  const [cleanRetention, setCleanRetention] = useState(24)
  const [cleanCategory, setCleanCategory] = useState('')

  // NL Rule State (organize via AI)
  const [nlInput, setNlInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedPreview, setParsedPreview] = useState<ParsedRulePreview | null>(null)
  const [isCreatingParsed, setIsCreatingParsed] = useState(false)

  const { userId } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchAllRules()
      fetchAllTemplates()
    }
  }, [userId])

  // ─── Fetch (merge both sources into unified lists) ──────────

  const fetchAllRules = async () => {
    setLoading(true)
    try {
      const [orgRes, cleanRes] = await Promise.all([
        api.get('/rules', { params: { user_id: userId } }),
        api.get('/auto-clean-rules', { params: { user_id: userId } }),
      ])

      const orgRules: UnifiedRule[] = (orgRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        ruleKind: 'organize' as const,
        is_active: r.is_active,
        priority: r.priority,
        conditions: r.conditions,
        actions: r.actions,
      }))

      const cleanRules: UnifiedRule[] = (cleanRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        ruleKind: 'clean' as const,
        is_active: r.is_enabled,
        rule_type: r.rule_type,
        action: r.action,
        retention_hours: r.retention_hours,
        clean_conditions: r.conditions,
      }))

      setAllRules([...orgRules, ...cleanRules])
    } catch (e) {
      console.error('Failed to fetch rules', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const [orgRes, cleanRes] = await Promise.all([
        api.get('/rules/templates'),
        api.get('/auto-clean-rules/templates'),
      ])

      const orgTemplates: AnyTemplate[] = (orgRes.data || []).map((t: any) => ({
        ...t,
        kind: 'organize' as const,
      }))

      const cleanTemplates: AnyTemplate[] = (cleanRes.data || []).map((t: any) => ({
        ...t,
        kind: 'clean' as const,
      }))

      setAllTemplates([...orgTemplates, ...cleanTemplates])
    } catch (e) {
      console.error('Failed to fetch templates', e)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // ─── Unified Actions ────────────────────────────────────────────

  const handleEnableTemplate = async (template: AnyTemplate) => {
    if (!userId) return
    setEnablingTemplate(template.id)
    try {
      if (template.kind === 'organize') {
        const res = await api.post('/rules/from-template', { user_id: userId, template_id: template.id })
        setAllRules(prev => [{
          id: res.data.id, name: res.data.name, description: res.data.description,
          ruleKind: 'organize', is_active: res.data.is_active,
          priority: res.data.priority, conditions: res.data.conditions, actions: res.data.actions,
        }, ...prev])
      } else {
        const res = await api.post('/auto-clean-rules/from-template', { user_id: userId, template_id: template.id })
        setAllRules(prev => [{
          id: res.data.id, name: res.data.name, ruleKind: 'clean', is_active: res.data.is_enabled,
          rule_type: res.data.rule_type, action: res.data.action,
          retention_hours: res.data.retention_hours, clean_conditions: res.data.conditions,
        }, ...prev])
      }
      toast({ title: 'Template enabled!', description: `Rule is now active.` })
      trackEvent({ action: 'enable_template', category: AnalyticsCategories.RULES, label: template.id })
    } catch (error) {
      console.error('Failed to enable template', error)
      toast({ title: 'Error', description: 'Could not create rule.', variant: 'destructive' })
    } finally {
      setEnablingTemplate(null)
    }
  }

  const handleToggle = async (rule: UnifiedRule) => {
    setTogglingRule(rule.id)
    try {
      if (rule.ruleKind === 'organize') {
        const res = await api.patch(`/rules/${rule.id}`, { is_active: !rule.is_active })
        setAllRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: res.data.is_active } : r))
      } else {
        const res = await api.patch(`/auto-clean-rules/${rule.id}/toggle`)
        setAllRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: res.data.is_enabled } : r))
      }
      toast({ title: rule.is_active ? 'Rule paused' : 'Rule activated' })
      trackEvent({ action: rule.is_active ? 'pause_rule' : 'activate_rule', category: AnalyticsCategories.RULES })
    } catch (error) {
      console.error('Failed to toggle rule', error)
      toast({ title: 'Error', description: 'Failed to update rule.', variant: 'destructive' })
    } finally {
      setTogglingRule(null)
    }
  }

  const handleDelete = async (rule: UnifiedRule) => {
    try {
      if (rule.ruleKind === 'organize') {
        await api.delete(`/rules/${rule.id}`)
      } else {
        await api.delete(`/auto-clean-rules/${rule.id}`)
      }
      setAllRules(prev => prev.filter(r => r.id !== rule.id))
      toast({ title: 'Rule deleted', description: `"${rule.name}" removed.` })
      trackEvent({ action: 'delete_rule', category: AnalyticsCategories.RULES, label: rule.name })
    } catch (error) {
      console.error('Failed to delete rule', error)
      toast({ title: 'Error', description: 'Failed to delete rule.', variant: 'destructive' })
    }
  }

  // ─── AI Rule Parser ─────────────────────────────────────────────

  const handleParseText = async () => {
    if (!userId || !nlInput.trim()) return
    setIsParsing(true)
    try {
      const res = await api.post('/rules/parse-text', { user_id: userId, text: nlInput })
      setParsedPreview(res.data)
      trackEvent({ action: 'parse_rule_ai', category: AnalyticsCategories.AI, label: 'success' })
    } catch (e) {
      console.error('Parsing failed', e)
      toast({ title: 'AI Parsing Failed', description: 'Could not interpret your rule.', variant: 'destructive' })
    } finally { setIsParsing(false) }
  }

  const handleCreateFromParsed = async () => {
    if (!parsedPreview) return
    setIsCreatingParsed(true)
    try {
      const res = await api.post('/rules/from-parsed', { user_id: userId, ...parsedPreview })
      setAllRules(prev => [{
        id: res.data.id, name: res.data.name, description: res.data.description,
        ruleKind: 'organize', is_active: res.data.is_active,
        priority: res.data.priority, conditions: res.data.conditions, actions: res.data.actions,
      }, ...prev])
      setParsedPreview(null)
      setNlInput('')
      toast({ title: 'Rule Created', description: 'Your new rule is active.' })
      trackEvent({ action: 'create_rule_ai', category: AnalyticsCategories.RULES, label: parsedPreview.name })
    } catch (e) {
      console.error('Creation failed', e)
      toast({ title: 'Error', description: 'Failed to create rule.', variant: 'destructive' })
    } finally { setIsCreatingParsed(false) }
  }

  // ─── Create Custom Rule ─────────────────────────────────────────

  const handleCreateRule = async () => {
    if (!userId) return
    setCreating(true)
    try {
      if (createKind === 'clean') {
        if (!cleanName.trim()) return
        const conditions = cleanType === 'custom' && cleanCategory ? { category: cleanCategory } : {}
        const res = await api.post('/auto-clean-rules', {
          user_id: userId, name: cleanName, rule_type: cleanType,
          conditions, action: cleanAction, retention_hours: cleanRetention, is_enabled: true,
        })
        setAllRules(prev => [{
          id: res.data.id, name: res.data.name, ruleKind: 'clean', is_active: res.data.is_enabled,
          rule_type: res.data.rule_type, action: res.data.action,
          retention_hours: res.data.retention_hours, clean_conditions: res.data.conditions,
        }, ...prev])
      }
      // Reset form
      setShowCreateForm(false)
      setCleanName(''); setCleanType('custom'); setCleanAction('trash')
      setCleanRetention(24); setCleanCategory('')
      toast({ title: 'Rule created', description: 'Your new rule is active.' })
    } catch (error) {
      console.error('Failed to create rule', error)
      toast({ title: 'Error', description: 'Could not create rule.', variant: 'destructive' })
    } finally { setCreating(false) }
  }

  const enabledNames = new Set(allRules.map(r => r.name))
  const filteredTemplates = templateFilter === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.kind === templateFilter)

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-muted-foreground mt-2">
            Create rules to organize, categorize, and automatically clean your inbox.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Create Rule</>}
        </Button>
      </div>

      {/* AI Magic Rule Creator */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/20 to-tasks/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <Card className="relative border-primary/20 shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-tasks/5 blur-3xl pointer-events-none"></div>
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Wand2 className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Magic Rule Creator</h3>
                <CardDescription>Describe what you want in plain English — AI will build the rule.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6 pt-4">
            {!parsedPreview ? (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Textarea
                    placeholder="Try: 'Archive promotional emails from linkedin.com' or 'Move invoices to Finance and mark important'"
                    className="pl-4 pr-12 py-3 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 min-h-[80px] resize-none shadow-inner transition-all text-base placeholder:text-muted-foreground/50"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParseText() } }}
                  />
                  <div className="absolute bottom-3 right-3">
                    {isParsing ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <span className="text-xs text-muted-foreground/50">⏎ to generate</span>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" disabled={isParsing || !nlInput.trim()} onClick={handleParseText}>
                    {isParsing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Thinking...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Rule</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-secondary/30 rounded-xl border border-border/50 p-5 shadow-sm animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xl text-foreground">{parsedPreview.name}</h4>
                    <p className="text-sm text-muted-foreground">{parsedPreview.description}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Priority {parsedPreview.priority}</Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">When</Label>
                    <div className="bg-card/50 p-4 rounded-xl border border-border/50 text-sm leading-relaxed">
                      {parsedPreview.conditions?.all?.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                          <Badge variant="outline" className="bg-transparent border-border/50 font-normal text-xs uppercase tracking-wide text-muted-foreground">{c.field}</Badge>
                          <span className="text-muted-foreground text-xs">{c.operator.replace(/_/g, ' ')}</span>
                          <span className="font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">"{c.value}"</span>
                        </div>
                      )) || <span className="text-muted-foreground italic">No conditions</span>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Then</Label>
                    <div className="bg-card/50 p-4 rounded-xl border border-border/50 text-sm flex flex-col gap-2">
                      {formatActions(parsedPreview.actions).map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                          <span className="font-medium text-foreground">{a}</span>
                        </div>
                      ))}
                      {formatActions(parsedPreview.actions).length === 0 && <span className="text-muted-foreground italic">No actions defined</span>}
                    </div>
                  </div>
                </div>
                {parsedPreview.explanation && (
                  <div className="mb-6 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" /><span>{parsedPreview.explanation}</span>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                  <Button variant="ghost" onClick={() => setParsedPreview(null)} disabled={isCreatingParsed}>Cancel</Button>
                  <Button onClick={handleCreateFromParsed} disabled={isCreatingParsed} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] shadow-lg">
                    {isCreatingParsed ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : <><Check className="w-4 h-4 mr-2" /> Confirm & Create</>}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Rule Form */}
      {showCreateForm && (
        <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Create Custom Rule
            </CardTitle>
            <CardDescription>Choose a rule type and define conditions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Kind selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Rule Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/40 rounded-lg border border-border/50">
                <button
                  onClick={() => setCreateKind('organize')}
                  className={`flex flex-col items-center p-3 rounded-md transition-all text-sm ${
                    createKind === 'organize' ? 'bg-card shadow-sm border border-border ring-1 ring-primary/20 font-semibold text-primary' : 'text-muted-foreground hover:bg-card/50'
                  }`}
                >
                  <Tag className="w-4 h-4 mb-1" />
                  Organize
                  <span className="text-[10px] opacity-70">Categorize & label</span>
                </button>
                <button
                  onClick={() => setCreateKind('clean')}
                  className={`flex flex-col items-center p-3 rounded-md transition-all text-sm ${
                    createKind === 'clean' ? 'bg-card shadow-sm border border-border ring-1 ring-primary/20 font-semibold text-primary' : 'text-muted-foreground hover:bg-card/50'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mb-1" />
                  Auto-Clean
                  <span className="text-[10px] opacity-70">Trash, delete, archive</span>
                </button>
              </div>
            </div>

            {createKind === 'organize' ? (
              <div className="bg-secondary/20 p-4 rounded-lg border border-border/50 text-sm text-muted-foreground text-center space-y-3">
                <p>Use the <strong>Magic Rule Creator</strong> above to create organize rules with AI, or:</p>
                <Link href="/dashboard/rules/new">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create Manually
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Name</label>
                  <input type="text" placeholder="e.g., Archive old promotions"
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition text-sm"
                    value={cleanName} onChange={(e) => setCleanName(e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                    <select className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                      value={cleanType} onChange={(e) => setCleanType(e.target.value)}>
                      <option value="otp">OTP / Verification</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="promotion">Promotion</option>
                      <option value="low_priority">Low Priority</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Action</label>
                    <select className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                      value={cleanAction} onChange={(e) => setCleanAction(e.target.value)}>
                      <option value="trash">Move to Trash</option>
                      <option value="archive">Archive</option>
                      <option value="delete">Permanently Delete</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">After</label>
                    <select className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                      value={cleanRetention} onChange={(e) => setCleanRetention(Number(e.target.value))}>
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>1 day</option>
                      <option value={48}>2 days</option>
                      <option value={72}>3 days</option>
                      <option value={168}>1 week</option>
                    </select>
                  </div>
                </div>
                {cleanType === 'custom' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Match Category (optional)</label>
                    <input type="text" placeholder="e.g., Marketing, Spam, Social"
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition text-sm"
                      value={cleanCategory} onChange={(e) => setCleanCategory(e.target.value)}
                    />
                  </div>
                )}
                {cleanAction === 'delete' && (
                  <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Permanent deletion cannot be undone. Consider "Trash" for safety.</span>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleCreateRule} disabled={creating || !cleanName.trim()} className="gap-2">
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Create Rule</>}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Templates (unified with filter) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-md text-yellow-500 border border-yellow-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold">Quick Templates</h3>
            <Badge variant="secondary" className="text-xs font-normal">One-click enable</Badge>
          </div>
          {/* Category filter */}
          <div className="flex items-center gap-1 bg-secondary/30 p-0.5 rounded-lg border border-border/50">
            {(['all', 'organize', 'clean'] as const).map(f => (
              <button key={f} onClick={() => setTemplateFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  templateFilter === f
                    ? 'bg-card text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : getKindLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {loadingTemplates ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const isEnabled = enabledNames.has(template.name)
              return (
                <Card key={`${template.kind}-${template.id}`}
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    isEnabled ? 'opacity-70 border-green-500/30 bg-green-500/5' : 'hover:border-primary/30'
                  }`}
                >
                  <CardContent className="pt-5 pb-4 px-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg border transition-colors ${getTemplateColor(template)}`}>
                        {getTemplateIcon(template)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${getKindColor(template.kind)}`}>
                          {getKindLabel(template.kind)}
                        </Badge>
                        {template.kind === 'clean' && template.action && (
                          <Badge variant="outline" className={`text-[10px] gap-0.5 ${getActionColor(template.action)}`}>
                            {getActionIcon(template.action)}
                            <span>{getActionLabel(template.action)}</span>
                          </Badge>
                        )}
                        {isEnabled && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            <Check className="w-3 h-3" /> Active
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight text-foreground">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    </div>
                    <div className="pt-2 border-t border-dashed border-border/50 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.kind === 'organize' && formatActions(template.actions).slice(0, 2).map((a, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{a}</span>
                        ))}
                        {template.kind === 'clean' && template.retention_hours && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> After {formatRetention(template.retention_hours)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isEnabled && (
                      <Button variant="outline" size="sm"
                        className="w-full mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={enablingTemplate === template.id}
                        onClick={() => handleEnableTemplate(template)}
                      >
                        {enablingTemplate === template.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Enabling...</>
                        ) : (
                          <>Enable Rule <ArrowRight className="w-3 h-3 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm">
        <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Safety First</p>
          <p className="text-muted-foreground mt-0.5">
            Auto-clean rules never act on important or high-urgency emails. Actions only execute after the retention period, and everything is logged.
          </p>
        </div>
      </div>

      {/* All Active Rules (unified list) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-secondary rounded-md text-muted-foreground">
            <Settings2 className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold">Active Rules</h3>
          {!loading && <Badge variant="outline" className="ml-1">{allRules.length}</Badge>}
        </div>

        {loading ? (
          <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        ) : allRules.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <Settings2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No rules yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                Enable a template above, use the AI creator, or create a custom rule to start automating your inbox.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {allRules.map((rule) => (
              <Card key={`${rule.ruleKind}-${rule.id}`}
                className={`group transition-all duration-300 hover:shadow-md border-l-4 ${
                  !rule.is_active ? 'opacity-60 border-l-muted'
                    : rule.ruleKind === 'organize' ? 'border-l-primary' : 'border-l-amber-500'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-foreground">{rule.name}</h4>
                        <Badge variant="outline" className={`text-[10px] ${getKindColor(rule.ruleKind)}`}>
                          {getKindLabel(rule.ruleKind)}
                        </Badge>
                        {rule.is_active ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10 text-[10px] uppercase tracking-wider">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-border bg-secondary text-[10px] uppercase tracking-wider">Paused</Badge>
                        )}
                      </div>
                      {rule.description && <p className="text-sm text-muted-foreground">{rule.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                        disabled={togglingRule === rule.id}
                        onClick={() => handleToggle(rule)}
                      >
                        {rule.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(rule)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Rule details — different layout per kind */}
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-sm">
                    {rule.ruleKind === 'organize' ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mr-2">When</span>
                          <span className="font-medium text-foreground">{formatConditions(rule.conditions)}</span>
                        </div>
                        <div className="hidden sm:block text-border">|</div>
                        <div className="flex-1">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mr-2">Then</span>
                          <div className="inline-flex flex-wrap gap-1.5 align-middle">
                            {formatActions(rule.actions).map((a, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-border/50 text-muted-foreground text-xs font-medium shadow-sm">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap text-muted-foreground">
                        <span className="text-xs uppercase font-bold tracking-wider">Type</span>
                        <span className="font-medium text-foreground capitalize">{(rule.rule_type || 'custom').replace(/_/g, ' ')}</span>
                        <span className="text-border">•</span>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${getActionColor(rule.action || 'trash')}`}>
                          {getActionIcon(rule.action || 'trash')} {getActionLabel(rule.action || 'trash')}
                        </Badge>
                        <span className="text-border">•</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3" /> After {formatRetention(rule.retention_hours || 24)}
                        </span>
                        {rule.clean_conditions?.category && (
                          <>
                            <span className="text-border">•</span>
                            <span className="text-xs"><span className="uppercase font-bold tracking-wider">Category</span> <span className="font-medium text-foreground">{rule.clean_conditions.category}</span></span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
