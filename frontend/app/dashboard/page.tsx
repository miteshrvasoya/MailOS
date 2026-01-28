'use client'

import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Mail, TrendingUp, Zap, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { useToast } from '@/components/ui/use-toast'

interface EmailInsight {
  id: string
  subject: string
  sender: string
  sent_at: string
  importance_score: number
  category: string
}


export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [emails, setEmails] = useState<EmailInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [stats, setStats] = useState([
    { label: 'Emails processed today', value: '0', icon: Mail },
    { label: 'Important detected', value: '0', icon: AlertCircle },
    { label: 'Groups created', value: '0', icon: TrendingUp },
    { label: 'AI confidence', value: '0%', icon: Zap },
  ])

  const { toast } = useToast()

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, emailsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/emails?limit=5')
      ])
      
      const s = statsRes.data
      setStats([
        { label: 'Emails processed today', value: s.total_emails.toString(), icon: Mail },
        { label: 'Important detected', value: s.important_emails.toString(), icon: AlertCircle },
        { label: 'Groups created', value: s.active_rules.toString(), icon: TrendingUp },
        { label: 'AI confidence', value: `${s.ai_confidence}%`, icon: Zap },
      ])
      
      setEmails(emailsRes.data)
    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
      if (!session?.user?.id) return;
      setScanning(true);
      toast({
        title: "Scanning initiated",
        description: "Checking your Gmail for new important emails...",
      })
      
      try {
          trackEvent({ action: 'scan_gmail', category: 'Dashboard', label: 'User initiated scan' })
          await api.post('/gmail/sync', { 
            user_id: session.user.id,
            mode: 'full'
          });
          
          toast({
            title: "Scan complete",
            description: "We've found new insights for you.",
          })
          
          // Refresh data instead of just redirecting, or redirect if that's the desired flow
          fetchDashboardData()
          router.push('/dashboard/suggestions');
      } catch (error) {
          console.error("Scan failed", error);
          toast({
            title: "Scan failed",
            description: "There was an error connecting to Gmail.",
            variant: "destructive"
          })
          setScanning(false);
      }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ... styles ... */}
      
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-12 animate-slide-down flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2 text-foreground">
                Good evening, <span className="text-primary">{session?.user?.name || 'Mitesh'}</span>
            </h1>
            <p className="text-lg text-muted-foreground">Here's what matters today</p>
          </div>
          <Button 
            size="lg" 
            className="gap-2 shadow-lg hover:shadow-xl transition-all" 
            onClick={handleScan} 
            disabled={scanning}
          >
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {scanning ? 'Scanning...' : 'Scan Gmail'}
          </Button>
        </div>

        
        {/* Important Emails */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Important Emails</h2>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80 hover:bg-transparent">
              <Link href="/dashboard/groups" className="flex items-center gap-2">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
                <p className="text-muted-foreground">Loading emails...</p>
            ) : emails.map((email, idx) => (
              <div key={email.id} style={{ animationDelay: `${idx * 0.1}s` }} className="animate-slide-up">
                <Card className="p-5 card-hover border-border/50 hover:border-border cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-primary transition">{email.subject}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        From <span className="text-foreground/70">{email.sender}</span> • {new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-background font-medium cta-button">
                        <Link href={`/dashboard/emails/${email.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        {/* Today's Digest Preview */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Today's Digest Preview</h2>
            <div className="space-y-3">
              {[
                  { category: '💼 Work', count: 8 },
                  { category: '💰 Finance', count: 3 },
                  { category: '📰 Newsletters', count: 12 },
                ].map((item, i) => (
                <Card key={i} className="p-4 card-hover border-border/50 hover:border-border flex items-center justify-between group cursor-pointer">
                  <span className="font-medium text-foreground">{item.category}</span>
                  <span className="text-xs font-semibold bg-secondary/80 group-hover:bg-secondary text-foreground px-3 py-1.5 rounded-full transition">
                    {item.count} emails
                  </span>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Stats */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <Card key={i} className="p-4 card-hover border-border/50 hover:border-border group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/50 group-hover:bg-secondary flex items-center justify-center transition">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-card border border-border/50 rounded-xl p-8 hover:border-border transition">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Button asChild className="h-auto py-5 px-6 bg-secondary/40 hover:bg-secondary text-foreground border border-border/50 hover:border-border font-semibold cta-button rounded-lg justify-start">
                <Link href="/dashboard/digests" className="flex flex-col items-start gap-1.5">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Create Custom Digest
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">Set up filtered emails</span>
                </Link>
              </Button>
              <Button asChild className="h-auto py-5 px-6 bg-secondary/40 hover:bg-secondary text-foreground border border-border/50 hover:border-border font-semibold cta-button rounded-lg justify-start">
                <Link href="/dashboard/rules" className="flex flex-col items-start gap-1.5">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Add a Rule
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">Auto-organize emails</span>
                </Link>
              </Button>
              <Button asChild className="h-auto py-5 px-6 bg-secondary/40 hover:bg-secondary text-foreground border border-border/50 hover:border-border font-semibold cta-button rounded-lg justify-start">
                <Link href="/dashboard/settings" className="flex flex-col items-start gap-1.5">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Adjust Settings
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">Customize your experience</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
