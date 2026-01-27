'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export default function NewRulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(0)
  
  const [conditions, setConditions] = useState([
    { field: 'sender', operator: 'contains', value: '' }
  ])
  
  const [actions, setActions] = useState({
    move_to_category: 'none',
    mark_important: false,
    mark_read: false,
    stop_processing: false
  })

  // Options
  const fieldOptions = [
    { value: 'sender', label: 'Sender' },
    { value: 'subject', label: 'Subject' },
    { value: 'body', label: 'Body Content' },
    { value: 'category', label: 'AI Category' },
    { value: 'importance_score', label: 'Importance Score (>)' },
  ]

  const operatorOptions = [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
  ]

  const categoryOptions = [
     // TODO: Fetch from config or constant
     'Work', 'Personal', 'Finance', 'Updates', 'Promotions', 'Social'
  ]

  const addCondition = () => {
    setConditions([...conditions, { field: 'sender', operator: 'contains', value: '' }])
  }

  const removeCondition = (index: number) => {
    const newConditions = [...conditions]
    newConditions.splice(index, 1)
    setConditions(newConditions)
  }

  const updateCondition = (index: number, key: string, val: string) => {
    const newConditions = [...conditions]
    // @ts-ignore
    newConditions[index][key] = val
    setConditions(newConditions)
  }

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", description: "Please give your rule a name", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Clean up actions
      const finalActions: any = {}
      if (actions.move_to_category && actions.move_to_category !== 'none') {
        finalActions.move_to_category = actions.move_to_category
      }
      if (actions.mark_important) finalActions.mark_important = true
      if (actions.mark_read) finalActions.mark_read = true
      if (actions.stop_processing) finalActions.stop_processing = true

      const payload = {
        name,
        description,
        priority: Number(priority),
        conditions: { all: conditions },
        actions: finalActions,
        is_active: true
      }
      
      await api.post('/rules', payload)
      
      toast({ title: "Rule created", description: "Your automation rule is live." })
      router.push('/dashboard/rules')
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to create rule", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/rules">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Rule</h2>
          <p className="text-muted-foreground">Define conditions and actions to automate your inbox.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Mark invoices from Stripe as important" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input 
                id="description" 
                placeholder="What does this rule do?" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="priority" 
                  type="number" 
                  className="w-24"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">Higher priority rules run first.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>If ALL of these conditions match...</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addCondition} className="gap-2">
              <Plus className="w-4 h-4" /> Add Condition
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex gap-4 items-end bg-muted/30 p-4 rounded-lg">
                <div className="grid gap-2 flex-1">
                  <Label>Field</Label>
                  <Select value={cond.field} onValueChange={(val) => updateCondition(idx, 'field', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2 flex-1">
                  <Label>Operator</Label>
                  <Select value={cond.operator} onValueChange={(val) => updateCondition(idx, 'operator', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 flex-[2]">
                  <Label>Value</Label>
                  <Input 
                    value={cond.value} 
                    onChange={(e) => updateCondition(idx, 'value', e.target.value)} 
                    placeholder="Value to match..."
                  />
                </div>

                <Button variant="ghost" size="icon" className="mb-0.5 text-muted-foreground hover:text-red-500" onClick={() => removeCondition(idx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>...then do this.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <Label className="text-base">Move to Category</Label>
                <div className="text-sm text-muted-foreground">Automatically organize into a folder</div>
              </div>
              <Select 
                value={actions.move_to_category} 
                onValueChange={(val) => setActions({...actions, move_to_category: val})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't move</SelectItem>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <Label className="text-base">Mark as Important</Label>
                <div className="text-sm text-muted-foreground">Prioritize this email</div>
              </div>
              <Switch 
                checked={actions.mark_important} 
                onCheckedChange={(checked) => setActions({...actions, mark_important: checked})} 
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
               <div className="space-y-0.5">
                <Label className="text-base">Mark as Read</Label>
                <div className="text-sm text-muted-foreground">Archive without notification</div>
              </div>
              <Switch 
                checked={actions.mark_read} 
                onCheckedChange={(checked) => setActions({...actions, mark_read: checked})} 
              />
            </div>
            
            <div className="flex items-center justify-between">
               <div className="space-y-0.5">
                <Label className="text-base text-red-500">Stop Processing</Label>
                <div className="text-sm text-muted-foreground">Don't apply subsequent rules</div>
              </div>
              <Switch 
                checked={actions.stop_processing} 
                onCheckedChange={(checked) => setActions({...actions, stop_processing: checked})} 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-10">
          <Link href="/dashboard/rules">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={loading} className="px-8">
            {loading ? "Saving..." : "Save Rule"}
          </Button>
        </div>
      </div>
    </div>
  )
}
