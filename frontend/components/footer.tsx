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
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="bg-primary text-primary-foreground rounded-xl p-2 transition-all duration-200 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <MailOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block leading-none">MailOS</span>
                <span className="text-[10px] font-semibold oss-badge px-1.5 py-0.5 rounded-md inline-block mt-0.5 uppercase tracking-wide">Open Source</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI inbox intelligence on top of Gmail. Read-only. MIT Licensed.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all group"
                aria-label="Star MailOS on GitHub"
              >
                <Star className="w-3.5 h-3.5 text-accent-amber group-hover:fill-accent-amber transition-all" />
                Star on GitHub
              </a>
              <a
                href={SOCIAL_LINKS.product.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="MailOS on Twitter/X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.product.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="MailOS on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard/digests" className="text-muted-foreground hover:text-primary transition-colors">
                  Digests
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Open Source</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repo
                </a>
              </li>
              <li>
                <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Report an Issue
                </a>
              </li>
              <li>
                <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  MIT License
                </a>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-primary transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Developer */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-condition" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
            <div className="pt-3 space-y-1">
              <h3 className="font-semibold text-sm">Built by</h3>
              <a
                href={SOCIAL_LINKS.developer.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Mitesh
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center gap-2 pt-1">
                <a href={SOCIAL_LINKS.developer.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Developer GitHub">
                  <Github className="w-4 h-4" />
                </a>
                <a href={SOCIAL_LINKS.developer.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Developer Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MailOS · MIT License · Open Source</p>
          <p className="text-xs">
            Read-only by default. We never send or delete emails.
          </p>
        </div>
      </div>
    </footer>
  )
}
