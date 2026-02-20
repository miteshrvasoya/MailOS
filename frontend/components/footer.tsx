'use client'

import Link from 'next/link'
import { MailOpen, Github, Twitter, Linkedin, ExternalLink } from 'lucide-react'

const SOCIAL_LINKS = {
  product: {
    twitter: 'https://twitter.com/mailos', // Update with actual product Twitter/X
    github: 'https://github.com/mailos', // Update with actual product GitHub
    linkedin: 'https://linkedin.com/company/mailos', // Update with actual product LinkedIn
  },
  developer: {
    twitter: 'https://twitter.com/miteshv', // Update with developer's Twitter/X
    github: 'https://github.com/miteshv', // Update with developer's GitHub
    linkedin: 'https://linkedin.com/in/miteshv', // Update with developer's LinkedIn
  },
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary text-primary-foreground rounded-lg p-2 transition-transform duration-200 group-hover:scale-110">
                <MailOpen className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">MailOS</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Stop missing important emails. Get clarity on top of Gmail.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={SOCIAL_LINKS.product.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="MailOS on Twitter/X"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={SOCIAL_LINKS.product.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="MailOS on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href={SOCIAL_LINKS.product.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="MailOS on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard/digests" className="text-muted-foreground hover:text-foreground transition-colors">
                  Digests
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/terms-and-condition" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Developer</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Built by{' '}
              <a
                href={SOCIAL_LINKS.developer.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Mitesh
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <div className="flex items-center gap-3">
              <a
                href={SOCIAL_LINKS.developer.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Developer on Twitter/X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.developer.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Developer on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.developer.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Developer on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MailOS. All rights reserved.</p>
          <p className="text-xs">
            Read-only by default. We never send or delete emails.
          </p>
        </div>
      </div>
    </footer>
  )
}
