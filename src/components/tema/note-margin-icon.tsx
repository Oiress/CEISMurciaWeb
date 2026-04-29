'use client'

import { useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { useViewerStore } from '@/store/viewer-store'
import { NotePopover } from './note-popover'

interface NoteMarginIconProps {
  pid: string
  temaId: number
  canAnnotate: boolean
}

export function NoteMarginIcon({ pid, temaId, canAnnotate }: NoteMarginIconProps) {
  const [open, setOpen] = useState(false)
  const annotations = useViewerStore((s) => s.annotations)

  if (!canAnnotate) return null

  const existingNote = annotations.find((a) => a.paragraph_id === pid && a.type === 'note')

  return (
    <NotePopover
      pid={pid}
      temaId={temaId}
      existingNote={existingNote}
      canAnnotate={canAnnotate}
      onClose={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(true)}
        className={`
          absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full
          transition-opacity duration-150
          ${existingNote
            ? 'opacity-100 text-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground bg-muted'
          }
        `}
        aria-label={existingNote ? 'Ver/editar nota' : 'Añadir nota'}
      >
        {existingNote ? <MessageSquare className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      </button>
    </NotePopover>
  )
}
