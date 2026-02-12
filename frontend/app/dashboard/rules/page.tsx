'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Plus, Settings2, Trash2, Zap, Shield, Mail,
  DollarSign, Briefcase, BookOpen, ChevronRight,
  ToggleLeft, ToggleRight, Tag, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'

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
  if (actions?.stop_processing) result.push('Stop processing')
  return result
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<RuleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [enablingTemplate, setEnablingTemplate] = useState<string | null>(null)
  const [togglingRule, setTogglingRule] = useState<string | null>(null)
  const { data: session } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
    fetchTemplates()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rules')
      setRules(res.data)
    } catch (e) {
      console.error("Failed to fetch rules", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await api.get('/rules/templates')
      setTemplates(res.data)
    } catch (e) {
      console.error("Failed to fetch templates", e)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.delete(`/rules/${id}`)
      setRules((prev: Rule[]) => prev.filter((r: Rule) => r.id !== id))
      toast({
        title: "Rule deleted",
        description: `"${name}" has been removed.`,
      })
    } catch (error) {
       console.error("Failed to delete rule", error)
       toast({
         title: "Error",
         description: "Failed to delete the rule.",
         variant: "destructive"
       })
    }
  }

  const handleToggle = async (id: string, currentState: boolean) => {
    setTogglingRule(id)
    try {
      const res = await api.patch(`/rules/${id}`, { is_active: !currentState })
      setRules(prev => prev.map(r => r.id === id ? res.data : r))
      toast({
        title: !currentState ? "Rule activated" : "Rule paused",
        description: `Rule is now ${!currentState ? 'active' : 'paused'}.`,
      })
    } catch (error) {
      console.error("Failed to toggle rule", error)
      toast({
        title: "Error",
        description: "Failed to update the rule.",
        variant: "destructive"
      })
    } finally {
      setTogglingRule(null)
    }
  }

  const handleEnableTemplate = async (templateId: string) => {
    const userId = (session?.user as any)?.id
    if (!userId) {
      toast({ title: "Not logged in", description: "Please log in to create rules.", variant: "destructive" })
      return
    }

    setEnablingTemplate(templateId)
    try {
      const res = await api.post('/rules/from-template', {
        user_id: userId,
        template_id: templateId,
      })
      setRules(prev => [res.data, ...prev])
      toast({
        title: "Template enabled!",
        description: `"${res.data.name}" rule is now active.`,
      })
    } catch (error) {
      console.error("Failed to create from template", error)
      toast({
        title: "Error",
        description: "Could not create rule from template.",
        variant: "destructive"
      })
    } finally {
      setEnablingTemplate(null)
    }
  }

  // Check which templates are already enabled (match by name)
  const enabledTemplateNames = new Set(rules.map(r => r.name))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-muted-foreground mt-2">
            Create custom rules to organize your inbox exactly how you want.
          </p>
        </div>
        <Link href="/dashboard/rules/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Rule
          </Button>
        </Link>
      </div>

      {/* Rule Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Templates</h3>
          <Badge variant="secondary" className="text-xs">One-click</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Pre-built rules to get started — enable with a single click.
        </p>

        {loadingTemplates ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const isEnabled = enabledTemplateNames.has(template.name)
              return (
                <Card
                  key={template.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                    isEnabled ? 'opacity-60 border-green-500/30' : 'hover:border-primary/30'
                  }`}
                >
                  <CardContent className="pt-5 pb-4 px-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg border ${getTemplateColor(template.id)}`}>
                        {getTemplateIcon(template.id)}
                      </div>
                      {isEnabled && (
                        <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs">
                          Enabled
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formatActions(template.actions).map((action, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {action}
                        </span>
                      ))}
                    </div>
                    {!isEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 gap-2 text-xs"
                        disabled={enablingTemplate === template.id}
                        onClick={() => handleEnableTemplate(template.id)}
                      >
                        {enablingTemplate === template.id ? (
                          'Enabling...'
                        ) : (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            Enable Rule
                          </>
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

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* User Rules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Your Rules</h3>
          {!loading && <Badge variant="outline">{rules.length}</Badge>}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Settings2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rules yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start by enabling a template above or create a custom rule.
              </p>
              <Link href="/dashboard/rules/new">
                  <Button variant="outline">Create your first rule</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className={`transition-all duration-200 hover:shadow-md ${!rule.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Paused"}
                      </Badge>
                      <Badge variant="outline">Priority {rule.priority}</Badge>
                    </div>
                    <CardDescription>{rule.description || "No description provided"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                      title={rule.is_active ? 'Pause rule' : 'Activate rule'}
                      disabled={togglingRule === rule.id}
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                    >
                      {rule.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(rule.id, rule.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Conditions */}
                  <div className="text-sm">
                    <span className="text-muted-foreground font-medium">When: </span>
                    <span className="text-foreground">{formatConditions(rule.conditions)}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5">
                    {formatActions(rule.actions).map((action, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        {action}
                      </span>
                    ))}
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
