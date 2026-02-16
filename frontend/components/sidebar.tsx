'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MailOpen, LayoutGrid, Inbox, Settings, FileText, BarChart3, MessageSquare, Sliders, User, Bell, Sparkles, Reply, AlarmClock, Brain, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'AI Suggestions', href: '/dashboard/suggestions', icon: Sparkles },
  { label: 'Tasks', href: '/dashboard/tasks', icon: ListTodo },
  { label: 'Follow-Ups', href: '/dashboard/follow-ups', icon: Reply },
  { label: 'Snoozed', href: '/dashboard/snoozed', icon: AlarmClock },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Groups', href: '/dashboard/groups', icon: Inbox },
  { label: 'Digests', href: '/dashboard/digests', icon: FileText },
  { label: 'Rules', href: '/dashboard/rules', icon: Sliders },
  { label: 'Insights', href: '/dashboard/insights', icon: BarChart3 },
  { label: 'AI Logs', href: '/dashboard/ai-logs', icon: Brain },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  return (
    <aside className="w-64 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <MailOpen className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">MailOS</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
              onClick={() => trackEvent({
                action: 'navigate',
                category: AnalyticsCategories.NAVIGATION,
                label: item.label
              })}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p>Connected to Gmail</p>
        <p className="mt-1 truncate">{session?.user?.email || 'Not signed in'}</p>
      </div>
    </aside>
  )
}
