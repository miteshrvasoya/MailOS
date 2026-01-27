'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Plus, Settings2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Rule {
  id: string
  name: string
  description: string
  priority: number
  is_active: boolean
  conditions: any
  actions: any
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const res = await api.get('/rules')
      setRules(res.data)
    } catch (e) {
      console.error("Failed to fetch rules", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-muted-foreground mt-2">
            Create custom rules to organize your inbox exactly how you want.
          </p>
        </div>
        <Link href="/dashboard/rules/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Rule
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Settings2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rules yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start automating your workflow by creating your first rule.
            </p>
            <Link href="/dashboard/rules/new">
                <Button variant="outline">Create your first rule</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline">Priority {rule.priority}</Badge>
                  </div>
                  <CardDescription>{rule.description || "No description provided"}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                   {/* We could summarize conditions here like "If sender contains @foo..." */}
                   <p>{Object.keys(rule.conditions.all || {}).length} conditions defined.</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
