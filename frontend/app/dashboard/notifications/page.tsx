'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Bell, Mail, FileText, Settings, Shield, Zap, CheckCircle, Trash2, Check, 
  Sparkles, Filter, BellRing, Archive, MoreHorizontal, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Category configuration with icons, colors, and gradients
const categoryConfig = {
  email_insight: {
    icon: Mail,
    label: 'Email Insight',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    gradient: 'from-sky-500/20 to-blue-500/20',
    borderColor: 'border-sky-500/30',
  },
  digest_ready: {
    icon: FileText,
    label: 'Digest Ready',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
  },
  rule_triggered: {
    icon: Zap,
    label: 'Rule Triggered',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
  },
  system: {
    icon: Settings,
    label: 'System',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    gradient: 'from-slate-500/20 to-gray-500/20',
    borderColor: 'border-slate-500/30',
  },
  security: {
    icon: Shield,
    label: 'Security',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    gradient: 'from-rose-500/20 to-red-500/20',
    borderColor: 'border-rose-500/30',
  },
  update: {
    icon: Sparkles,
    label: 'Update',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    gradient: 'from-violet-500/20 to-purple-500/20',
    borderColor: 'border-violet-500/30',
  },
}

const priorityConfig = {
  low: { 
    color: 'border-l-slate-500/50',
    badge: 'bg-slate-500/20 text-slate-400',
    dot: 'bg-slate-400',
  },
  medium: { 
    color: 'border-l-amber-500',
    badge: 'bg-amber-500/20 text-amber-400',
    dot: 'bg-amber-400',
  },
  high: { 
    color: 'border-l-rose-500',
    badge: 'bg-rose-500/20 text-rose-400',
    dot: 'bg-rose-400 animate-pulse',
  },
}

interface Notification {
  id: number
  title: string
  message: string
  category: keyof typeof categoryConfig
  priority: keyof typeof priorityConfig
  is_read: boolean
  action_url: string | null
  created_at: string
  read_at: string | null
}

// Demo notifications
const demoNotifications: Notification[] = [
  {
    id: 1,
    title: 'New Email Insights Available',
    message: 'We analyzed 47 new emails and found 5 high-priority messages requiring your attention.',
    category: 'email_insight',
    priority: 'high',
    is_read: false,
    action_url: '/dashboard',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read_at: null,
  },
  {
    id: 2,
    title: 'Your Daily Digest is Ready',
    message: 'Your morning digest has been prepared with 12 important emails summarized.',
    category: 'digest_ready',
    priority: 'medium',
    is_read: false,
    action_url: '/dashboard/digests',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read_at: null,
  },
  {
    id: 3,
    title: 'Rule "Important Clients" Triggered',
    message: 'An email from acme@corp.com matched your "Important Clients" rule and was categorized accordingly.',
    category: 'rule_triggered',
    priority: 'medium',
    is_read: true,
    action_url: '/dashboard/rules',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 4,
    title: 'Security Alert: New Login Detected',
    message: 'A new login was detected from Chrome on Windows. If this was you, no action is needed.',
    category: 'security',
    priority: 'high',
    is_read: true,
    action_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
  },
  {
    id: 5,
    title: 'MailOS v2.1 Released',
    message: 'New features include improved AI categorization and faster digest generation.',
    category: 'update',
    priority: 'low',
    is_read: true,
    action_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
  },
  {
    id: 6,
    title: 'Gmail Sync Complete',
    message: 'Successfully synchronized 1,234 emails from your Gmail account.',
    category: 'system',
    priority: 'low',
    is_read: true,
    action_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString(),
  },
]

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [session])

  const fetchNotifications = async () => {
    try {
      setNotifications(demoNotifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications(demoNotifications)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    )
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
  }

  const deleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false
    if (categoryFilter && n.category !== categoryFilter) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Bell className="w-5 h-5 absolute inset-0 m-auto text-primary/50" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 border border-border/50">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25">
                <BellRing className="w-7 h-7 text-white" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Notifications
              </h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : '✨ All caught up! No new notifications'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={markAllAsRead}
              className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-1 mr-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>
        
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-md transition-all',
              filter === 'all' && 'bg-background shadow-sm'
            )}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={cn(
              'rounded-md transition-all gap-2',
              filter === 'unread' && 'bg-background shadow-sm'
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={categoryFilter === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCategoryFilter(null)}
            className={cn(
              'rounded-lg text-xs transition-all',
              categoryFilter === null && 'bg-background shadow-sm'
            )}
          >
            All Types
          </Button>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={key}
                variant={categoryFilter === key ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  'rounded-lg text-xs gap-1.5 transition-all',
                  categoryFilter === key && `bg-gradient-to-r ${config.gradient} ${config.borderColor} border shadow-sm`
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', categoryFilter === key ? config.color : 'text-muted-foreground')} />
                <span className={categoryFilter === key ? config.color : ''}>{config.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
              <Archive className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {filter === 'unread' 
                ? "You've read all your notifications. Great job staying on top of things!" 
                : "When you receive notifications, they'll appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const config = categoryConfig[notification.category]
            const priority = priorityConfig[notification.priority]
            const Icon = config.icon
            const isHovered = hoveredId === notification.id

            return (
              <div
                key={notification.id}
                onMouseEnter={() => setHoveredId(notification.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border transition-all duration-300',
                  'border-l-[3px]',
                  priority.color,
                  !notification.is_read 
                    ? 'bg-gradient-to-r from-primary/5 to-transparent border-border/70 shadow-sm' 
                    : 'bg-card/50 border-border/30 hover:border-border/50',
                  isHovered && 'shadow-lg scale-[1.01]'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Unread glow effect */}
                {!notification.is_read && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                )}

                <div className="relative p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon with gradient background */}
                    <div className={cn(
                      'relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300',
                      `bg-gradient-to-br ${config.gradient}`,
                      isHovered && 'scale-110'
                    )}>
                      <Icon className={cn('w-5 h-5', config.color)} />
                      {!notification.is_read && (
                        <span className={cn('absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full', priority.dot)} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              'text-sm sm:text-base transition-colors',
                              !notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                            )}>
                              {notification.title}
                            </h3>
                            {notification.priority === 'high' && !notification.is_read && (
                              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', priority.badge)}>
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Footer with category and actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                            config.bgColor, config.color
                          )}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>

                        <div className={cn(
                          'flex items-center gap-1 transition-all duration-300',
                          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 sm:opacity-100 sm:translate-x-0'
                        )}>
                          {notification.action_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary" 
                              asChild
                            >
                              <a href={notification.action_url}>
                                View
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-500"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Read</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer stats */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-center gap-6 py-4 text-xs text-muted-foreground">
          <span>{notifications.length} total</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{unreadCount} unread</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{notifications.length - unreadCount} read</span>
        </div>
      )}
    </div>
  )
}
