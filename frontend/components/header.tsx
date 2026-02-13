'use client'

import { MailOpen, LogOut, User, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { signOut, useSession, signIn } from 'next-auth/react'
import { useEffect } from 'react'
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
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user
  const isDashboardPage = pathname.startsWith('/dashboard')
  
  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U'

  // Sync session to localStorage for fast hydration
  useEffect(() => {
    if (isLoggedIn && session?.user) {
      localStorage.setItem('mailos_user', JSON.stringify({
        name: session.user.name,
        email: session.user.email,
        id: session.user.id,
      }))
    } else if (status === 'unauthenticated') {
      localStorage.removeItem('mailos_user')
    }
  }, [isLoggedIn, session, status])

  const handleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleLogout = () => {
    localStorage.removeItem('mailos_user')
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-16 px-6 flex items-center justify-between">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground rounded-lg p-2 transition-transform duration-200 group-hover:scale-110">
            <MailOpen className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">MailOS</span>
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
        
        {!isLoggedIn && status !== 'loading' && (
          <div className="flex items-center gap-3">
            <Button variant="glow" onClick={handleLogin} className="hidden sm:inline-flex">
              Login / Sign Up
            </Button>
          </div>
        )}
        
        {isLoggedIn && (
          <div className="flex items-center gap-4">
            {!isDashboardPage && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-secondary flex items-center justify-center p-0 outline-none hover:bg-secondary/80 transition">
                  <span className="text-xs font-semibold">{userInitials}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
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
                  className="text-red-600 focus:text-red-700 cursor-pointer"
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
    </header>
  )
}
