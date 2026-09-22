'use client'

import { useState, useEffect } from 'react'
import { MailOpen, LogOut, User, Settings as SettingsIcon, LayoutDashboard, Sun, Moon, Star, GitFork, Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut, signIn } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

const GITHUB_URL = 'https://github.com/miteshrvasoya/MailOS'

export function Header() {
  const pathname = usePathname()
  const { user, userId, isAuthenticated: isLoggedIn, isLoading } = useAuth()
  const isDashboardPage = pathname.startsWith('/dashboard')
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    <header 
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm py-2" 
          : "bg-transparent py-4"
      )}
    >
      <div className="px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Logo + OSS badge */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r border-border">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="p-6 border-b border-border flex items-center gap-2.5">
                <div className="bg-primary text-primary-foreground rounded-xl p-2">
                  <MailOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight">MailOS</span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-secondary/80 rounded-xl transition-colors">
                  Features
                </Link>
                <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-secondary/80 rounded-xl transition-colors">
                  How It Works
                </Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-secondary/80 rounded-xl transition-colors">
                  Pricing
                </Link>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-sm font-medium hover:bg-secondary/80 rounded-xl transition-colors flex items-center gap-2">
                  <GitFork className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </SheetContent>
          </Sheet>

          <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="bg-primary text-primary-foreground rounded-xl p-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] relative">
              <MailOpen className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-lg tracking-tight">MailOS</span>
            {!isLoggedIn && (
              <span className="hidden sm:inline-flex items-center tag-pill bg-primary/10 text-primary border border-primary/20 shadow-none">
                Beta
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {[
            { label: 'Features', href: '/features' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Pricing', href: '/pricing' }
          ].map((item) => (
            <Link 
              key={item.label}
              href={item.href} 
              className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium flex items-center gap-1.5 group"
          >
            <GitFork className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
            GitHub
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full" />
          </a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* GitHub star — desktop only */}
          {!isLoggedIn && (
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card hover:bg-secondary hover:border-border transition-all duration-200 text-sm font-medium text-muted-foreground hover:text-foreground group animate-badge-glow"
              aria-label="Star MailOS on GitHub"
            >
              <Star className="w-3.5 h-3.5 text-accent-amber group-hover:fill-accent-amber transition-all" />
              <span>Star</span>
            </a>
          )}

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
            <Button variant="glow" onClick={handleLogin} className="hidden sm:inline-flex rounded-lg text-sm px-4">
              Sign In
            </Button>
          )}

          {isLoggedIn && (
            <div className="flex items-center gap-3">
              {!isDashboardPage && (
                <Button variant="outline" size="sm" asChild className="rounded-lg hidden sm:flex">
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
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
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
                  <DropdownMenuItem asChild>
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                      <Star className="mr-2 h-4 w-4 text-accent-amber" />
                      <span>Star on GitHub</span>
                    </a>
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
