'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Edit2, Eye } from 'lucide-react'

const digests = [
  {
    id: 1,
    name: 'Daily Digest',
    time: '9:00 AM',
    sections: ['Work', 'Finance', 'Personal'],
    frequency: 'Daily'
  },
  {
    id: 2,
    name: 'Weekly Digest',
    time: 'Monday 9:00 AM',
    sections: ['Newsletters', 'Updates', 'Shopping'],
    frequency: 'Weekly'
  },
]

const digestPreview = `
DAILYMAIOS DIGEST
Monday, January 13, 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 WORK (8 new)

Your flight is confirmed - TK487
From: Sarah Chen

Q4 Planning Meeting - Tomorrow 2pm
From: Engineering Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 FINANCE (3 new)

Payment received - Invoice #12847
From: Stripe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📰 NEWSLETTERS (12 new)

The Week in Tech #487
From: Tech Today
`

export default function DigestsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Email Digests</h1>
            <p className="text-muted-foreground">Receive organized summaries of your emails</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Digest
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Existing Digests */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your digests</h2>
            {digests.map((digest) => (
              <Card key={digest.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">{digest.name}</h3>
                    <p className="text-sm text-muted-foreground">{digest.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Preview">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">SECTIONS</p>
                  <div className="flex flex-wrap gap-2">
                    {digest.sections.map((section, i) => (
                      <span
                        key={i}
                        className="text-xs bg-secondary px-2 py-1 rounded"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Digest Preview */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Digest Preview</h2>
            <Card className="p-6 bg-secondary/20 border-dashed">
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap overflow-auto max-h-96">
                {digestPreview}
              </pre>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
