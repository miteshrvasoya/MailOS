'use client'

import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap, Lock, Filter, Brain, Settings, LayoutDashboard } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
            Your inbox, finally intelligent.
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            AI that understands your emails, prioritizes what matters, and sends you daily clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" variant="glow" asChild className="group">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="glow" onClick={handleGoogleSignIn} className="group">
                <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fbbc05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ea4335"/>
                </svg>
                Login / Sign Up with Google
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </section>
      
      {/* Problem Section */}
      <section id="features" className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Stop drowning in email.</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Before MailOS</h3>
                <div className="bg-background rounded-lg p-6 space-y-2 text-sm text-muted-foreground">
                  <p>📧 873 unread emails</p>
                  <p>⚠️ Mixed newsletters & important mail</p>
                  <p>⏰ Hours spent sorting & filtering</p>
                  <p>❌ Missing critical messages</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">After MailOS</h3>
                <div className="bg-secondary rounded-lg p-6 space-y-2 text-sm">
                  <p>✅ 47 important emails highlighted</p>
                  <p>📂 5 smart groups created automatically</p>
                  <p>⚡ 15 minutes to inbox clarity</p>
                  <p>🎯 Never miss a critical message</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-xl p-8 border border-border">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between p-3 hover:bg-secondary rounded transition">
                  <span>Welcome to MailOS!</span>
                  <span>Now</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded">
                  <span className="font-medium">Your flight is confirmed - TK487</span>
                  <span className="text-xs">2h</span>
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-secondary rounded transition">
                  <span>Weekly newsletter #42</span>
                  <span>4h</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded">
                  <span className="font-medium">Quarterly review meeting tomorrow</span>
                  <span className="text-xs">5h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-xl font-semibold">Connect Gmail</h3>
            <p className="text-muted-foreground">
              Give MailOS read-only access to your inbox. We never send emails or modify your messages.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-xl font-semibold">AI understands your mail</h3>
            <p className="text-muted-foreground">
              Our AI learns what matters to you, grouping emails intelligently and ranking by importance.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-xl font-semibold">Receive daily digest</h3>
            <p className="text-muted-foreground">
              Get one clear, concise email each morning summarizing what needs your attention.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works in Gmail */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How MailOS works in Gmail</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            We analyze your emails to provide insights and organization, but your emails stay in Gmail. We only store statistics and insights.
          </p>

          <div className="space-y-12">
            {/* Data Flow */}
            <div>
              <h3 className="text-2xl font-semibold mb-8">Data Flow</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-background rounded-lg p-6 border border-border">
                    <h4 className="font-semibold mb-3 text-primary">What we receive from Gmail</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Email metadata (sender, subject, timestamp)</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Email content for analysis only</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Labels and categories you've created</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Read/unread status</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-background rounded-lg p-6 border border-border">
                    <h4 className="font-semibold mb-3 text-primary">What we store in our database</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Email statistics (count, sender patterns)</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>AI classification tags and insights</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Your custom groups and rules</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Digest preferences and settings</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-background rounded-lg p-6 border border-destructive/20">
                <h4 className="font-semibold mb-3 text-destructive">What we NEVER store</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <p>✗ Your actual emails or full content</p>
                  <p>✗ Email attachments</p>
                  <p>✗ Passwords or credentials</p>
                  <p>✗ Any personally identifiable information</p>
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div>
              <h3 className="text-2xl font-semibold mb-8">How the Integration Works</h3>
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-6 border border-border">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Read-Only Gmail Access</h4>
                      <p className="text-sm text-muted-foreground">
                        You authorize MailOS with read-only access to Gmail via OAuth. We can only read your emails, never modify, delete, or send them.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6 border border-border">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Real-Time Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        When you sync, we analyze your emails using AI to classify them by category, importance, and relevance. The analysis happens securely in our servers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6 border border-border">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Dashboard Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        The MailOS dashboard displays statistics, insights, and automated categories based on the analysis. The actual emails remain in Gmail.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6 border border-border">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Daily Digest Emails</h4>
                      <p className="text-sm text-muted-foreground">
                        We send you one daily email summarizing the insights and important messages. You can act on them directly in Gmail.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why This Matters */}
            <div>
              <h3 className="text-2xl font-semibold mb-8">Why This Approach</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Maximum Privacy</h4>
                  <p className="text-sm text-muted-foreground">
                    Your emails stay in Gmail where you expect them. We only process and store insights, not the actual content.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Zero Data Silos</h4>
                  <p className="text-sm text-muted-foreground">
                    All your emails remain in Gmail with full search and access. MailOS enhances it without storing your mail.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Always in Control</h4>
                  <p className="text-sm text-muted-foreground">
                    Revoke access anytime. All insights and preferences are stored separately and can be deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI Classification',
                description: 'Automatically categorizes emails by type and importance.'
              },
              {
                icon: Filter,
                title: 'Smart Grouping',
                description: 'Groups related emails together for easy browsing.'
              },
              {
                icon: Zap,
                title: 'Digest Engine',
                description: 'Create personalized daily digests with your rules.'
              },
              {
                icon: Settings,
                title: 'Custom Rules',
                description: 'Set up filters and routing rules without code.'
              },
              {
                icon: Shield,
                title: 'Privacy First',
                description: 'Read-only access, encrypted, and no data sharing.'
              },
              {
                icon: Lock,
                title: 'Self-Hosted',
                description: 'Run MailOS on your own infrastructure if you prefer.'
              }
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* Trust Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Built with trust</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We take your privacy seriously. Here's what we do and don't do.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-500">What we do</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Read your emails to understand and classify them</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Encrypt data in transit and at rest</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Keep all data within your account</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-destructive">What we don't do</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span>✗</span>
                  <span>Send emails on your behalf</span>
                </li>
                <li className="flex gap-3">
                  <span>✗</span>
                  <span>Share your data with third parties</span>
                </li>
                <li className="flex gap-3">
                  <span>✗</span>
                  <span>Train models on your personal emails</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Chrome Extension Section - Hidden for now */}

      {/* CTA */}
      <section id="waitlist" className="px-6 py-24 bg-card border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">{isLoggedIn ? 'Welcome back!' : 'Ready for inbox clarity?'}</h2>
            <p className="text-muted-foreground text-lg">
              {isLoggedIn 
                ? 'Your intelligent inbox is waiting for you.' 
                : 'Join hundreds of productivity-focused professionals already using MailOS.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" variant="glow" asChild className="group">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="glow" onClick={handleGoogleSignIn} className="group">
                <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fbbc05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ea4335"/>
                </svg>
                Login / Sign Up with Google
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 MailOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
