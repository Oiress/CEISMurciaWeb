'use client'

import { useRef, useEffect, useState } from 'react'
import { useViewerStore } from '@/store/viewer-store'
import { HIGHLIGHT_COLORS } from './highlight-colors'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import type { Annotation } from '@/types/database'

// A segment is a contiguous run of text where the active highlight set is constant.
interface Segment {
  text: string
  // Sorted oldest→newest (outer→inner for nesting). Empty = plain text.
  highlights: Annotation[]
}

/**
 * Sweepline segmentation: collect every boundary point (range_start / range_end)
 * across all highlights, then for each interval between consecutive boundaries
 * record which highlights are active. This preserves ALL overlaps — no winner
 * picking, no dropping. Highlights with range_start === range_end are ignored.
 */
function buildSegments(text: string, highlights: Annotation[]): Segment[] {
  const valid = highlights.filter(
    (h) => h.range_start !== null && h.range_end !== null && h.range_end > h.range_start
  )

  if (valid.length === 0 || !text) return [{ text, highlights: [] }]

  // Collect all boundary positions within [0, text.length]
  const boundaries = new Set<number>([0, text.length])
  for (const h of valid) {
    if (h.range_start! >= 0 && h.range_start! <= text.length) boundaries.add(h.range_start!)
    if (h.range_end! >= 0 && h.range_end! <= text.length) boundaries.add(h.range_end!)
  }
  const sorted = [...boundaries].sort((a, b) => a - b)

  const segments: Segment[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const to = sorted[i + 1]
    if (from >= to) continue
    const slice = text.slice(from, to)
    if (!slice) continue

    // Which highlights cover this interval? (active if start <= from && end >= to)
    const active = valid
      .filter((h) => h.range_start! <= from && h.range_end! >= to)
      // Sort oldest first → will be outermost <mark>, newest last → innermost
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    segments.push({ text: slice, highlights: active })
  }

  // Append any trailing plain text after the last boundary if needed
  // (already handled because text.length is always a boundary)

  return segments.length > 0 ? segments : [{ text, highlights: [] }]
}

/**
 * Renders a single <mark> layer and recurses for inner layers.
 * The innermost mark receives the click that opens the popover for the
 * most-recent (innermost) highlight.
 */
function NestedMarks({
  text,
  highlights,
  depth,
  onColorChange,
  onDelete,
}: {
  text: string
  highlights: Annotation[]
  depth: number
  onColorChange: (h: Annotation, color: Annotation['color']) => Promise<void>
  onDelete: (h: Annotation) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const current = highlights[depth]
  const bgColor = current.color ? HIGHLIGHT_COLORS[current.color] : HIGHLIGHT_COLORS.yellow
  const isInnermost = depth === highlights.length - 1

  const content = isInnermost ? text : (
    <NestedMarks
      text={text}
      highlights={highlights}
      depth={depth + 1}
      onColorChange={onColorChange}
      onDelete={onDelete}
    />
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <mark
            data-highlight-id={current.id}
            style={{ backgroundColor: bgColor, borderRadius: '2px', cursor: 'pointer' }}
            aria-label="Editar subrayado"
          />
        }
        onClick={(e) => {
          // Only the innermost mark should open its popover on click.
          // Stop propagation so outer marks don't also open.
          if (isInnermost) {
            e.stopPropagation()
          }
        }}
      >
        {content}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1 flex gap-1" side="top" align="start">
        {(['yellow', 'green', 'pink', 'blue'] as const).map((c) => (
          <button
            key={c}
            onClick={() => {
              void onColorChange(current, c)
              setOpen(false)
            }}
            className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: HIGHLIGHT_COLORS[c] }}
            aria-label={`Color ${c}`}
          />
        ))}
        <button
          onClick={() => {
            void onDelete(current)
            setOpen(false)
          }}
          className="ml-1 text-xs text-destructive px-1 hover:bg-destructive/10 rounded"
          aria-label="Eliminar subrayado"
        >
          ✕
        </button>
      </PopoverContent>
    </Popover>
  )
}

export function HighlightRenderer({ pid, children }: { pid: string; children: React.ReactNode }) {
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
        if (seg.highlights.length === 0) return <span key={i}>{seg.text}</span>
        return (
          <NestedMarks
            key={i}
            text={seg.text}
            highlights={seg.highlights}
            depth={0}
            onColorChange={handleColorChange}
            onDelete={handleDelete}
          />
        )
      })}
    </div>
  )
}
