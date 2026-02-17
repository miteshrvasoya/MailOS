'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  AlarmClock, Clock, Bell, X, Loader2, Mail, 
  CalendarClock, Sunrise, CalendarDays
} from 'lucide-react'
import { formatDistanceToNow, format, isPast } from 'date-fns'

interface SnoozedItem {
  id: string
  email_id: string
  email_subject: string | null
  email_sender: string
  snooze_until: string
  reason: string | null
  status: string
  created_at: string
}

export default function SnoozedPage() {
  const [snoozed, setSnoozed] = useState<SnoozedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const { userId } = useAuth()
  const { toast } = useToast()

  const fetchSnoozed = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await api.get(`/snooze?user_id=${userId}`)
      setSnoozed(res.data)
    } catch (e) {
      console.error('Failed to fetch snoozed:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchSnoozed()
  }, [userId, fetchSnoozed])

  const handleUnsnooze = async (id: string) => {
    setProcessing(id)
    try {
      await api.post(`/snooze/${id}/unsnooze`)
      setSnoozed(prev => prev.filter(s => s.id !== id))
      toast({ title: 'Unsnoozed', description: 'Email has been moved back to your inbox.' })
    } catch (e) {
      console.error('Failed to unsnooze:', e)
      toast({ title: 'Error', description: 'Failed to unsnooze.', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlarmClock className="h-8 w-8 text-primary" />
            Snoozed Emails
          </h2>
          <p className="text-muted-foreground mt-2">
            Emails you've snoozed will reappear when their timer is up.
          </p>
        </div>
        <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1">
          <Clock className="w-3.5 h-3.5" />
          {snoozed.length} snoozed
        </Badge>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : snoozed.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlarmClock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No snoozed emails</h3>
            <p className="text-muted-foreground max-w-sm">
              When you snooze an email, it will disappear and reappear at the time you choose.
              Snooze emails from the email detail view or follow-ups page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {snoozed.map(item => {
            const snoozeDate = new Date(item.snooze_until)
            const isExpired = isPast(snoozeDate)

            return (
              <Card
                key={item.id}
                className={`group transition-all hover:shadow-md ${
                  isExpired ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-primary/30'
                }`}
              >
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                        isExpired ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
                      }`}>
                        <AlarmClock className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold line-clamp-1">
                          {item.email_subject || 'No subject'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          From: {item.email_sender}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] gap-1 ${
                              isExpired
                                ? 'text-amber-600 border-amber-200 bg-amber-50'
                                : 'text-primary border-primary/20 bg-primary/5'
                            }`}
                          >
                            {isExpired ? <Bell className="w-2.5 h-2.5" /> : <CalendarClock className="w-2.5 h-2.5" />}
                            {isExpired
                              ? 'Ready to resurface'
                              : `Until ${format(snoozeDate, 'MMM d, h:mm a')}`
                            }
                          </Badge>

                          {item.reason && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.reason}
                            </span>
                          )}

                          <span className="text-[10px] text-muted-foreground">
                            {isExpired
                              ? `Expired ${formatDistanceToNow(snoozeDate)} ago`
                              : `Resurfaces ${formatDistanceToNow(snoozeDate, { addSuffix: true })}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 flex-shrink-0"
                      onClick={() => handleUnsnooze(item.id)}
                      disabled={processing === item.id}
                    >
                      {processing === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      Unsnooze
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
