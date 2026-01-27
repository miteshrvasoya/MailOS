import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Shield, Lock, Eye, AlertCircle } from 'lucide-react'

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold">Privacy & Security</h1>
            <p className="text-xl text-muted-foreground">
              Your privacy is our top priority. Learn how we protect your data.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Encryption</h3>
                  <p className="text-muted-foreground">
                    All data is encrypted in transit with TLS 1.3 and at rest with AES-256.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">OAuth Authentication</h3>
                  <p className="text-muted-foreground">
                    We use Google OAuth to securely connect to your Gmail account.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Eye className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Read-Only Access</h3>
                  <p className="text-muted-foreground">
                    MailOS can only read your emails. We cannot send, delete, or modify them.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">No Data Sharing</h3>
                  <p className="text-muted-foreground">
                    Your email data is never shared with third parties or used for training.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">What data we access</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                Email sender, recipient, subject, and body text
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                Email date and labels
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                Basic Gmail profile information (name, email address)
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-6">What we never access</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary">✗</span>
                Gmail passwords
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✗</span>
                Contacts or calendar information
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✗</span>
                Google Drive or other services
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✗</span>
                Attachments (we only process email metadata)
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-6">OAuth Scopes</h2>
            <p className="text-muted-foreground mb-6">
              We request the following Gmail OAuth scopes:
            </p>
            <div className="bg-background rounded-lg p-4 font-mono text-sm space-y-2">
              <p className="text-muted-foreground">gmail.readonly</p>
              <p className="text-muted-foreground">gmail.labels</p>
              <p className="text-muted-foreground">userinfo.email</p>
              <p className="text-muted-foreground">userinfo.profile</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-6">Compliance</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary">✓</span>
                GDPR compliant
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✓</span>
                CCPA compliant
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✓</span>
                SOC 2 Type II certified
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✓</span>
                Regular security audits
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Self-hosted option</h2>
        <p className="text-muted-foreground mb-6">
          For enterprise customers, MailOS can be self-hosted on your own infrastructure. This gives you complete control over your data and eliminates any concerns about third-party storage.
        </p>
        <Button asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </section>
      
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 MailOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
