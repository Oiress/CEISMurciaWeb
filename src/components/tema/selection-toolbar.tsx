'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { HIGHLIGHT_COLORS } from './highlight-colors'
import { MessageSquare } from 'lucide-react'

interface SelectionToolbarProps {
  position: { x: number; y: number }
  onHighlight: (color: keyof typeof HIGHLIGHT_COLORS) => void
  onNote: () => void
  onClose: () => void
}

export function SelectionToolbar({ position, onHighlight, onNote, onClose }: SelectionToolbarProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [onClose])

  const toolbar = (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1.5"
      style={{ left: position.x, top: position.y - 48, transform: 'translateX(-50%)' }}
    >
      {(['yellow', 'green', 'pink', 'blue'] as const).map((color) => (
        <button
          key={color}
          onMouseDown={(e) => { e.preventDefault(); onHighlight(color) }}
          className="w-5 h-5 rounded-full border-2 border-border hover:scale-110 transition-transform"
          style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
          aria-label={`Subrayar en ${color}`}
        />
      ))}
      <div className="w-px h-4 bg-border mx-0.5" />
      <button
        onMouseDown={(e) => { e.preventDefault(); onNote() }}
        className="flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:bg-muted transition-colors"
        aria-label="Añadir nota"
      >
        <MessageSquare className="h-3 w-3" />
        Nota
      </button>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(toolbar, document.body)
}
