'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Brain, Calendar, Mail, User, ShieldCheck, Zap, Trash2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

interface EmailDetail {
  id: string
  subject: string
  sender: string
  sent_at: string
  snippet: string
  body: string
  category: string
  importance_score: number
  urgency: string
  explanation: string
  classification_tags: string[]
}

export default function EmailDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchEmailDetail()
    }
  }, [id])

  const fetchEmailDetail = async () => {
    try {
      const res = await api.get(`/emails/${id}`)
      setEmail(res.data)
    } catch (error) {
      console.error("Failed to fetch email detail", error)
      toast({
        title: "Error",
        description: "Could not load email details.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Email not found</h2>
        <Button variant="link" asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Email Intelligence</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold leading-tight">{email.subject}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                    <User className="w-4 h-4" />
                    <span>{email.sender}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <Badge variant={email.importance_score > 70 ? "default" : "secondary"} className="px-3 py-1">
                     {email.importance_score}% Important
                   </Badge>
                   <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <Calendar className="w-3 h-3" />
                     {format(new Date(email.sent_at), 'PPP p')}
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-background border rounded-lg p-6 min-h-[200px] whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {email.body || email.snippet || "No content available."}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="gap-2 text-muted-foreground hover:text-destructive">
               <Trash2 className="w-4 h-4" /> Delete
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-background font-semibold px-6">
               <CheckCircle className="w-4 h-4" /> Archive & Done
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">AI Explanation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-foreground/80">
                {email.explanation || "No AI explanation generated."}
              </p>
              
              <div className="space-y-2 pt-2 border-t border-primary/10">
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Categorization</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-background border-primary/20 text-primary">
                    {email.category}
                  </Badge>
                  {email.classification_tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] uppercase">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-primary/10">
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Urgency</p>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${email.urgency === 'high' ? 'bg-red-500' : 'bg-green-500'}`} />
                   <span className="text-sm capitalize font-medium">{email.urgency} Priority</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
               <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Smart Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start gap-3 h-11 text-sm">
                <ShieldCheck className="w-4 h-4 text-primary" /> Mark as verified
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3 h-11 text-sm">
                <Mail className="w-4 h-4 text-primary" /> Forward to group
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
