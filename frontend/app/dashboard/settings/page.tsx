'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, Clock, Lock, Trash2, LogOut, AlertTriangle } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

export default function SettingsPage() {
  const { user, userId, signOut } = useAuth()
  const [digestTime, setDigestTime] = useState('09:00')
  const [digestEnabled, setDigestEnabled] = useState(true)
  const [digestFrequency, setDigestFrequency] = useState<'daily' | 'weekly'>('daily')
  const [aiMode, setAiMode] = useState('cloud')
  const [privacyMode, setPrivacyMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean, write_access: boolean } | null>(null)

  // Added state for new settings API
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true)
  const [actionMode, setActionMode] = useState<'review_first' | 'auto_apply'>('review_first')
  const [confidenceThreshold, setConfidenceThreshold] = useState(85)

  // Fetch Gmail Status
  useEffect(() => {
    if (userId) {
      api.get('/gmail/status', { params: { user_id: userId } })
        .then((res: any) => setGmailStatus(res.data))
        .catch((err: any) => console.error(err))

      // Fetch digest settings
      api.get('/digests/settings', { params: { user_id: userId } })
        .then((res: any) => {
          if (res.data) {
            setDigestEnabled(res.data.enabled)
            if (res.data.frequency === 'daily' || res.data.frequency === 'weekly') {
              setDigestFrequency(res.data.frequency)
            }
            if (res.data.time_local) {
              setDigestTime(res.data.time_local)
            }
          }
        })
        .catch((err: any) => console.error('Failed to load digest settings', err))
    }
  }, [userId])

  const handleUpgrade = () => {
    trackEvent({ action: 'enable_auto_labeling', category: 'Settings', label: 'User clicked upgrade' })
    signIn('google', {
      callbackUrl: '/dashboard/settings',
      scope: "openid profile email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify"
    })
  }

  const handleSignOut = () => {
    signOut()
  }

  const handleSaveDigestSettings = async () => {
    if (!userId) return
    try {
      await api.put(
        '/digests/settings',
        {
          enabled: digestEnabled,
          frequency: digestFrequency,
          time_local: digestTime,
        },
        { params: { user_id: userId } },
      )
    } catch (err) {
      console.error('Failed to save digest settings', err)
    }
  }

  const handleSaveUserSettings = async (updates: { auto_fetch_enabled?: boolean; action_mode?: string; confidence_threshold?: number }) => {
    if (!userId) return
    try {
      // If we are updating threshold, convert it back from 85 -> 0.85
      const payload = { ...updates }
      if (payload.confidence_threshold !== undefined) {
        payload.confidence_threshold = payload.confidence_threshold / 100.0
      }

      await api.put('/settings', payload, { params: { user_id: userId } })
    } catch (err) {
      console.error('Failed to update user settings', err)
    }
  }

  const handleDeleteAll = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setDeleting(true)
    try {
      // In production, call API to delete user data
      // await api.delete(`/users/${userId}/data`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      signOut()
    } catch (error) {
      console.error('Failed to delete data:', error)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your MailOS preferences and automation rules.</p>
      </div>

      {/* Account & Synchronization */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
          <Mail className="w-5 h-5 text-primary" />
          Account & Synchronization
        </h2>
        <Card className="divide-y">
          {/* Gmail Connection */}
          <div className="p-6 flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-base">Connected Gmail Account</h3>
              <p className="text-sm text-muted-foreground">{user?.email || 'user@gmail.com'}</p>

              <div className="pt-3 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-md">
                  <div className={`w-2 h-2 rounded-full ${gmailStatus?.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium text-foreground">
                    {gmailStatus?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {gmailStatus?.connected && (
                  <span className={`text-xs px-2 py-1 rounded-md font-medium border ${gmailStatus?.write_access ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                    {gmailStatus?.write_access ? 'Full Access (Read + Write)' : 'Read-Only Access'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button variant="outline" size="sm" onClick={() => signOut()}>Disconnect</Button>
              {gmailStatus?.connected && !gmailStatus?.write_access && (
                <Button size="sm" variant="default" onClick={handleUpgrade} className="bg-primary/90 hover:bg-primary text-xs">
                  Grant Write Access
                </Button>
              )}
            </div>
          </div>

          {/* Periodic Auto Fetch */}
          <div className="p-6 flex items-center justify-between hover:bg-accent/10 transition-colors">
            <div className="space-y-0.5">
              <h3 className="font-medium text-base">Background Email Sync</h3>
              <p className="text-sm text-muted-foreground max-w-lg">
                Automatically fetch and analyze new emails in the background to ensure MailOS is always up to date.
              </p>
            </div>
            <button
              onClick={() => {
                const newStatus = !autoFetchEnabled;
                setAutoFetchEnabled(newStatus);
                handleSaveUserSettings({ auto_fetch_enabled: newStatus });
              }}
              className={`w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${autoFetchEnabled ? 'bg-primary' : 'bg-secondary'} relative cursor-pointer`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${autoFetchEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>

          {/* Digest Settings */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-base">Inbox Digests</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Receive a short, AI-summarized email digest of your inbox so you can quickly scan what matters.
                </p>
              </div>
              <button
                onClick={() => setDigestEnabled(!digestEnabled)}
                className={`w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${digestEnabled ? 'bg-primary' : 'bg-secondary'} relative cursor-pointer`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${digestEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            {digestEnabled && (
              <div className="flex flex-wrap gap-4 items-end bg-accent/20 p-4 rounded-lg mt-2 border border-border/50">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequency</label>
                  <select
                    value={digestFrequency}
                    onChange={(e) => setDigestFrequency(e.target.value as 'daily' | 'weekly')}
                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm shadow-sm focus:outline-none focus:border-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery time</label>
                  <input
                    type="time"
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm shadow-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <Button onClick={handleSaveDigestSettings} size="sm" className="mb-[1px]">Save Preferences</Button>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* AI Intelligence & Automation */}
      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary text-[11px] text-primary-foreground font-bold shadow-sm">AI</span>
          Intelligence & Automation
        </h2>
        <Card className="divide-y">

          {/* Action Mode Segmented Control */}
          <div className="p-6 space-y-4">
            <div className="space-y-0.5">
              <h3 className="font-medium text-base">Inbox Action Mode</h3>
              <p className="text-sm text-muted-foreground">Control how autonomously the AI organizes emails on your behalf.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/40 rounded-lg border">
              <button
                onClick={() => {
                  setActionMode('review_first');
                  handleSaveUserSettings({ action_mode: 'review_first' });
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-all ${actionMode === 'review_first' ? 'bg-background shadow-sm border border-border ring-1 ring-primary/20' : 'hover:bg-background/50 text-muted-foreground'
                  }`}
              >
                <div className={`font-semibold text-sm ${actionMode === 'review_first' ? 'text-primary' : ''}`}>Review First</div>
                <div className="text-xs mt-1 text-center opacity-80">AI suggests, you approve</div>
              </button>

              <button
                onClick={() => {
                  setActionMode('auto_apply');
                  handleSaveUserSettings({ action_mode: 'auto_apply' });
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-all ${actionMode === 'auto_apply' ? 'bg-background shadow-sm border border-border ring-1 ring-primary/20' : 'hover:bg-background/50 text-muted-foreground'
                  }`}
              >
                <div className={`font-semibold text-sm ${actionMode === 'auto_apply' ? 'text-primary' : ''}`}>Auto-Apply</div>
                <div className="text-xs mt-1 text-center opacity-80">AI categorizes seamlessly</div>
              </button>
            </div>

            {/* Threshold Slider (Only relevant if auto_apply or hybrid) */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-Apply Confidence Threshold</label>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                onMouseUp={() => handleSaveUserSettings({ confidence_threshold: confidenceThreshold })}
                onTouchEnd={() => handleSaveUserSettings({ confidence_threshold: confidenceThreshold })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={actionMode !== 'auto_apply'}
                style={{ opacity: actionMode === 'auto_apply' ? 1 : 0.5 }}
              />
              <p className="text-xs text-muted-foreground">
                Automatic workflow actions only trigger when the AI confidence exceeds this threshold.
              </p>
            </div>
          </div>

          {/* AI Mode Segmented Control */}
          <div className="p-6 space-y-4">
            <div className="space-y-0.5">
              <h3 className="font-medium text-base">Processing Engine</h3>
              <p className="text-sm text-muted-foreground">Select where the AI language model executes.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/40 rounded-lg border">
              <button
                onClick={() => setAiMode('cloud')}
                className={`flex justify-center items-center gap-2 p-2.5 rounded-md transition-all ${aiMode === 'cloud' ? 'bg-background shadow-sm border border-border' : 'hover:bg-background/50 text-muted-foreground'
                  }`}
              >
                <span className={`font-medium text-sm ${aiMode === 'cloud' ? 'text-foreground' : ''}`}>Cloud Engine</span>
              </button>

              <button
                onClick={() => setAiMode('local')}
                className={`flex justify-center items-center gap-2 p-2.5 rounded-md transition-all ${aiMode === 'local' ? 'bg-background shadow-sm border border-border' : 'hover:bg-background/50 text-muted-foreground'
                  }`}
              >
                <span className={`font-medium text-sm ${aiMode === 'local' ? 'text-foreground' : ''}`}>Local (On-Device)</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cloud provides maximum accuracy via OpenRouter. Local guarantees raw content never leaves the machine.
            </p>
          </div>
        </Card>
      </section>

      {/* Privacy & Danger Zone */}
      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          Privacy & Data
        </h2>
        <Card className="divide-y overflow-hidden border-destructive/20">

          <div className="p-6 flex items-center justify-between hover:bg-accent/5">
            <div className="space-y-0.5">
              <h3 className="font-medium text-base">Strict Privacy Mode</h3>
              <p className="text-sm text-muted-foreground">Disable all aggregate usage telemetry.</p>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${privacyMode ? 'bg-primary' : 'bg-secondary'} relative cursor-pointer`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${privacyMode ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-accent/5">
            <div className="space-y-0.5">
              <h3 className="font-medium text-base">Current Session</h3>
              <p className="text-sm text-muted-foreground">Securely completely exit your workspace.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSignOut} className="w-24">
              <LogOut className="w-4 h-4 mr-2 opacity-70" /> Sign Out
            </Button>
          </div>

          <div className="p-6 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-base text-destructive">Erase Workspace Data</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Permanently delete all locally cached emails, extracted tasks, and application preferences. This cannot be undone.
                </p>

                {showDeleteConfirm && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-3 w-full">
                      <p className="text-sm font-medium text-destructive">
                        Are you absolutely sure you want to delete everything?
                      </p>
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={deleting}>
                          {deleting ? 'Erasing...' : 'Yes, Delete Everything'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="bg-background">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!showDeleteConfirm && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} className="w-24">
                  <Trash2 className="w-4 h-4 mr-2 opacity-70" /> Delete
                </Button>
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

