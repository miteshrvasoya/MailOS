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
  Loader2, Check, X, Wand2
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    }
  }, [userId])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rules', { params: { user_id: userId } })
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
      trackEvent({
        action: 'delete_rule',
        category: AnalyticsCategories.RULES,
        label: name
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
      trackEvent({
        action: !currentState ? 'activate_rule' : 'pause_rule',
        category: AnalyticsCategories.RULES,
        label: id
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
      trackEvent({
        action: 'enable_template',
        category: AnalyticsCategories.RULES,
        label: templateId
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

  const handleParseText = async () => {
      if (!userId || !nlInput.trim()) return

      setIsParsing(true)
      try {
          const res = await api.post('/rules/parse-text', {
              user_id: userId,
              text: nlInput
          })
          setParsedPreview(res.data)
          trackEvent({
            action: 'parse_rule_ai',
            category: AnalyticsCategories.AI,
            label: 'success'
          })
      } catch (e) {
          console.error("Parsing failed", e)
          toast({
              title: "AI Parsing Failed",
              description: "Could not interpret your rule. Try being more specific.",
              variant: "destructive"
          })
      } finally {
          setIsParsing(false)
      }
  }

  const handleCreateFromParsed = async () => {
      if (!parsedPreview) return
      
      setIsCreatingParsed(true)
      try {
          const res = await api.post('/rules/from-parsed', {
              user_id: userId,
              ...parsedPreview
          })
          setRules(prev => [res.data, ...prev])
          setParsedPreview(null)
          setNlInput('')
          toast({
              title: "Rule Created",
              description: "Your new rule has been added and activated."
          })
          trackEvent({
            action: 'create_rule_ai',
            category: AnalyticsCategories.RULES,
            label: parsedPreview.name
          })
      } catch (e) {
          console.error("Creation failed", e)
          toast({ title: "Error", description: "Failed to create rule.", variant: "destructive" })
      } finally {
          setIsCreatingParsed(false)
      }
  }

  // Check which templates are already enabled (match by name)
  const enabledTemplateNames = new Set(rules.map(r => r.name))

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-muted-foreground mt-2">
            Automate your inbox with powerful custom rules and AI assistance.
          </p>
        </div>
        <Link href="/dashboard/rules/new">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Manually
          </Button>
        </Link>
      </div>

      {/* AI Rule Creator - Dark Theme Optimized */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <Card className="relative border-border/50 shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

             <CardHeader className="relative pb-2">
                 <div className="flex items-center gap-2 mb-1">
                     <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Wand2 className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-lg text-foreground">Magic Rule Creator</h3>
                        <CardDescription>
                            Describe what you want to happen, and AI will build the rule for you.
                        </CardDescription>
                     </div>
                 </div>
             </CardHeader>
             
             <CardContent className="relative space-y-6 pt-4">
                 {!parsedPreview ? (
                     <div className="flex flex-col gap-3">
                         <div className="relative">
                            <Textarea 
                                placeholder="Try: 'If an email is from linkedin.com and mentions connection, label it as LinkedIn/Requests'" 
                                className="pl-4 pr-12 py-3 bg-secondary/30 border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/20 min-h-[80px] resize-none shadow-inner transition-all text-base placeholder:text-muted-foreground/50"
                                value={nlInput}
                                onChange={(e) => setNlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleParseText()
                                    }
                                }}
                            />
                            <div className="absolute bottom-3 right-3">
                                {isParsing ? (
                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                ) : (
                                    <span className="text-xs text-muted-foreground/50">⏎ to generate</span>
                                )}
                            </div>
                         </div>
                         
                         <div className="flex justify-end">
                            <Button 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20" 
                                disabled={isParsing || !nlInput.trim()}
                                onClick={handleParseText}
                            >
                                {isParsing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Rule
                                    </>
                                )}
                            </Button>
                         </div>
                     </div>
                 ) : (
                     <div className="bg-secondary/30 rounded-xl border border-white/5 p-5 shadow-sm animate-in zoom-in-95 duration-300">
                         <div className="flex justify-between items-start mb-6">
                             <div className="space-y-1">
                                 <h4 className="font-bold text-xl text-foreground flex items-center gap-2">
                                     {parsedPreview.name}
                                 </h4>
                                 <p className="text-sm text-muted-foreground">{parsedPreview.description}</p>
                             </div>
                             <Badge className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border-indigo-500/20">
                                 Priority {parsedPreview.priority}
                             </Badge>
                         </div>
                         
                         <div className="grid md:grid-cols-2 gap-6 mb-6">
                             {/* Conditions Card */}
                             <div className="space-y-3">
                                 <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">When</Label>
                                 <div className="bg-card/50 p-4 rounded-xl border border-white/5 text-sm leading-relaxed">
                                     {parsedPreview.conditions?.all?.map((c: any, i: number) => (
                                         <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                                             <Badge variant="outline" className="bg-transparent border-white/10 font-normal text-xs uppercase tracking-wide text-muted-foreground">
                                                 {c.field}
                                             </Badge>
                                             <span className="text-muted-foreground text-xs">{c.operator.replace(/_/g, ' ')}</span>
                                             <span className="font-medium bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                                 "{c.value}"
                                             </span>
                                         </div>
                                     )) || <span className="text-muted-foreground italic">No conditions</span>}
                                 </div>
                             </div>
                             
                             {/* Actions Card */}
                             <div className="space-y-3">
                                 <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Then</Label>
                                 <div className="bg-card/50 p-4 rounded-xl border border-white/5 text-sm flex flex-col gap-2">
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
                             <div className="mb-6 text-xs text-muted-foreground bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10 flex items-start gap-2">
                                 <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                 <span>{parsedPreview.explanation}</span>
                             </div>
                         )}

                         <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                             <Button variant="ghost" onClick={() => setParsedPreview(null)} disabled={isCreatingParsed}>
                                 Cancel
                             </Button>
                             <Button 
                                onClick={handleCreateFromParsed} 
                                disabled={isCreatingParsed} 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[140px] shadow-lg shadow-indigo-900/20"
                             >
                                 {isCreatingParsed ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                 ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Confirm & Create
                                    </>
                                 )}
                             </Button>
                         </div>
                     </div>
                 )}
             </CardContent>
        </Card>
      </div>

      {/* Rule Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-md text-yellow-500 border border-yellow-500/20">
                <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold">Quick Templates</h3>
            <Badge variant="secondary" className="text-xs font-normal">One-click enable</Badge>
        </div>

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
                            <Check className="w-3 h-3" />
                            Active
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
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {action}
                            </span>
                        ))}
                        {formatActions(template.actions).length > 2 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                +{formatActions(template.actions).length - 2} more
                            </span>
                        )}
                        </div>
                    </div>

                    {!isEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={enablingTemplate === template.id}
                        onClick={() => handleEnableTemplate(template.id)}
                      >
                        {enablingTemplate === template.id ? (
                          <>
                             <Loader2 className="w-3 h-3 animate-spin mr-1" />
                             Enabling...
                          </>
                        ) : (
                          <>
                            Enable Rule
                            <ArrowRight className="w-3 h-3 ml-1" />
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

      {/* User Rules */}
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
                  <Settings2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No custom rules yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                Create user-defined rules to organize your inbox exactly how you want. 
                Try the AI creator above!
              </p>
              <Link href="/dashboard/rules/new">
                  <Button variant="outline">Create manually</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className={`group transition-all duration-300 hover:shadow-md border-l-4 ${!rule.is_active ? 'opacity-60 border-l-muted' : 'border-l-indigo-500'}`}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-lg font-bold text-foreground/90">{rule.name}</CardTitle>
                      {rule.is_active ? (
                           <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10 text-[10px] uppercase tracking-wider">Active</Badge> 
                      ) : (
                           <Badge variant="outline" className="text-muted-foreground border-border bg-secondary text-[10px] uppercase tracking-wider">Paused</Badge>
                      )}
                    </div>
                    <CardDescription>{rule.description || "No description provided"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(rule.id, rule.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm bg-secondary/30 p-3 rounded-lg border border-white/5">
                        <div className="flex-1">
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mr-2">When</span>
                            <span className="font-medium text-foreground">{formatConditions(rule.conditions)}</span>
                        </div>
                        <div className="hidden sm:block text-slate-700 dark:text-slate-700">|</div>
                        <div className="flex-1">
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider mr-2">Then</span>
                            <div className="inline-flex flex-wrap gap-1.5 align-middle">
                                {formatActions(rule.actions).map((action, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-white/5 text-muted-foreground text-xs font-medium shadow-sm">
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
  )
}
