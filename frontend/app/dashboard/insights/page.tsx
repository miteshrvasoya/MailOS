 'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, AlertCircle, Clock, Target, Zap, Settings } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

type CategoryDatum = { category: string; count: number }
type TrendDatum = { date: string; important: number; total: number }
type BucketDatum = { range: string; emails: number }
type SenderDatum = { sender: string; emails: number; percentage: number }

interface KeyMetrics {
  important_ratio: number
  avg_response_hours: number | null
  unread_this_week: number
  unread_urgent: number
  ai_accuracy: number | null
}

interface VolumeSummary {
  this_week: number
  this_week_delta: number
  this_month: number
  this_month_delta: number
  daily_average: number
}

interface EngagementSummary {
  most_active_day: string
  most_active_count: number
  quietest_day: string
  quietest_count: number
  avg_processing_ms: number
}

export default function InsightsPage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)

  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryDatum[]>([])
  const [trendData, setTrendData] = useState<TrendDatum[]>([])
  const [responseData, setResponseData] = useState<BucketDatum[]>([])
  const [confidenceData, setConfidenceData] = useState<BucketDatum[]>([])
  const [topSenders, setTopSenders] = useState<SenderDatum[]>([])
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary | null>(null)
  const [engagementSummary, setEngagementSummary] = useState<EngagementSummary | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      if (!userId) return
      setLoading(true)
      try {
        const res = await api.get('/insights/overview', { params: { user_id: userId } })
        const data = res.data

        setKeyMetrics(data.key_metrics)
        setCategoryData(
          (data.category_distribution || []).map((d: any) => ({
            category: d.category,
            count: d.count,
          })),
        )
        setTrendData(data.importance_trend || [])
        setResponseData(data.response_delay_distribution || [])
        setConfidenceData(data.confidence_buckets || [])
        setTopSenders(data.top_senders || [])
        setVolumeSummary(data.volume_summary || null)
        setEngagementSummary(data.engagement_summary || null)
      } catch (e) {
        console.error('Failed to fetch insights overview:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [userId])

  const pieColors = ['#6b7280', '#4b5563', '#3a4452', '#2a3442', '#1f2937']

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Insights</h1>
          <p className="text-muted-foreground">Analytics about your email patterns</p>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
            {loading || !keyMetrics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {keyMetrics.important_ratio.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Important emails detected</p>
              </>
            )}
          </Card>

          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            {loading || !keyMetrics || keyMetrics.avg_response_hours == null ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {keyMetrics.avg_response_hours.toFixed(1)}h
                </p>
                <p className="text-sm text-muted-foreground mt-1">Avg pending follow-up age</p>
              </>
            )}
          </Card>

          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
            {loading || !keyMetrics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {keyMetrics.unread_this_week}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Unread this week</p>
                <p className="text-xs text-destructive font-semibold mt-2">
                  {keyMetrics.unread_urgent} unread urgent
                </p>
              </>
            )}
          </Card>

          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            {loading || !keyMetrics || keyMetrics.ai_accuracy == null ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {keyMetrics.ai_accuracy.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">AI classification success</p>
              </>
            )}
          </Card>
        </div>

        {/* Key Insights */}
        <Card className="p-6 mb-12 border-border/50">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Key Insights</h2>
          <div className="space-y-3">
            <div className="flex gap-3 p-4 bg-secondary/30 rounded-lg border border-border/30 items-start justify-between">
              <div className="flex gap-3 flex-1">
                <div className="w-1 bg-primary rounded-full flex-shrink-0 mt-1" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Most active sender:</span> You receive 12-15 emails per day from LinkedIn. Consider creating a rule to batch digest these.
                </p>
              </div>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-background font-semibold flex-shrink-0 ml-2">
                <Link href="/dashboard/rules">
                  <Zap className="w-4 h-4 mr-1" />
                  Create Rule
                </Link>
              </Button>
            </div>

            <div className="flex gap-3 p-4 bg-secondary/30 rounded-lg border border-border/30 items-start justify-between">
              <div className="flex gap-3 flex-1">
                <div className="w-1 bg-primary rounded-full flex-shrink-0 mt-1" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Peak email time:</span> You get 40% more emails between 9-11 AM and 2-4 PM. Consider batch processing during these hours.
                </p>
              </div>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-background font-semibold flex-shrink-0 ml-2">
                <Link href="/dashboard/digests">
                  <Clock className="w-4 h-4 mr-1" />
                  Setup Digest
                </Link>
              </Button>
            </div>

            <div className="flex gap-3 p-4 bg-secondary/30 rounded-lg border border-border/30 items-start justify-between">
              <div className="flex gap-3 flex-1">
                <div className="w-1 bg-primary rounded-full flex-shrink-0 mt-1" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Priority senders:</span> 5 senders account for 43% of important emails. Your work & finance categories need immediate attention.
                </p>
              </div>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-background font-semibold flex-shrink-0 ml-2">
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-1" />
                  Priorities
                </Link>
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Category Distribution */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Category Distribution (last 7 days)</h2>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categorized emails yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        
        {/* Importance Trend */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Importance Trend (last 7 days)</h2>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent emails to chart yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="important"
                  stroke="#ffffff"
                  strokeWidth={2}
                  name="Important emails"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6b7280"
                  strokeWidth={2}
                  name="Total emails"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Response Delay */}
          <Card className="p-8 border-border/50">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Response Delay Distribution</h2>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="emails" fill="#ffffff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Based on how long pending follow-ups have been waiting for a reply.
            </p>
          </Card>
          
          {/* AI Confidence */}
          <Card className="p-8 border-border/50">
            <h2 className="text-xl font-semibold mb-6 text-foreground">AI Confidence Score</h2>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="emails" fill="#ffffff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Top Senders & Categories Breakdown */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="p-8 border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Top Email Senders</h2>
              <Button asChild size="sm" variant="outline" className="border-border/50 hover:border-border bg-transparent">
                <Link href="/dashboard/rules">
                  <Zap className="w-4 h-4 mr-1" />
                  Create Rules
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : topSenders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No senders to show yet.</p>
              ) : (
                topSenders.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{item.sender}</p>
                      <p className="text-xs text-muted-foreground">{item.emails} emails</p>
                    </div>
                    <div className="w-full bg-secondary/30 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-8 border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Email Volume Trend</h2>
              <Button asChild size="sm" variant="outline" className="border-border/50 hover:border-border bg-transparent">
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-1" />
                  Manage
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {loading || !volumeSummary ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-12" />
                </>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">This week</p>
                      <p className="text-sm font-semibold text-foreground">
                        {volumeSummary.this_week} emails
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(volumeSummary.this_week_delta ?? 0) >= 0 ? '+' : ''}
                      {Math.round((volumeSummary.this_week_delta ?? 0) * 100)}% vs last week
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">This month</p>
                      <p className="text-sm font-semibold text-foreground">
                        {volumeSummary.this_month} emails
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(volumeSummary.this_month_delta ?? 0) >= 0 ? '+' : ''}
                      {Math.round((volumeSummary.this_month_delta ?? 0) * 100)}% vs last month
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 border border-border/30">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Daily average:</span>{' '}
                      {volumeSummary.daily_average.toFixed(1)} emails
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Time Zone & Engagement Insights */}
        <Card className="p-8 border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Engagement Summary</h2>
            <Button asChild size="sm" variant="outline" className="border-border/50 hover:border-border bg-transparent">
              <Link href="/dashboard/digests">
                <Clock className="w-4 h-4 mr-1" />
                Schedule
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {loading || !engagementSummary ? (
              <>
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </>
            ) : (
              <>
                <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30 hover:border-border transition">
                  <p className="text-sm font-semibold text-foreground">Most Active Day</p>
                  <p className="text-2xl font-bold text-primary">
                    {engagementSummary.most_active_day}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {engagementSummary.most_active_count} emails received
                  </p>
                </div>
                <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30 hover:border-border transition">
                  <p className="text-sm font-semibold text-foreground">Quietest Day</p>
                  <p className="text-2xl font-bold text-primary">
                    {engagementSummary.quietest_day}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {engagementSummary.quietest_count} emails received
                  </p>
                </div>
                <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30 hover:border-border transition">
                  <p className="text-sm font-semibold text-foreground">Avg Processing Speed</p>
                  <p className="text-2xl font-bold text-primary">
                    {(engagementSummary.avg_processing_ms / 1000).toFixed(2)} sec
                  </p>
                  <p className="text-xs text-muted-foreground">Per email analysis</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
