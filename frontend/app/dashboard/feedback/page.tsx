'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, Lightbulb, MessageSquare } from 'lucide-react'

const feedbackOptions = [
  {
    icon: AlertCircle,
    title: 'Report wrong classification',
    description: 'Tell us if an email was classified incorrectly',
    color: 'text-red-400'
  },
  {
    icon: Lightbulb,
    title: 'Suggest a feature',
    description: 'Share ideas to improve MailOS',
    color: 'text-yellow-400'
  },
  {
    icon: MessageSquare,
    title: 'Send general feedback',
    description: 'Tell us what you think about MailOS',
    color: 'text-blue-400'
  },
]

export default function FeedbackPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    console.log('Feedback submitted:', { type: selectedType, message })
    setMessage('')
    setSelectedType(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Feedback</h1>
          <p className="text-muted-foreground">Help us improve MailOS</p>
        </div>
        
        {/* Feedback Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {feedbackOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.title}
                onClick={() => setSelectedType(option.title)}
                className={`p-6 rounded-lg border-2 transition text-left ${
                  selectedType === option.title
                    ? 'border-primary bg-secondary'
                    : 'border-border hover:border-secondary bg-card'
                }`}
              >
                <Icon className={`w-6 h-6 mb-3 ${option.color}`} />
                <h3 className="font-semibold mb-2">{option.title}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </button>
            )
          })}
        </div>
        
        {/* Feedback Form */}
        {selectedType && (
          <Card className="p-8">
            <h2 className="text-xl font-semibold mb-6">{selectedType}</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email (optional)</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32"
                />
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleSubmit}>Send Feedback</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedType(null)
                    setMessage('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {/* Help Section */}
        {!selectedType && (
          <Card className="p-8 bg-secondary/20 border-dashed">
            <h2 className="text-lg font-semibold mb-4">We value your feedback</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback helps us make MailOS better. Whether it's a bug report, feature request, or general comment, we'd love to hear from you.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span>•</span>
                <span>Be specific about what you're experiencing</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Include steps to reproduce if reporting a bug</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Share your use case for feature requests</span>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
