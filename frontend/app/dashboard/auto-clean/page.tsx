'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  Trash2, Archive, Clock, Shield, Mail, Megaphone,
  ToggleLeft, ToggleRight, Plus, Loader2, Check,
  Sparkles, ArrowRight, AlertTriangle, Zap, Settings2,
  ChevronDown, X
} from 'lucide-react'

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

function getActionIcon(action: string) {
  switch (action) {
    case 'trash': return <Trash2 className="w-4 h-4" />
    case 'delete': return <AlertTriangle className="w-4 h-4" />
    case 'archive': return <Archive className="w-4 h-4" />
    default: return <Trash2 className="w-4 h-4" />
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case 'trash': return 'Move to Trash'
    case 'delete': return 'Permanently Delete'
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

function getTypeIcon(ruleType: string) {
  switch (ruleType) {
    case 'otp': return <Shield className="w-5 h-5" />
    case 'newsletter': return <Mail className="w-5 h-5" />
    case 'promotion': return <Megaphone className="w-5 h-5" />
    case 'low_priority': return <ArrowRight className="w-5 h-5" />
    default: return <Sparkles className="w-5 h-5" />
  }
}

function getTypeColor(ruleType: string) {
  switch (ruleType) {
    case 'otp': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'newsletter': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'promotion': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    case 'low_priority': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    default: return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  }
}

function formatRetention(hours: number): string {
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''}`
}

export default function AutoCleanPage() {
  const [rules, setRules] = useState<AutoCleanRule[]>([])
  const [templates, setTemplates] = useState<AutoCleanTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [enablingTemplate, setEnablingTemplate] = useState<string | null>(null)
  const [togglingRule, setTogglingRule] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('custom')
  const [formAction, setFormAction] = useState('trash')
  const [formRetention, setFormRetention] = useState(24)
  const [formConditionCategory, setFormConditionCategory] = useState('')

  const { userId } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchRules()
      fetchTemplates()
    }
  }, [userId])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auto-clean-rules', { params: { user_id: userId } })
      setRules(res.data)
    } catch (e) {
      console.error('Failed to fetch auto-clean rules', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await api.get('/auto-clean-rules/templates')
      setTemplates(res.data)
    } catch (e) {
      console.error('Failed to fetch templates', e)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleEnableTemplate = async (templateId: string) => {
    if (!userId) return
    setEnablingTemplate(templateId)
    try {
      const res = await api.post('/auto-clean-rules/from-template', {
        user_id: userId,
        template_id: templateId,
      })
      setRules(prev => [res.data, ...prev])
      toast({ title: 'Template enabled!', description: `"${res.data.name}" is now active.` })
    } catch (error) {
      console.error('Failed to create from template', error)
      toast({ title: 'Error', description: 'Could not enable template.', variant: 'destructive' })
    } finally {
      setEnablingTemplate(null)
    }
  }

  const handleToggle = async (id: string) => {
    setTogglingRule(id)
    try {
      const res = await api.patch(`/auto-clean-rules/${id}/toggle`)
      setRules(prev => prev.map(r => r.id === id ? res.data : r))
      toast({
        title: res.data.is_enabled ? 'Rule activated' : 'Rule paused',
        description: `Rule is now ${res.data.is_enabled ? 'active' : 'paused'}.`,
      })
    } catch (error) {
      console.error('Failed to toggle rule', error)
      toast({ title: 'Error', description: 'Could not update rule.', variant: 'destructive' })
    } finally {
      setTogglingRule(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.delete(`/auto-clean-rules/${id}`)
      setRules(prev => prev.filter(r => r.id !== id))
      toast({ title: 'Rule deleted', description: `"${name}" has been removed.` })
    } catch (error) {
      console.error('Failed to delete rule', error)
      toast({ title: 'Error', description: 'Could not delete rule.', variant: 'destructive' })
    }
  }

  const handleCreateRule = async () => {
    if (!userId || !formName.trim()) return
    setCreating(true)
    try {
      const conditions = formType === 'custom' && formConditionCategory
        ? { category: formConditionCategory }
        : {}

      const res = await api.post('/auto-clean-rules', {
        user_id: userId,
        name: formName,
        rule_type: formType,
        conditions,
        action: formAction,
        retention_hours: formRetention,
        is_enabled: true,
      })
      setRules(prev => [res.data, ...prev])
      setShowCreateForm(false)
      setFormName('')
      setFormType('custom')
      setFormAction('trash')
      setFormRetention(24)
      setFormConditionCategory('')
      toast({ title: 'Rule created', description: `"${res.data.name}" is now active.` })
    } catch (error) {
      console.error('Failed to create rule', error)
      toast({ title: 'Error', description: 'Could not create rule.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const enabledTemplateNames = new Set(rules.map(r => r.name))

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auto-Clean Rules</h2>
          <p className="text-muted-foreground mt-2">
            Automatically clean your inbox based on your preferences.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Cancel' : 'Create Rule'}
        </Button>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm">
        <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Safety First</p>
          <p className="text-muted-foreground mt-0.5">
            Auto-clean never acts on important or high-urgency emails. Actions only execute after the retention period, and all actions are logged for your review.
          </p>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create Custom Rule
            </CardTitle>
            <CardDescription>Define conditions for automatic email cleanup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Name</label>
              <input
                type="text"
                placeholder="e.g., Archive old promotions"
                className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition text-sm"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Type</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                >
                  <option value="otp">OTP / Verification</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotion">Promotion</option>
                  <option value="low_priority">Low Priority</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Action</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                >
                  <option value="trash">Move to Trash</option>
                  <option value="archive">Archive</option>
                  <option value="delete">Permanently Delete</option>
                </select>
              </div>

              {/* Retention */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">After</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 outline-none transition text-sm"
                  value={formRetention}
                  onChange={(e) => setFormRetention(Number(e.target.value))}
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

            {/* Custom category condition */}
            {formType === 'custom' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Match Category (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing, Spam, Social"
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition text-sm"
                  value={formConditionCategory}
                  onChange={(e) => setFormConditionCategory(e.target.value)}
                />
              </div>
            )}

            {formAction === 'delete' && (
              <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Permanent deletion cannot be undone. Consider using "Trash" instead for safety.</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleCreateRule}
                disabled={creating || !formName.trim()}
                className="gap-2"
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Check className="w-4 h-4" /> Create Rule</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preset Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary border border-primary/20">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold">Quick Templates</h3>
          <Badge variant="secondary" className="text-xs font-normal">One-click enable</Badge>
        </div>

        {loadingTemplates ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className={`p-2 rounded-lg border transition-colors ${getTypeColor(template.rule_type)}`}>
                        {getTypeIcon(template.rule_type)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${getActionColor(template.action)}`}>
                          {getActionIcon(template.action)}
                          <span className="ml-1">{template.action}</span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Active Rules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-secondary rounded-md text-muted-foreground">
            <Settings2 className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold">Active Rules</h3>
          {!loading && <Badge variant="outline" className="ml-1">{rules.length}</Badge>}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rules.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No auto-clean rules yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                Enable a template above or create a custom rule to start automatically cleaning your inbox.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                className={`group transition-all duration-300 hover:shadow-md border-l-4 ${
                  !rule.is_enabled ? 'opacity-60 border-l-muted' : 'border-l-primary'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`p-1.5 rounded-lg border ${getTypeColor(rule.rule_type)}`}>
                        {getTypeIcon(rule.rule_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{rule.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] gap-1 ${getActionColor(rule.action)}`}>
                            {getActionIcon(rule.action)}
                            {getActionLabel(rule.action)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            After {formatRetention(rule.retention_hours)}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title={rule.is_enabled ? 'Pause rule' : 'Activate rule'}
                        disabled={togglingRule === rule.id}
                        onClick={() => handleToggle(rule.id)}
                      >
                        {rule.is_enabled ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(rule.id, rule.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Rule details bar */}
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
  )
}
