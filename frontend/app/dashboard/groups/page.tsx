'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  Plus, Pin, PinOff, Trash2, Pencil, X, Check,
  Briefcase, DollarSign, Shield, BookOpen, Tag,
  ShoppingCart, User, Plane, Mail, ArrowUp, ArrowDown,
  Loader2, Sparkles
} from 'lucide-react'

interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  display_order: number
  is_pinned: boolean
  created_at: string
}

const ICON_MAP: Record<string, any> = {
  Briefcase, DollarSign, Shield, BookOpen, Tag,
  ShoppingCart, User, Plane, Mail,
}

const COLOR_OPTIONS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7',
  '#ec4899', '#06b6d4', '#14b8a6', '#8b5cf6', '#f97316',
]

function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Tag
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // New category form
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [newIcon, setNewIcon] = useState('Tag')

  // Edit form
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const { data: session } = useSession()
  const { toast } = useToast()
  const userId = (session?.user as any)?.id

  const fetchCategories = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await api.get(`/categories?user_id=${userId}`)
      setCategories(res.data)
    } catch (e) {
      console.error('Failed to fetch categories', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchCategories()
    }
  }, [userId, fetchCategories])

  // Seed defaults if none exist
  const handleSeedDefaults = async () => {
    if (!userId) return
    try {
      const res = await api.post('/categories/seed', { user_id: userId })
      setCategories(res.data)
      toast({ title: 'Categories created', description: 'Default categories have been set up.' })
    } catch (e) {
      console.error('Failed to seed', e)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !userId) return
    try {
      const res = await api.post('/categories', {
        user_id: userId,
        name: newName.trim(),
        color: newColor,
        icon: newIcon,
      })
      setCategories(prev => [...prev, res.data])
      setNewName('')
      setNewColor('#6366f1')
      setNewIcon('Tag')
      setCreating(false)
      toast({ title: 'Category created', description: `"${res.data.name}" is ready.` })
    } catch (e) {
      console.error('Failed to create', e)
      toast({ title: 'Error', description: 'Failed to create category.', variant: 'destructive' })
    }
  }

  const handleTogglePin = async (cat: Category) => {
    try {
      const res = await api.patch(`/categories/${cat.id}`, { is_pinned: !cat.is_pinned })
      setCategories(prev => prev.map(c => c.id === cat.id ? res.data : c))
      toast({
        title: res.data.is_pinned ? 'Pinned' : 'Unpinned',
        description: `"${cat.name}" ${res.data.is_pinned ? 'will appear at the top' : 'has been unpinned'}.`,
      })
    } catch (e) {
      console.error('Failed to toggle pin', e)
    }
  }

  const handleDelete = async (cat: Category) => {
    try {
      await api.delete(`/categories/${cat.id}`)
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      toast({ title: 'Deleted', description: `"${cat.name}" has been removed.` })
    } catch (e) {
      console.error('Failed to delete', e)
      toast({ title: 'Error', description: 'Failed to delete category.', variant: 'destructive' })
    }
  }

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    try {
      const res = await api.patch(`/categories/${editingId}`, {
        name: editName.trim(),
        color: editColor,
      })
      setCategories(prev => prev.map(c => c.id === editingId ? res.data : c))
      setEditingId(null)
      toast({ title: 'Updated', description: `Category renamed to "${editName.trim()}".` })
    } catch (e) {
      console.error('Failed to update', e)
    }
  }

  const handleMove = async (cat: Category, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === cat.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === categories.length - 1)) return

    const newCategories = [...categories]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = newCategories[idx].display_order
    newCategories[idx].display_order = newCategories[swapIdx].display_order
    newCategories[swapIdx].display_order = temp

    // Swap in array
    ;[newCategories[idx], newCategories[swapIdx]] = [newCategories[swapIdx], newCategories[idx]]
    setCategories(newCategories)

    try {
      await api.post('/categories/reorder', {
        items: newCategories.map((c, i) => ({ id: c.id, display_order: i })),
      })
    } catch (e) {
      console.error('Failed to reorder', e)
      fetchCategories() // revert
    }
  }

  const pinnedCategories = categories.filter(c => c.is_pinned)
  const unpinnedCategories = categories.filter(c => !c.is_pinned)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground mt-2">
            Organize your inbox with custom categories. Pinned categories appear at the top of your dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && !loading && (
            <Button variant="outline" onClick={handleSeedDefaults} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Load Defaults
            </Button>
          )}
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        </div>
      </div>

      {/* Create New Category */}
      {creating && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4 px-5 space-y-4">
            <h3 className="font-semibold">Create New Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Side Projects"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(ICON_MAP).map(([name, Icon]) => (
                    <button
                      key={name}
                      className={`p-2 rounded-lg border transition-all ${
                        newIcon === name
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setNewIcon(name)}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create Category</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Load the default categories or create your own to organize your emails.
            </p>
            <Button variant="outline" onClick={handleSeedDefaults} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Load Default Categories
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pinned Categories */}
          {pinnedCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pinned ({pinnedCategories.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedCategories.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    editing={editingId === cat.id}
                    editName={editName}
                    editColor={editColor}
                    onEditName={setEditName}
                    onEditColor={setEditColor}
                    onStartEdit={() => handleStartEdit(cat)}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onTogglePin={() => handleTogglePin(cat)}
                    onDelete={() => handleDelete(cat)}
                    onMoveUp={() => handleMove(cat, 'up')}
                    onMoveDown={() => handleMove(cat, 'down')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Other Categories */}
          {unpinnedCategories.length > 0 && (
            <div className="space-y-3">
              {pinnedCategories.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Other Categories ({unpinnedCategories.length})
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedCategories.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    editing={editingId === cat.id}
                    editName={editName}
                    editColor={editColor}
                    onEditName={setEditName}
                    onEditColor={setEditColor}
                    onStartEdit={() => handleStartEdit(cat)}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onTogglePin={() => handleTogglePin(cat)}
                    onDelete={() => handleDelete(cat)}
                    onMoveUp={() => handleMove(cat, 'up')}
                    onMoveDown={() => handleMove(cat, 'down')}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


// ─── Category Card Component ─────────────────────────────────────

interface CategoryCardProps {
  cat: Category
  editing: boolean
  editName: string
  editColor: string
  onEditName: (v: string) => void
  onEditColor: (v: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onTogglePin: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function CategoryCard({
  cat, editing, editName, editColor,
  onEditName, onEditColor,
  onStartEdit, onSaveEdit, onCancelEdit,
  onTogglePin, onDelete, onMoveUp, onMoveDown,
}: CategoryCardProps) {
  const Icon = getIconComponent(cat.icon)

  if (editing) {
    return (
      <Card className="border-primary/30">
        <CardContent className="pt-5 pb-4 px-5 space-y-3">
          <Input
            value={editName}
            onChange={e => onEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSaveEdit()}
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  editColor === color ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onEditColor(color)}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={onSaveEdit}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-border">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold">{cat.name}</h4>
              <div className="flex items-center gap-1.5 mt-1">
                {cat.is_pinned && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                    <Pin className="w-2.5 h-2.5 mr-0.5" /> Pinned
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Move up" onClick={onMoveUp}>
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Move down" onClick={onMoveDown}>
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title={cat.is_pinned ? 'Unpin' : 'Pin'} onClick={onTogglePin}>
              {cat.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Rename" onClick={onStartEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-500" title="Delete" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
