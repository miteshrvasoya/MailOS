'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Briefcase, Mail, Github as GitHub, ShoppingCart, Lightbulb, Plus, ExternalLink } from 'lucide-react'

const groups = [
  {
    icon: Briefcase,
    name: 'Job Applications',
    count: 47,
    reason: 'Emails from career sites and recruiters',
    color: 'bg-blue-500/20 text-blue-400',
    gmailLabel: 'Label:Jobs'
  },
  {
    icon: Mail,
    name: 'Newsletters',
    count: 234,
    reason: 'Automated newsletter subscriptions',
    color: 'bg-purple-500/20 text-purple-400',
    gmailLabel: 'Label:Newsletters'
  },
  {
    icon: ShoppingCart,
    name: 'Shopping',
    count: 89,
    reason: 'Order confirmations and receipts',
    color: 'bg-green-500/20 text-green-400',
    gmailLabel: 'Label:Shopping'
  },
  {
    icon: GitHub,
    name: 'GitHub Notifications',
    count: 156,
    reason: 'Pull requests and code reviews',
    color: 'bg-gray-500/20 text-gray-400',
    gmailLabel: 'from:notifications@github.com'
  },
  {
    icon: Lightbulb,
    name: 'Product Updates',
    count: 42,
    reason: 'Updates from SaaS tools and apps',
    color: 'bg-yellow-500/20 text-yellow-400',
    gmailLabel: 'Label:ProductUpdates'
  },
]

export default function GroupsPage() {
  const handleOpenInGmail = (gmailLabel: string) => {
    const gmailUrl = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(gmailLabel)}`
    window.open(gmailUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Email Groups</h1>
            <p className="text-muted-foreground">Automatically organized by AI</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-background font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map((group, i) => {
            const Icon = group.icon
            return (
              <Card
                key={i}
                className="p-6 card-hover border-border/50 hover:border-border group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${group.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-background font-semibold"
                    onClick={() => handleOpenInGmail(group.gmailLabel)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in Gmail
                  </Button>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-foreground">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{group.reason}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{group.count}</span>
                    <span className="text-muted-foreground"> emails in this group</span>
                  </div>
                  <span className="text-xs bg-secondary/50 text-muted-foreground px-2 py-1 rounded">
                    Auto-organized
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
