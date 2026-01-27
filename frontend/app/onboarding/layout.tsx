import { ReactNode } from 'react'
import { MailOpen } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <MailOpen className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">MailOS</span>
        </Link>
      </header>
      
      <main className="flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  )
}
