'use client'

// Force rebuild

import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTasks, createTask, updateTask, Task } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

import { useAuth } from '@/hooks/useAuth'

export default function TasksPage() {
  const { userId } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      loadTasks()
    }
  }, [userId])

  const loadTasks = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getTasks(userId)
      setTasks(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !userId) return

    try {
      const task = await createTask(userId, { title: newTaskTitle, status: 'pending', priority: 'medium' })
      setTasks([task, ...tasks])
      setNewTaskTitle('')
      toast({ title: 'Task created' })
    } catch (e) {
      toast({ title: 'Failed to create task', variant: 'destructive' })
    }
  }

  const toggleStatus = async (task: Task) => {
    if (!userId) return
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    
    try {
      await updateTask(userId, task.id, { status: newStatus })
    } catch (e) {
      toast({ title: 'Failed to update task', variant: 'destructive' })
      loadTasks() // Revert
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input 
          placeholder="Add a new task..." 
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </form>

      <div className="space-y-2">
        {loading ? (
           <div className="text-center text-muted-foreground p-8">Loading tasks...</div>
        ) : tasks.length === 0 ? (
           <div className="text-center text-muted-foreground p-8">No tasks yet. Process some emails or add one!</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card hover:bg-secondary/50 transition">
              <button onClick={() => toggleStatus(task)} className="text-muted-foreground hover:text-primary transition">
                {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1">
                <p className={task.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium'}>
                  {task.title}
                </p>
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.due_date), 'MMM d')}
                  </div>
                )}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full border ${
                task.priority === 'high' ? 'border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' :
                task.priority === 'low' ? 'border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
                'border-gray-200 text-gray-600 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400'
              }`}>
                {task.priority}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
