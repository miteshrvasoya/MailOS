'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MailOpen, LayoutGrid, Inbox, Settings, FileText, BarChart3, MessageSquare, Sliders, User, Bell, Sparkles, Reply, AlarmClock, Brain, ListTodo, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { trackEvent, AnalyticsCategories } from '@/lib/analytics'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'AI Suggestions', href: '/dashboard/suggestions', icon: Sparkles, badge: 'New' },
      { label: 'Tasks', href: '/dashboard/tasks', icon: ListTodo, badge: '3' },
      { label: 'Follow-Ups', href: '/dashboard/follow-ups', icon: Reply, badge: '1' },
      { label: 'Snoozed', href: '/dashboard/snoozed', icon: AlarmClock },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    ]
  },
  {
    label: 'Management',
    items: [
      { label: 'Groups', href: '/dashboard/groups', icon: Inbox },
      { label: 'Digests', href: '/dashboard/digests', icon: FileText },
      { label: 'Rules', href: '/dashboard/rules', icon: Sliders },
      { label: 'Insights', href: '/dashboard/insights', icon: BarChart3 },
      { label: 'AI Logs', href: '/dashboard/ai-logs', icon: Brain },
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <aside className="w-[260px] border-r border-border bg-card/40 backdrop-blur-md h-screen sticky top-0 flex flex-col hide-scrollbar shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="bg-primary text-primary-foreground rounded-xl p-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] relative overflow-hidden">
            <MailOpen className="w-5 h-5 relative z-10" />
            <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
          </div>
          <span className="font-bold text-lg tracking-tight">MailOS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-4 custom-scrollbar pt-2">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className="animate-reveal-up" style={{ animationDelay: `${groupIdx * 100}ms` }}>
            <h4 className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
              {group.label}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      'group/item flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
                    )}
                    onClick={() => trackEvent({
                      action: 'navigate',
                      category: AnalyticsCategories.NAVIGATION,
                      label: item.label
                    })}
                  >
                    {/* Hover highlight line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary/40 rounded-r-full transition-all duration-300 group-hover/item:h-1/2" />
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-primary rounded-r-full" />}
                    
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        "w-4 h-4 transition-transform duration-200 group-hover/item:scale-110", 
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                        item.badge === 'New' 
                          ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/20" 
                          : isActive 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-border/50 bg-secondary/30 mt-auto">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-card border border-transparent hover:border-border/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-xs font-bold text-primary">{userInitials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'Not connected'}</p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }}
            className="rounded-lg h-8 w-8 flex-shrink-0 opacity-50 hover:opacity-100"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
