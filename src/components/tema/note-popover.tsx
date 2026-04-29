'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useViewerStore } from '@/store/viewer-store'
import { toast } from 'sonner'
import type { Annotation } from '@/types/database'

interface NotePopoverProps {
  pid: string
  temaId: number
  existingNote?: Annotation
  canAnnotate: boolean
  onClose: () => void
  children: React.ReactNode
}

export function NotePopover({ pid, temaId, existingNote, canAnnotate, onClose, children }: NotePopoverProps) {
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addAnnotation, updateAnnotation, removeAnnotation } = useViewerStore()

  if (!canAnnotate) return <>{children}</>

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setContent(existingNote?.content ?? '')
      onClose()
    }
  }

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    try {
      if (existingNote) {
        const res = await fetch(`/api/annotations/${existingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        if (!res.ok) throw new Error('Error al guardar')
        const { annotation } = await res.json() as { annotation: Annotation }
        updateAnnotation(existingNote.id, annotation)
      } else {
        const res = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tema_id: temaId, paragraph_id: pid, type: 'note', content }),
        })
        if (!res.ok) throw new Error('Error al guardar')
        const { annotation } = await res.json() as { annotation: Annotation }
        addAnnotation(annotation)
      }
      setOpen(false)
      onClose()
    } catch {
      toast.error('Error al guardar la nota')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existingNote) return
    setSaving(true)
    try {
      const res = await fetch(`/api/annotations/${existingNote.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      removeAnnotation(existingNote.id)
      setOpen(false)
      onClose()
    } catch {
      toast.error('Error al eliminar la nota')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<span className="contents" />}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="left">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {existingNote ? 'Editar nota' : 'Nueva nota'}
          </p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            className="min-h-[120px] resize-none"
            maxLength={5000}
          />
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
            </div>
            {existingNote && (
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={saving}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
