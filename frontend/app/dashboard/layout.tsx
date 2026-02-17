'use client'

import React from "react"
import { Sidebar } from '@/components/sidebar'
import { OnboardingGuard } from '@/components/onboarding-guard'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </OnboardingGuard>
    </AuthGuard>
  )
}
