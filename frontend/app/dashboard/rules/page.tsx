'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import {
  Plus, Settings2, Trash2, Zap, Shield, Mail,
  DollarSign, Briefcase, BookOpen, ChevronRight,
  ToggleLeft, ToggleRight, Tag, ArrowRight, Sparkles,
  Loader2, Check, X, Wand2, Archive, Clock,
  Megaphone, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// ─── Types ──────────────────────────────────────────────────────

interface Rule {
  id: string
  name: string
  description: string
  priority: number
  is_active: boolean
  conditions: any
  actions: any
}

interface RuleTemplate {
  id: string
  name: string
  description: string
  conditions: any
  actions: any
  priority: number
}

interface ParsedRulePreview {
  name: string
  description: string
  conditions: any
  actions: any
  priority: number
  explanation: string
}

interface AutoCleanRule {
  id: string
  user_id: string
  name: string
  rule_type: string
  conditions: any
  action: string
  retention_hours: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

interface AutoCleanTemplate {
  id: string
  name: string
  description: string
  rule_type: string
  conditions: any
  action: string
  retention_hours: number
}

// ─── Helpers ────────────────────────────────────────────────────

function getTemplateIcon(id: string) {
  switch (id) {
    case 'otp_security': return <Shield className="w-5 h-5" />
    case 'archive_promotions': return <Mail className="w-5 h-5" />
    case 'important_invoices': return <DollarSign className="w-5 h-5" />
    case 'newsletter_archive': return <BookOpen className="w-5 h-5" />
    case 'job_alerts': return <Briefcase className="w-5 h-5" />
    case 'security_alerts': return <Shield className="w-5 h-5" />
    default: return <Zap className="w-5 h-5" />
  }
}

function getTemplateColor(id: string) {
  switch (id) {
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

function getCleanTypeIcon(ruleType: string) {
  switch (ruleType) {
    case 'otp': return <Shield className="w-5 h-5" />
    case 'newsletter': return <Mail className="w-5 h-5" />
    case 'promotion': return <Megaphone className="w-5 h-5" />
    case 'low_priority': return <ArrowRight className="w-5 h-5" />
    default: return <Sparkles className="w-5 h-5" />
  }
}

function getCleanTypeColor(ruleType: string) {
  switch (ruleType) {
    case 'otp': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'newsletter': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'promotion': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    case 'low_priority': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    default: return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
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

function formatRetention(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

// ─── Component ──────────────────────────────────────────────────

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<'organize' | 'clean'>('organize')

  // Organize rules state
  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<RuleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [enablingTemplate, setEnablingTemplate] = useState<string | null>(null)
  const [togglingRule, setTogglingRule] = useState<string | null>(null)

  // Auto-clean rules state
  const [cleanRules, setCleanRules] = useState<AutoCleanRule[]>([])
  const [cleanTemplates, setCleanTemplates] = useState<AutoCleanTemplate[]>([])
  const [loadingClean, setLoadingClean] = useState(true)
  const [loadingCleanTemplates, setLoadingCleanTemplates] = useState(true)
  const [enablingCleanTemplate, setEnablingCleanTemplate] = useState<string | null>(null)
  const [togglingCleanRule, setTogglingCleanRule] = useState<string | null>(null)

  // Clean rule creation
  const [showCleanForm, setShowCleanForm] = useState(false)
  const [creatingClean, setCreatingClean] = useState(false)
  const [cleanFormName, setCleanFormName] = useState('')
  const [cleanFormType, setCleanFormType] = useState('custom')
  const [cleanFormAction, setCleanFormAction] = useState('trash')
  const [cleanFormRetention, setCleanFormRetention] = useState(24)
  const [cleanFormCategory, setCleanFormCategory] = useState('')

  // NL Rule State
  const [nlInput, setNlInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedPreview, setParsedPreview] = useState<ParsedRulePreview | null>(null)
  const [isCreatingParsed, setIsCreatingParsed] = useState(false)

  const { userId } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchRules()
      fetchTemplates()
      fetchCleanRules()
      fetchCleanTemplates()
    }
  }, [userId])

  // ─── Organize Rules API ─────────────────────────────────────────

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rules', { params: { user_id: userId } })
      setRules(res.data)
    } catch (e) { console.error("Failed to fetch rules", e) }
    finally { setLoading(false) }
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await api.get('/rules/templates')
      setTemplates(res.data)
    } catch (e) { console.error("Failed to fetch templates", e) }
    finally { setLoadingTemplates(false) }
  }

  const handleDeleteRule = async (id: string, name: string) => {
    try {
      await api.delete(`/rules/${id}`)
      setRules(prev => prev.filter(r => r.id !== id))
      toast({ title: "Rule deleted", description: `"${name}" has been removed.` })
      trackEvent({ action: 'delete_rule', category: AnalyticsCategories.RULES, label: name })
    } catch (error) {
      console.error("Failed to delete rule", error)
      toast({ title: "Error", description: "Failed to delete the rule.", variant: "destructive" })
    }
  }

  const handleToggleRule = async (id: string, currentState: boolean) => {
    setTogglingRule(id)
    try {
      const res = await api.patch(`/rules/${id}`, { is_active: !currentState })
      setRules(prev => prev.map(r => r.id === id ? res.data : r))
      toast({ title: !currentState ? "Rule activated" : "Rule paused", description: `Rule is now ${!currentState ? 'active' : 'paused'}.` })
      trackEvent({ action: !currentState ? 'activate_rule' : 'pause_rule', category: AnalyticsCategories.RULES, label: id })
    } catch (error) {
      console.error("Failed to toggle rule", error)
      toast({ title: "Error", description: "Failed to update the rule.", variant: "destructive" })
    } finally { setTogglingRule(null) }
  }

  const handleEnableTemplate = async (templateId: string) => {
    if (!userId) return
    setEnablingTemplate(templateId)
    try {
      const res = await api.post('/rules/from-template', { user_id: userId, template_id: templateId })
      setRules(prev => [res.data, ...prev])
      toast({ title: "Template enabled!", description: `"${res.data.name}" rule is now active.` })
      trackEvent({ action: 'enable_template', category: AnalyticsCategories.RULES, label: templateId })
    } catch (error) {
      console.error("Failed to create from template", error)
      toast({ title: "Error", description: "Could not create rule from template.", variant: "destructive" })
    } finally { setEnablingTemplate(null) }
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
      console.error("Parsing failed", e)
      toast({ title: "AI Parsing Failed", description: "Could not interpret your rule. Try being more specific.", variant: "destructive" })
    } finally { setIsParsing(false) }
  }

  const handleCreateFromParsed = async () => {
    if (!parsedPreview) return
    setIsCreatingParsed(true)
    try {
      const res = await api.post('/rules/from-parsed', { user_id: userId, ...parsedPreview })
      setRules(prev => [res.data, ...prev])
      setParsedPreview(null)
      setNlInput('')
      toast({ title: "Rule Created", description: "Your new rule has been added and activated." })
      trackEvent({ action: 'create_rule_ai', category: AnalyticsCategories.RULES, label: parsedPreview.name })
    } catch (e) {
      console.error("Creation failed", e)
      toast({ title: "Error", description: "Failed to create rule.", variant: "destructive" })
    } finally { setIsCreatingParsed(false) }
  }

  // ─── Auto-Clean Rules API ──────────────────────────────────────

  const fetchCleanRules = async () => {
    setLoadingClean(true)
    try {
      const res = await api.get('/auto-clean-rules', { params: { user_id: userId } })
      setCleanRules(res.data)
    } catch (e) { console.error('Failed to fetch clean rules', e) }
    finally { setLoadingClean(false) }
  }

  const fetchCleanTemplates = async () => {
    setLoadingCleanTemplates(true)
    try {
      const res = await api.get('/auto-clean-rules/templates')
      setCleanTemplates(res.data)
    } catch (e) { console.error('Failed to fetch clean templates', e) }
    finally { setLoadingCleanTemplates(false) }
  }

  const handleEnableCleanTemplate = async (templateId: string) => {
    if (!userId) return
    setEnablingCleanTemplate(templateId)
    try {
      const res = await api.post('/auto-clean-rules/from-template', { user_id: userId, template_id: templateId })
      setCleanRules(prev => [res.data, ...prev])
      toast({ title: 'Template enabled!', description: `"${res.data.name}" is now active.` })
    } catch (error) {
      console.error('Failed to create from template', error)
      toast({ title: 'Error', description: 'Could not enable template.', variant: 'destructive' })
    } finally { setEnablingCleanTemplate(null) }
  }

  const handleToggleCleanRule = async (id: string) => {
    setTogglingCleanRule(id)
    try {
      const res = await api.patch(`/auto-clean-rules/${id}/toggle`)
      setCleanRules(prev => prev.map(r => r.id === id ? res.data : r))
      toast({ title: res.data.is_enabled ? 'Rule activated' : 'Rule paused' })
    } catch (error) {
      console.error('Failed to toggle rule', error)
      toast({ title: 'Error', description: 'Could not update rule.', variant: 'destructive' })
    } finally { setTogglingCleanRule(null) }
  }

  const handleDeleteCleanRule = async (id: string, name: string) => {
    try {
      await api.delete(`/auto-clean-rules/${id}`)
      setCleanRules(prev => prev.filter(r => r.id !== id))
      toast({ title: 'Rule deleted', description: `"${name}" has been removed.` })
    } catch (error) {
      console.error('Failed to delete rule', error)
      toast({ title: 'Error', description: 'Could not delete rule.', variant: 'destructive' })
    }
  }

  const handleCreateCleanRule = async () => {
    if (!userId || !cleanFormName.trim()) return
    setCreatingClean(true)
    try {
      const conditions = cleanFormType === 'custom' && cleanFormCategory
        ? { category: cleanFormCategory }
        : {}
      const res = await api.post('/auto-clean-rules', {
        user_id: userId,
        name: cleanFormName,
        rule_type: cleanFormType,
        conditions,
        action: cleanFormAction,
        retention_hours: cleanFormRetention,
        is_enabled: true,
      })
      setCleanRules(prev => [res.data, ...prev])
      setShowCleanForm(false)
      setCleanFormName(''); setCleanFormType('custom'); setCleanFormAction('trash')
      setCleanFormRetention(24); setCleanFormCategory('')
      toast({ title: 'Rule created', description: `"${res.data.name}" is now active.` })
    } catch (error) {
      console.error('Failed to create rule', error)
      toast({ title: 'Error', description: 'Could not create rule.', variant: 'destructive' })
    } finally { setCreatingClean(false) }
  }

  const enabledTemplateNames = new Set(rules.map(r => r.name))
  const enabledCleanNames = new Set(cleanRules.map(r => r.name))

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
        <p className="text-muted-foreground mt-2">
          Create rules to organize, categorize, and automatically clean your inbox.
        </p>
      </div>

      {/* AI Magic Rule Creator */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/20 to-tasks/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <Card className="relative border-primary/20 shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-tasks/5 blur-3xl pointer-events-none"></div>

          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Magic Rule Creator</h3>
                <CardDescription>
                  Describe what you want in plain English — AI will build the rule.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6 pt-4">
            {!parsedPreview ? (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Textarea
                    placeholder="Try: 'Archive promotional emails from linkedin.com after reading' or 'Move invoices to Finance and mark important'"
                    className="pl-4 pr-12 py-3 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 min-h-[80px] resize-none shadow-inner transition-all text-base placeholder:text-muted-foreground/50"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParseText() }
                    }}
                  />
                  <div className="absolute bottom-3 right-3">
                    {isParsing ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <span className="text-xs text-muted-foreground/50">⏎ to generate</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    disabled={isParsing || !nlInput.trim()}
                    onClick={handleParseText}
                  >
                    {isParsing ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Thinking...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Rule</>
                    )}
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
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                    Priority {parsedPreview.priority}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">When</Label>
                    <div className="bg-card/50 p-4 rounded-xl border border-border/50 text-sm leading-relaxed">
                      {parsedPreview.conditions?.all?.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                          <Badge variant="outline" className="bg-transparent border-border/50 font-normal text-xs uppercase tracking-wide text-muted-foreground">
                            {c.field}
                          </Badge>
                          <span className="text-muted-foreground text-xs">{c.operator.replace(/_/g, ' ')}</span>
                          <span className="font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                            "{c.value}"
                          </span>
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
                      {formatActions(parsedPreview.actions).length === 0 && (
                        <span className="text-muted-foreground italic">No actions defined</span>
                      )}
                    </div>
                  </div>
                </div>

                {parsedPreview.explanation && (
                  <div className="mb-6 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{parsedPreview.explanation}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                  <Button variant="ghost" onClick={() => setParsedPreview(null)} disabled={isCreatingParsed}>Cancel</Button>
                  <Button
                    onClick={handleCreateFromParsed}
                    disabled={isCreatingParsed}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] shadow-lg"
                  >
                    {isCreatingParsed ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                    ) : (
                      <><Check className="w-4 h-4 mr-2" /> Confirm & Create</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl border border-border/50 w-fit">
        <button
          onClick={() => setActiveTab('organize')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'organize'
              ? 'bg-card text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" />
          Organize
          {!loading && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{rules.length}</Badge>}
        </button>
        <button
          onClick={() => setActiveTab('clean')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'clean'
              ? 'bg-card text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Auto-Clean
          {!loadingClean && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{cleanRules.length}</Badge>}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ORGANIZE TAB                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'organize' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Templates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-500/10 rounded-md text-yellow-500 border border-yellow-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold">Quick Templates</h3>
                <Badge variant="secondary" className="text-xs font-normal">One-click enable</Badge>
              </div>
              <Link href="/dashboard/rules/new">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Create Manually
                </Button>
              </Link>
            </div>

            {loadingTemplates ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const isEnabled = enabledTemplateNames.has(template.name)
                  return (
                    <Card
                      key={template.id}
                      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        isEnabled ? 'opacity-70 border-green-500/30 bg-green-500/5' : 'hover:border-primary/30'
                      }`}
                    >
                      <CardContent className="pt-5 pb-4 px-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg border transition-colors ${getTemplateColor(template.id)}`}>
                            {getTemplateIcon(template.id)}
                          </div>
                          {isEnabled && (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                              <Check className="w-3 h-3" /> Active
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm leading-tight text-foreground">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                        </div>
                        <div className="pt-2 border-t border-dashed border-border/50">
                          <div className="flex flex-wrap gap-1">
                            {formatActions(template.actions).slice(0, 2).map((action, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{action}</span>
                            ))}
                          </div>
                        </div>
                        {!isEnabled && (
                          <Button variant="outline" size="sm"
                            className="w-full mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={enablingTemplate === template.id}
                            onClick={() => handleEnableTemplate(template.id)}
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

          {/* Active Organize Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary rounded-md text-muted-foreground">
                <Settings2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold">Active Organization Rules</h3>
              {!loading && <Badge variant="outline" className="ml-1">{rules.length}</Badge>}
            </div>

            {loading ? (
              <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : rules.length === 0 ? (
              <Card className="border-dashed bg-card/50">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <Settings2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No organization rules yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                    Create rules to automatically categorize, label, and prioritize your emails. Try the AI creator above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {rules.map((rule) => (
                  <Card key={rule.id} className={`group transition-all duration-300 hover:shadow-md border-l-4 ${!rule.is_active ? 'opacity-60 border-l-muted' : 'border-l-primary'}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-bold text-foreground">{rule.name}</h4>
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
                            onClick={() => handleToggleRule(rule.id, rule.is_active)}
                          >
                            {rule.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm bg-secondary/30 p-3 rounded-lg border border-border/50">
                        <div className="flex-1">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mr-2">When</span>
                          <span className="font-medium text-foreground">{formatConditions(rule.conditions)}</span>
                        </div>
                        <div className="hidden sm:block text-border">|</div>
                        <div className="flex-1">
                          <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mr-2">Then</span>
                          <div className="inline-flex flex-wrap gap-1.5 align-middle">
                            {formatActions(rule.actions).map((action, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-border/50 text-muted-foreground text-xs font-medium shadow-sm">
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AUTO-CLEAN TAB                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'clean' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Safety notice */}
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm">
            <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Safety First</p>
              <p className="text-muted-foreground mt-0.5">
                Auto-clean never acts on important or high-urgency emails. Actions only execute after the retention period, and all actions are logged.
              </p>
            </div>
          </div>

          {/* Clean Templates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md text-primary border border-primary/20">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold">Quick Templates</h3>
                <Badge variant="secondary" className="text-xs font-normal">One-click enable</Badge>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                onClick={() => setShowCleanForm(!showCleanForm)}
              >
                {showCleanForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Create Rule</>}
              </Button>
            </div>

            {loadingCleanTemplates ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cleanTemplates.map((template) => {
                  const isEnabled = enabledCleanNames.has(template.name)
                  return (
                    <Card key={template.id}
                      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        isEnabled ? 'opacity-70 border-green-500/30 bg-green-500/5' : 'hover:border-primary/30'
                      }`}
                    >
                      <CardContent className="pt-5 pb-4 px-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg border transition-colors ${getCleanTypeColor(template.rule_type)}`}>
                            {getCleanTypeIcon(template.rule_type)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] gap-1 ${getActionColor(template.action)}`}>
                              {getActionIcon(template.action)}
                              <span>{getActionLabel(template.action)}</span>
                            </Badge>
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
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          After {formatRetention(template.retention_hours)}
                        </div>
                        {!isEnabled && (
                          <Button variant="outline" size="sm"
                            className="w-full mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={enablingCleanTemplate === template.id}
                            onClick={() => handleEnableCleanTemplate(template.id)}
                          >
                            {enablingCleanTemplate === template.id ? (
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

          {/* Create Clean Rule Form */}
          {showCleanForm && (
            <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Create Auto-Clean Rule
                </CardTitle>
                <CardDescription>Define conditions for automatic email cleanup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Name</label>
                  <input type="text" placeholder="e.g., Archive old promotions"
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition text-sm"
                    value={cleanFormName}
                    onChange={(e) => setCleanFormName(e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Type</label>
                    <select className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                      value={cleanFormType} onChange={(e) => setCleanFormType(e.target.value)}
                    >
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
                      value={cleanFormAction} onChange={(e) => setCleanFormAction(e.target.value)}
                    >
                      <option value="trash">Move to Trash</option>
                      <option value="archive">Archive</option>
                      <option value="delete">Permanently Delete</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">After</label>
                    <select className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                      value={cleanFormRetention} onChange={(e) => setCleanFormRetention(Number(e.target.value))}
                    >
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
                {cleanFormType === 'custom' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Match Category (optional)</label>
                    <input type="text" placeholder="e.g., Marketing, Spam, Social"
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition text-sm"
                      value={cleanFormCategory}
                      onChange={(e) => setCleanFormCategory(e.target.value)}
                    />
                  </div>
                )}
                {cleanFormAction === 'delete' && (
                  <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Permanent deletion cannot be undone. Consider "Trash" for safety.</span>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleCreateCleanRule} disabled={creatingClean || !cleanFormName.trim()} className="gap-2">
                    {creatingClean ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Create Rule</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Clean Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary rounded-md text-muted-foreground">
                <Settings2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold">Active Auto-Clean Rules</h3>
              {!loadingClean && <Badge variant="outline" className="ml-1">{cleanRules.length}</Badge>}
            </div>

            {loadingClean ? (
              <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : cleanRules.length === 0 ? (
              <Card className="border-dashed bg-card/50">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No auto-clean rules yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                    Enable a template above or create a custom rule to automatically clean your inbox.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {cleanRules.map((rule) => (
                  <Card key={rule.id}
                    className={`group transition-all duration-300 hover:shadow-md border-l-4 ${
                      !rule.is_enabled ? 'opacity-60 border-l-muted' : 'border-l-amber-500'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className={`p-1.5 rounded-lg border ${getCleanTypeColor(rule.rule_type)}`}>
                            {getCleanTypeIcon(rule.rule_type)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{rule.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] gap-1 ${getActionColor(rule.action)}`}>
                                {getActionIcon(rule.action)} {getActionLabel(rule.action)}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> After {formatRetention(rule.retention_hours)}
                              </span>
                              {rule.is_enabled ? (
                                <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10 text-[10px] uppercase tracking-wider">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground border-border bg-secondary text-[10px] uppercase tracking-wider">Paused</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                            disabled={togglingCleanRule === rule.id}
                            onClick={() => handleToggleCleanRule(rule.id)}
                          >
                            {rule.is_enabled ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDeleteCleanRule(rule.id, rule.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground">
                        <span className="text-xs uppercase font-bold tracking-wider mr-2">Type</span>
                        <span className="font-medium text-foreground capitalize">{rule.rule_type.replace(/_/g, ' ')}</span>
                        {rule.conditions?.category && (
                          <>
                            <span className="mx-2 text-border">•</span>
                            <span className="text-xs uppercase font-bold tracking-wider mr-2">Category</span>
                            <span className="font-medium text-foreground">{rule.conditions.category}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
