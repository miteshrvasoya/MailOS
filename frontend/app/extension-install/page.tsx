'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Download, Laptop, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ExtensionInstallPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="px-6 py-20 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl font-bold">Chrome Extension Installation</h1>
          <p className="text-xl text-muted-foreground">Quick access to MailOS from your browser</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Official Installation */}
          <Card className="p-8 card-hover border-border/50 hover:border-border">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                <Laptop className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-foreground">Chrome Web Store (Recommended)</h2>
                <p className="text-muted-foreground mb-4">Install from the official Chrome Web Store for automatic updates and easy management.</p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">Automatic updates</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">Official verification</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">Easy management</p>
                </div>
              </div>

              <Button size="lg" asChild className="w-full bg-primary hover:bg-primary/90 text-background font-semibold">
                <a 
                  href="https://chrome.google.com/webstore" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Get from Chrome Web Store
                </a>
              </Button>

              <p className="text-xs text-muted-foreground text-center">Coming soon to Chrome Web Store</p>
            </div>
          </Card>

          {/* Developer Mode Installation */}
          <Card className="p-8 card-hover border-border/50 hover:border-border">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-lg bg-secondary/50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-foreground/60" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-2 text-foreground">Developer Mode (Manual)</h2>
                <p className="text-muted-foreground mb-4">For advanced users or during beta testing. Manual installation and updates required.</p>
              </div>

              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Steps:</p>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Open <code className="bg-secondary/50 px-2 py-1 rounded text-foreground">chrome://extensions/</code></li>
                  <li>2. Enable "Developer mode" (top right toggle)</li>
                  <li>3. Click "Load unpacked"</li>
                  <li>4. Select the extension folder from your MailOS installation</li>
                </ol>
              </div>

              <Button size="lg" variant="outline" asChild className="w-full bg-transparent">
                <a 
                  href="/extension/README.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Installation Guide
                </a>
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">What you get</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '📊',
                title: 'Dashboard Access',
                description: 'One-click access to your full MailOS dashboard from anywhere'
              },
              {
                icon: '📁',
                title: 'Email Groups',
                description: 'Quickly view and manage your auto-organized email groups'
              },
              {
                icon: '📈',
                title: 'Instant Insights',
                description: 'Check email analytics and AI-generated insights in seconds'
              },
              {
                icon: '⚙️',
                title: 'Rules Management',
                description: 'Create and edit email handling rules on the fly'
              },
              {
                icon: '🌐',
                title: 'Website Links',
                description: 'Quick access to MailOS website and support pages'
              },
              {
                icon: '🔔',
                title: 'Notifications',
                description: 'Get notified about important email insights and actions'
              },
            ].map((feature, idx) => (
              <Card key={idx} className="p-6 card-hover border-border/50 hover:border-border">
                <div className="space-y-2">
                  <p className="text-3xl">{feature.icon}</p>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>

          <Card className="p-6 border-border/50">
            <h3 className="font-semibold text-foreground mb-2">Is the extension safe to use?</h3>
            <p className="text-muted-foreground">Yes, the extension only connects to your MailOS dashboard and your Gmail account (read-only). It never stores your emails or sensitive data locally.</p>
          </Card>

          <Card className="p-6 border-border/50">
            <h3 className="font-semibold text-foreground mb-2">Does it work on other browsers?</h3>
            <p className="text-muted-foreground">Currently, we only offer Chrome and Chrome-based browsers (Edge, Brave, etc.). We're working on Firefox and Safari support.</p>
          </Card>

          <Card className="p-6 border-border/50">
            <h3 className="font-semibold text-foreground mb-2">Can I use it offline?</h3>
            <p className="text-muted-foreground">The extension requires an internet connection to connect to MailOS and Gmail. It won't work offline.</p>
          </Card>

          <Card className="p-6 border-border/50">
            <h3 className="font-semibold text-foreground mb-2">How do I update the extension?</h3>
            <p className="text-muted-foreground">Updates are automatic when installed from Chrome Web Store. For manual installations, you'll need to manually download and install new versions.</p>
          </Card>

          <Card className="p-6 border-border/50">
            <h3 className="font-semibold text-foreground mb-2">How do I uninstall it?</h3>
            <p className="text-muted-foreground">Right-click the MailOS extension icon and select "Remove from Chrome" or go to chrome://extensions/ and click the trash icon.</p>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="p-8 bg-card border-border/50">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Need help?</h2>
            <p className="text-muted-foreground">If you encounter any issues or have questions, we're here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
              <Button asChild variant="outline">
                <Link href="/security">View Documentation</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-background font-semibold">
                <a href="mailto:support@mailos.app">Contact Support</a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
