'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Brain, Clock, Zap, AlertTriangle, CheckCircle2,
  XCircle, ChevronDown, RefreshCw, Loader2, Activity
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface AILogItem {
  id: string
  user_id: string | null
  email_id: string | null
  model: string
  prompt_messages: Array<{ role: string; content: string }>
  temperature: number
  response_content: string | null
  parsed_result: Record<string, any> | null
  finish_reason: string | null
  error: string | null
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
  latency_ms: number
  status: string
  purpose: string
  created_at: string
}

interface Summary {
  total_calls: number
  success_count: number
  error_count: number
  total_tokens: number
  total_cost: number
  avg_latency_ms: number
}

export default function AILogsPage() {
  const [logs, setLogs] = useState<AILogItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')

  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      params.append('limit', '100')

      const [logsRes, summaryRes] = await Promise.all([
        api.get(`/ai-logs?${params.toString()}`),
        api.get('/ai-logs/summary'),
      ])
      setLogs(logsRes.data)
      setSummary(summaryRes.data)
    } catch (e) {
      console.error('Failed to fetch AI logs:', e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Logs
          </h2>
          <p className="text-muted-foreground mt-2">
            Request & response logs for AI-powered email classification.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Calls" value={summary.total_calls.toString()} icon={<Activity className="w-5 h-5" />} color="text-blue-500" />
          <StatCard label="Successful" value={summary.success_count.toString()} icon={<CheckCircle2 className="w-5 h-5" />} color="text-green-500" />
          <StatCard label="Errors" value={summary.error_count.toString()} icon={<XCircle className="w-5 h-5" />} color="text-red-500" />
          <StatCard label="Total Tokens" value={summary.total_tokens.toLocaleString()} icon={<Zap className="w-5 h-5" />} color="text-amber-500" />
          <StatCard label="Avg Latency" value={`${Math.round(summary.avg_latency_ms)}ms`} icon={<Clock className="w-5 h-5" />} color="text-purple-500" />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'success', 'error'] as const).map(f => (
          <button
            key={f}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && summary ? ` (${summary.total_calls})` : ''}
            {f === 'success' && summary ? ` (${summary.success_count})` : ''}
            {f === 'error' && summary ? ` (${summary.error_count})` : ''}
          </button>
        ))}
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI logs yet</h3>
            <p className="text-muted-foreground">
              AI logs will appear here when emails are processed through the classification pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const isExpanded = expandedId === log.id
            const isError = log.status === 'error'

            return (
              <Card
                key={log.id}
                className={`transition-all cursor-pointer hover:shadow-md ${
                  isError ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                <CardContent className="pt-4 pb-3 px-5">
                  {/* Summary Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isError ? (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{log.purpose}</span>
                          <Badge variant="outline" className="text-[10px]">{log.model.split('/').pop()}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{log.total_tokens} tokens</span>
                          <span>{log.latency_ms}ms</span>
                          <span>{formatDistanceToNow(new Date(log.created_at))} ago</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.parsed_result && (
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                        >
                          {log.parsed_result.category || 'N/A'}
                        </Badge>
                      )}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {/* Parsed Result */}
                      {log.parsed_result && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">AI Classification Result</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <InfoChip label="Category" value={log.parsed_result.category} />
                            <InfoChip label="Intent" value={log.parsed_result.intent} />
                            <InfoChip label="Importance" value={`${log.parsed_result.importance_score}/100`} />
                            <InfoChip label="Urgency" value={log.parsed_result.urgency} />
                            <InfoChip label="Needs Reply" value={log.parsed_result.needs_reply ? 'Yes' : 'No'} />
                            <InfoChip label="Finish" value={log.finish_reason || 'N/A'} />
                          </div>
                          {log.parsed_result.explanation && (
                            <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 p-2 rounded">
                              💡 {log.parsed_result.explanation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Error */}
                      {log.error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs">
                          <p className="font-semibold mb-1">Error:</p>
                          <p className="font-mono">{log.error}</p>
                        </div>
                      )}

                      {/* Request */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Request Prompt</h4>
                        <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                          {log.prompt_messages.map(m => `[${m.role}] ${m.content}`).join('\n\n')}
                        </pre>
                      </div>

                      {/* Raw Response */}
                      {log.response_content && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Raw Response</h4>
                          <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap font-mono">
                            {log.response_content}
                          </pre>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Prompt: {log.prompt_tokens} tokens</span>
                        <span>Completion: {log.completion_tokens} tokens</span>
                        <span>Cost: ${log.cost.toFixed(6)}</span>
                        <span>Temp: {log.temperature}</span>
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy h:mm:ss a')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`${color} opacity-30`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium">{value}</p>
    </div>
  )
}
