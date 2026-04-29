'use client'

import { useRef, useEffect, useState } from 'react'
import { useViewerStore } from '@/store/viewer-store'
import { HIGHLIGHT_COLORS } from './highlight-colors'
import { toast } from 'sonner'
import type { Annotation } from '@/types/database'

interface Segment {
  text: string
  highlight?: Annotation
}

interface HighlightRendererProps {
  pid: string
  children: React.ReactNode
}

function buildSegments(text: string, highlights: Annotation[]): Segment[] {
  if (highlights.length === 0 || !text) return [{ text }]

  // Sort by range_start, then by created_at desc (latest wins for overlaps)
  const sorted = [...highlights]
    .filter((h) => h.range_start !== null && h.range_end !== null)
    .sort((a, b) => {
      if (a.range_start! !== b.range_start!) return a.range_start! - b.range_start!
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const segments: Segment[] = []
  let pos = 0

  for (const h of sorted) {
    const start = h.range_start!
    const end = h.range_end!
    if (start >= text.length || end <= pos) continue
    const clampStart = Math.max(start, pos)
    const clampEnd = Math.min(end, text.length)
    if (clampStart > pos) segments.push({ text: text.slice(pos, clampStart) })
    if (clampEnd > clampStart) segments.push({ text: text.slice(clampStart, clampEnd), highlight: h })
    pos = clampEnd
  }

  if (pos < text.length) segments.push({ text: text.slice(pos) })
  return segments
}

export function HighlightRenderer({ pid, children }: HighlightRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [paragraphText, setParagraphText] = useState<string | null>(null)
  const { annotations, updateAnnotation, removeAnnotation } = useViewerStore()

  const highlights = annotations.filter((a) => a.paragraph_id === pid && a.type === 'highlight')

  useEffect(() => {
    if (wrapperRef.current && paragraphText === null) {
      setParagraphText(wrapperRef.current.textContent ?? '')
    }
  }, [paragraphText])

  async function handleColorChange(highlight: Annotation, color: Annotation['color']) {
    try {
      const res = await fetch(`/api/annotations/${highlight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      })
      if (!res.ok) throw new Error()
      updateAnnotation(highlight.id, { color })
    } catch {
      toast.error('Error al cambiar el color')
    }
  }

  async function handleDelete(highlight: Annotation) {
    try {
      const res = await fetch(`/api/annotations/${highlight.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      removeAnnotation(highlight.id)
    } catch {
      toast.error('Error al eliminar el subrayado')
    }
  }

  if (highlights.length === 0 || paragraphText === null) {
    return <div ref={wrapperRef}>{children}</div>
  }

  const segments = buildSegments(paragraphText, highlights)

  return (
    <div ref={wrapperRef}>
      {segments.map((seg, i) => {
        if (!seg.highlight) return <span key={i}>{seg.text}</span>
        const h = seg.highlight
        const bgColor = h.color ? HIGHLIGHT_COLORS[h.color] : HIGHLIGHT_COLORS.yellow
        return (
          <mark
            key={i}
            data-highlight-id={h.id}
            style={{ backgroundColor: bgColor, cursor: 'pointer' }}
            className="relative group/mark"
            onClick={(e) => {
              e.stopPropagation()
              // Mini popover rendered inline via state
            }}
          >
            {seg.text}
            {/* Mini popover on hover */}
            <span className="hidden group-hover/mark:flex absolute -top-10 left-0 bg-background border rounded shadow-md gap-1 p-1 z-50">
              {(['yellow', 'green', 'pink', 'blue'] as const).map((c) => (
                <button
                  key={c}
                  onClick={(e) => { e.stopPropagation(); void handleColorChange(h, c) }}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: HIGHLIGHT_COLORS[c] }}
                  aria-label={`Color ${c}`}
                />
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); void handleDelete(h) }}
                className="ml-1 text-xs text-destructive px-1"
                aria-label="Eliminar subrayado"
              >
                ✕
              </button>
            </span>
          </mark>
        )
      })}
    </div>
  )
}
