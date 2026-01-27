'use client'

import { MailOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const isAuthenticated = pathname.startsWith('/dashboard')
  
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="h-16 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <MailOpen className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">MailOS</span>
        </Link>
        
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition">
              Pricing
            </Link>
            <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition">
              Security
            </Link>
            <Link href="/extension-install" className="text-sm text-muted-foreground hover:text-foreground transition">
              Chrome Extension
            </Link>
          </nav>
        )}
        
        {!isAuthenticated && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="#waitlist">Join Waitlist</Link>
            </Button>
          </div>

        )}
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
              M
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
