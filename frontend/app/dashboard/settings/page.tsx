'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, Clock, Lock, Trash2, LogOut, AlertTriangle } from 'lucide-react'
import { signOut, useSession, signIn } from 'next-auth/react'
import api from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [digestTime, setDigestTime] = useState('09:00')
  const [aiMode, setAiMode] = useState('cloud')
  const [privacyMode, setPrivacyMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [gmailStatus, setGmailStatus] = useState<{connected: boolean, write_access: boolean} | null>(null)

  // Fetch Gmail Status
  useEffect(() => {
    if (session?.user?.id) {
        api.get('/gmail/status', { params: { user_id: session.user.id } })
           .then((res: any) => setGmailStatus(res.data))
           .catch((err: any) => console.error(err))
    }
  }, [session])

  const handleUpgrade = () => {
    trackEvent({ action: 'enable_auto_labeling', category: 'Settings', label: 'User clicked upgrade' })
    signIn('google', { 
        callbackUrl: '/dashboard/settings',
        scope: "openid profile email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify" 
    })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleDeleteAll = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    
    setDeleting(true)
    try {
      // In production, call API to delete user data
      // await api.delete(`/users/${session?.user?.id}/data`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Failed to delete data:', error)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your MailOS preferences</p>
      </div>
      
      {/* Gmail Account */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5" />
              Connected Gmail Account
            </h3>
            <p className="text-muted-foreground">{session?.user?.email || 'user@gmail.com'}</p>
            <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${gmailStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-foreground">
                        {gmailStatus?.connected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                
                {gmailStatus?.connected && (
                    <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded border ${gmailStatus?.write_access ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                            {gmailStatus?.write_access ? 'Full Access (Read + Write)' : 'Read-Only Access'}
                        </span>
                        
                        {!gmailStatus?.write_access && (
                            <Button size="sm" variant="outline" onClick={handleUpgrade}>
                                Enable Auto-Labeling (Grant Write Access)
                            </Button>
                        )}
                    </div>
                )}
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()}>Disconnect</Button>
        </div>
      </Card>
      
      {/* Inbox Action Mode */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">A</span>
            Inbox Action Mode
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Control how AI organizes your emails.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative flex items-start gap-3 rounded-lg border p-4 shadow-sm hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => {}}>
              <input
                type="radio"
                name="action_mode"
                id="review_first"
                defaultChecked={true}
                className="mt-1 h-4 w-4"
              />
              <div className="space-y-1">
                <label htmlFor="review_first" className="font-medium leading-none cursor-pointer">
                  Review first
                </label>
                <p className="text-sm text-muted-foreground">
                  AI suggests labels, but waits for your approval. Best for new users.
                </p>
              </div>
            </div>
            
            <div className="relative flex items-start gap-3 rounded-lg border p-4 shadow-sm hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => {}}>
              <input
                type="radio"
                name="action_mode"
                id="auto_apply"
                className="mt-1 h-4 w-4"
              />
              <div className="space-y-1">
                <label htmlFor="auto_apply" className="font-medium leading-none cursor-pointer">
                  Auto-apply
                </label>
                <p className="text-sm text-muted-foreground">
                  AI automatically organizes emails with high confidence. Zero friction.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Confidence Threshold</label>
              <span className="text-sm text-muted-foreground">85%</span>
            </div>
            <input 
              type="range" 
              min="70" 
              max="100" 
              defaultValue="85" 
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
            />
            <p className="text-xs text-muted-foreground">
              Only apply actions automatically when AI confidence is above 85%.
            </p>
          </div>
        </div>
      </Card>
      
      {/* AI Mode */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Processing Mode</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="cloud"
              name="ai-mode"
              value="cloud"
              checked={aiMode === 'cloud'}
              onChange={(e) => setAiMode(e.target.value)}
              className="w-4 h-4"
            />
            <label htmlFor="cloud" className="flex-1 cursor-pointer">
              <p className="font-medium">Cloud AI</p>
              <p className="text-sm text-muted-foreground">Faster, more intelligent processing</p>
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="local"
              name="ai-mode"
              value="local"
              checked={aiMode === 'local'}
              onChange={(e) => setAiMode(e.target.value)}
              className="w-4 h-4"
            />
            <label htmlFor="local" className="flex-1 cursor-pointer">
              <p className="font-medium">Local AI</p>
              <p className="text-sm text-muted-foreground">Maximum privacy, runs on your device</p>
            </label>
          </div>
        </div>
      </Card>
      
      {/* Digest Time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" />
          Digest Delivery Time
        </h3>
        <div className="flex gap-4">
          <input
            type="time"
            value={digestTime}
            onChange={(e) => setDigestTime(e.target.value)}
            className="px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button>Save</Button>
        </div>
      </Card>
      
      {/* Privacy Mode */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5" />
          Privacy Mode
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium mb-1">Strict Privacy</p>
            <p className="text-sm text-muted-foreground">
              Disable all analytics and tracking
            </p>
          </div>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`w-12 h-6 rounded-full transition-colors ${
              privacyMode ? 'bg-primary' : 'bg-secondary'
            } relative`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                privacyMode ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            ></div>
          </button>
        </div>
      </Card>
      
      {/* Data Management */}
      <Card className="p-6 border-destructive/30">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Delete all data</p>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all your cached emails and settings. This cannot be undone.
            </p>
            {showDeleteConfirm ? (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Are you sure? This action cannot be undone.</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAll}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="destructive" onClick={handleDeleteAll}>
                Delete Everything
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Logout */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5" />
          Session
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Log out of your account and return to the home page.
        </p>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </Card>
    </div>
  )
}

