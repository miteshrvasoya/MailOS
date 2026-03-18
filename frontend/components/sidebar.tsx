'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MailOpen, LayoutGrid, Inbox, Settings, FileText, BarChart3, MessageSquare, Sliders, User, Bell, Sparkles, Reply, AlarmClock, Brain, ListTodo, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

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
  const { user, userId } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="w-64 border-r border-border bg-card/50 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="bg-primary text-primary-foreground rounded-xl p-2 transition-all duration-200 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(91,108,255,0.3)]">
            <MailOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">MailOS</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              )}
              onClick={() => trackEvent({
                action: 'navigate',
                category: AnalyticsCategories.NAVIGATION,
                label: item.label
              })}
            >
              <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg h-8 w-8"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>

        {/* Connected status */}
        <div className="px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-important animate-pulse" />
            <p className="text-xs text-muted-foreground">Connected to Gmail</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{user?.email || 'Not signed in'}</p>
        </div>
      </div>
    </aside>
  )
}
