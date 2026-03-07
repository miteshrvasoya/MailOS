'use client'

import { MailOpen, LogOut, User, Settings as SettingsIcon, LayoutDashboard, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut, signIn } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const pathname = usePathname()
  const { user, userId, isAuthenticated: isLoggedIn, isLoading } = useAuth()
  const isDashboardPage = pathname.startsWith('/dashboard')
  const { theme, setTheme } = useTheme()

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U'

  const handleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleLogout = async () => {
    localStorage.removeItem('mailos_user')
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-16 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="bg-primary text-primary-foreground rounded-xl p-2 transition-all duration-200 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(91,108,255,0.3)]">
            <MailOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">MailOS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            How It Works
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Pricing
          </Link>
          <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Security
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {!isLoggedIn && !isLoading && (
            <Button variant="glow" onClick={handleLogin} className="hidden sm:inline-flex rounded-lg">
              Login / Sign Up
            </Button>
          )}

          {isLoggedIn && (
            <div className="flex items-center gap-3">
              {!isDashboardPage && (
                <Button variant="outline" size="sm" asChild className="rounded-lg">
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center p-0 outline-none hover:bg-primary/20 transition border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{userInitials}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault()
                      handleLogout()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
