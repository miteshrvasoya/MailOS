'use client'

import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { MailOpen, Loader2 } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking auth or redirecting
  if (status === 'loading' || (status === 'authenticated' && session?.user)) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="inline-flex justify-center">
              <div className="bg-primary text-primary-foreground rounded-lg p-3">
                <MailOpen className="w-6 h-6" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Welcome to MailOS</h1>
            <p className="text-muted-foreground">
              Your inbox, finally intelligent.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              className="w-full h-12 text-base bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900" 
              variant="outline"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Or continue with email (coming soon)
              </span>
            </div>
          </div>
          
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p>
              Don&apos;t have an account? We&apos;ll create one automatically when you sign in.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
