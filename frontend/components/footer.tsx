'use client'

import Link from 'next/link'
import { MailOpen, Github, Twitter, Linkedin, ExternalLink, Star } from 'lucide-react'

const GITHUB_URL = 'https://github.com/miteshrvasoya/MailOS'

const SOCIAL_LINKS = {
  product: {
    twitter: 'https://twitter.com/mailos',
    github: GITHUB_URL,
    linkedin: 'https://linkedin.com/company/mailos',
  },
  developer: {
    twitter: 'https://twitter.com/miteshv',
    github: 'https://github.com/miteshv',
    linkedin: 'https://linkedin.com/in/miteshv',
  },
}

export function Footer() {
  return (
    <footer className="relative bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Subtle Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="bg-primary text-primary-foreground rounded-xl p-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] relative overflow-hidden">
                <MailOpen className="w-5 h-5 relative z-10" />
                <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block leading-none">MailOS</span>
                <span className="text-[10px] font-semibold text-accent-emerald bg-accent-emerald/10 px-1.5 py-0.5 rounded-md inline-block mt-0.5 uppercase tracking-wide">Open Source</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              AI inbox intelligence on top of Gmail. Read-only by design. Reclaim 10 hours of your week without changing how you work.
            </p>
            
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-foreground mb-3">Subscribe to updates</h4>
              <form className="flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="flex h-10 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/30"
                />
                <button type="submit" className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 hover:shadow-lg hover:shadow-primary/25 cursor-pointer">
                  Join
                </button>
              </form>
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all group shadow-sm hover:shadow-md"
                aria-label="Star MailOS on GitHub"
              >
                <Star className="w-3.5 h-3.5 text-accent-amber group-hover:fill-accent-amber transition-all" />
                Star on GitHub
              </a>
              <a
                href={SOCIAL_LINKS.product.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                aria-label="MailOS on Twitter/X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.product.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                aria-label="MailOS on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4 lg:ml-auto">
            <h3 className="font-semibold text-sm text-foreground">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard/digests" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Digests
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source */}
          <div className="space-y-4 lg:ml-auto">
            <h3 className="font-semibold text-sm text-foreground">Open Source</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repo
                </a>
              </li>
              <li>
                <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Report an Issue
                </a>
              </li>
              <li>
                <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  MIT License
                </a>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Developer */}
          <div className="space-y-4 lg:ml-auto">
            <h3 className="font-semibold text-sm text-foreground">Legal & Creator</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-condition" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  Terms
                </Link>
              </li>
            </ul>
            
            <div className="p-4 rounded-xl border border-border/50 bg-secondary/30 space-y-2">
              <p className="text-xs text-muted-foreground">Built with 🩵 by</p>
              <a
                href={SOCIAL_LINKS.developer.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
              >
                Mitesh
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <div className="flex items-center gap-3 pt-1">
                <a href={SOCIAL_LINKS.developer.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Developer GitHub">
                  <Github className="w-3.5 h-3.5" />
                </a>
                <a href={SOCIAL_LINKS.developer.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Developer Twitter">
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a href={SOCIAL_LINKS.developer.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Developer LinkedIn">
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MailOS. Open Source.</p>
          <div className="flex items-center gap-2 bg-important/5 text-important px-3 py-1.5 rounded-full border border-important/10 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-important animate-pulse" />
            We never send or delete emails.
          </div>
        </div>
      </div>
    </footer>
  )
}
