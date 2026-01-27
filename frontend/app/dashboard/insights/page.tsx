'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertCircle, Clock, Target, Zap, Settings } from 'lucide-react'
import Link from 'next/link'

const categoryData = [
  { name: 'Work', value: 34, fill: '#6b7280' },
  { name: 'Finance', value: 12, fill: '#4b5563' },
  { name: 'Newsletters', value: 45, fill: '#3a4452' },
  { name: 'Personal', value: 9, fill: '#2a3442' },
]

const trendData = [
  { date: 'Mon', important: 8, total: 45 },
  { date: 'Tue', important: 12, total: 52 },
  { date: 'Wed', important: 7, total: 38 },
  { date: 'Thu', important: 15, total: 61 },
  { date: 'Fri', important: 10, total: 48 },
  { date: 'Sat', important: 3, total: 22 },
  { date: 'Sun', important: 5, total: 18 },
]

const responseData = [
  { range: '0-1h', emails: 12 },
  { range: '1-4h', emails: 28 },
  { range: '4-24h', emails: 35 },
  { range: '1-7d', emails: 18 },
  { range: '7d+', emails: 7 },
]

const confidenceData = [
  { range: '90-100%', emails: 67 },
  { range: '80-90%', emails: 23 },
  { range: '70-80%', emails: 8 },
  { range: '<70%', emails: 2 },
]

export default function InsightsPage() {
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
            <p className="text-3xl font-bold text-foreground">28%</p>
            <p className="text-sm text-muted-foreground mt-1">Important emails detected</p>
            <p className="text-xs text-primary font-semibold mt-2">+3% from last week</p>
          </Card>

          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">4.2h</p>
            <p className="text-sm text-muted-foreground mt-1">Avg response time</p>
            <p className="text-xs text-primary font-semibold mt-2">↓ 15% faster than usual</p>
          </Card>

          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">156</p>
            <p className="text-sm text-muted-foreground mt-1">Unread this week</p>
            <p className="text-xs text-destructive font-semibold mt-2">12 unread urgent</p>
          </Card>

          <Card className="p-6 card-hover border-border/50 hover:border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">94%</p>
            <p className="text-sm text-muted-foreground mt-1">AI classification accuracy</p>
            <p className="text-xs text-primary font-semibold mt-2">Learning & improving</p>
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
          <h2 className="text-xl font-semibold mb-6">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Importance Trend */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Importance Trend</h2>
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
        </Card>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Response Delay */}
          <Card className="p-8 border-border/50">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Response Delay Distribution</h2>
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
            <p className="text-xs text-muted-foreground mt-4">Most emails are responded to within 4-24 hours</p>
          </Card>
          
          {/* AI Confidence */}
          <Card className="p-8 border-border/50">
            <h2 className="text-xl font-semibold mb-6 text-foreground">AI Confidence Score</h2>
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
            <p className="text-xs text-muted-foreground mt-4">90% of classifications are highly confident (90%+)</p>
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
              {[
                { sender: 'LinkedIn', emails: 87, percentage: 18 },
                { sender: 'GitHub', emails: 67, percentage: 14 },
                { sender: 'Stripe', emails: 54, percentage: 11 },
                { sender: 'team@company.com', emails: 43, percentage: 9 },
                { sender: 'Amazon', emails: 38, percentage: 8 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{item.sender}</p>
                    <p className="text-xs text-muted-foreground">{item.emails} emails</p>
                  </div>
                  <div className="w-full bg-secondary/30 rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${item.percentage * 10}%` }}
                    />
                  </div>
                </div>
              ))}
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
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">This week</p>
                  <p className="text-sm font-semibold text-foreground">284 emails</p>
                </div>
                <div className="text-xs text-muted-foreground">+12% vs last week</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">This month</p>
                  <p className="text-sm font-semibold text-foreground">1,247 emails</p>
                </div>
                <div className="text-xs text-muted-foreground">-3% vs last month</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 border border-border/30">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Daily average:</span> 40.6 emails
                </p>
              </div>
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
            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30 hover:border-border transition">
              <p className="text-sm font-semibold text-foreground">Most Active Day</p>
              <p className="text-2xl font-bold text-primary">Thursday</p>
              <p className="text-xs text-muted-foreground">61 emails received</p>
              <p className="text-xs text-primary font-semibold mt-2">Peak activity time</p>
            </div>
            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30 hover:border-border transition">
              <p className="text-sm font-semibold text-foreground">Quietest Day</p>
              <p className="text-2xl font-bold text-primary">Sunday</p>
              <p className="text-xs text-muted-foreground">18 emails received</p>
              <p className="text-xs text-primary font-semibold mt-2">Catch-up time</p>
            </div>
            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30 hover:border-border transition">
              <p className="text-sm font-semibold text-foreground">Avg Processing Speed</p>
              <p className="text-2xl font-bold text-primary">2.3 sec</p>
              <p className="text-xs text-muted-foreground">Per email analysis</p>
              <p className="text-xs text-primary font-semibold mt-2">Lightning fast</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
