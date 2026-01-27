'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { User, Mail, Calendar, Hash } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string
  created_at: string
  is_active: boolean
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.email) {
        try {
          const res = await api.get(`/users/by-email/${session.user.email}`)
          setProfile(res.data)
        } catch (error) {
          console.error("Failed to fetch profile", error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchProfile()
  }, [session])

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-8 text-red-500">Failed to load profile.</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-primary">
              {profile.full_name?.charAt(0) || profile.email.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile.full_name}</h2>
              <p className="text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <div className="p-3 bg-secondary/50 rounded-md font-mono text-sm">
                {profile.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <div className="p-3 bg-secondary/50 rounded-md text-sm">
                {profile.full_name || 'Not set'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="w-4 h-4" /> User ID
              </label>
              <div className="p-3 bg-secondary/50 rounded-md font-mono text-xs text-muted-foreground truncate">
                {profile.id}
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Account Created
              </label>
              <div className="p-3 bg-secondary/50 rounded-md text-sm">
                {new Date(profile.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign Out
        </Button>
      </div>
    </div>
  )
}
