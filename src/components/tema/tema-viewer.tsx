'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { PaywallOverlay } from '@/components/paywall-overlay'
import { useViewerStore } from '@/store/viewer-store'
import { DrawingCanvas } from './drawing-canvas'
import { DrawingToolbar } from './drawing-toolbar'
import { SelectionToolbar } from './selection-toolbar'
import { NoteMarginIcon } from './note-margin-icon'
import { HighlightRenderer } from './highlight-renderer'
import { useProgressTracker } from './progress-tracker'
import { toast } from 'sonner'
import type { Annotation, TocItem } from '@/types/database'
import type { MDXComponents } from 'mdx/types'

interface ContentResponse {
  source: MDXRemoteSerializeResult
  paywalled: boolean
  titulo: string
  temaId: number
  toc: TocItem[]
}

interface TemaViewerProps {
  slug: string
  temaId: number
  userRole: 'guest' | 'free' | 'premium'
  canAnnotate: boolean
}

interface ParagraphProps {
  children?: React.ReactNode
  'data-pid'?: string
  [key: string]: unknown
}

interface SelectionState {
  position: { x: number; y: number }
  pid: string
  rangeStart: number
  rangeEnd: number
}

export function TemaViewer({ slug, temaId, userRole, canAnnotate }: TemaViewerProps) {
  const [data, setData] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const { setAnnotations, setToc, addAnnotation, drawingMode } = useViewerStore()

  const isAuthenticated = userRole !== 'guest'
  useProgressTracker({ temaId, enabled: isAuthenticated })

  // Fetch content
  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/content/${slug}`)
        if (!res.ok) { setError('No se pudo cargar el contenido de este tema.'); return }
        const json = await res.json() as ContentResponse
        setData(json)
        setToc(json.toc ?? [])
      } catch {
        setError('Error de red al cargar el contenido.')
      } finally {
        setLoading(false)
      }
    }
    void fetchContent()
  }, [slug, setToc])

  // Fetch annotations
  useEffect(() => {
    if (!canAnnotate) return
    void fetch(`/api/annotations?temaId=${temaId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { annotations: Annotation[] } | null) => {
        if (d?.annotations) setAnnotations(d.annotations)
      })
  }, [temaId, canAnnotate, setAnnotations])

  // Fetch progress and scroll to last position
  useEffect(() => {
    if (!isAuthenticated) return
    void fetch(`/api/progress/${temaId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((progress: { scroll_percent: number; last_paragraph_id: string | null } | null) => {
        console.log('[progress] loaded', progress)
        const willShow = !!progress && progress.scroll_percent > 5 && !!progress.last_paragraph_id
        console.log('[progress] toast check', {
          lastParagraphId: progress?.last_paragraph_id ?? null,
          scrollPercent: progress?.scroll_percent ?? null,
          willShow,
        })
        if (!willShow) return
        toast('Continuando donde lo dejaste', {
          action: {
            label: 'Ir al inicio',
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
          },
        })
        setTimeout(() => {
          const pid = progress.last_paragraph_id
          if (pid) {
            document.querySelector(`[data-pid="${pid}"]`)?.scrollIntoView({ behavior: 'smooth' })
          }
        }, 800)
      })
  }, [temaId, isAuthenticated])

  // Handle text selection
  const handleSelectionEnd = useCallback(() => {
    if (!canAnnotate || drawingMode) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setSelection(null); return }

    const range = sel.getRangeAt(0)
    const container = contentRef.current
    if (!container || !container.contains(range.commonAncestorContainer)) { setSelection(null); return }

    // Find the closest [data-pid] ancestor
    let node: Node | null = range.commonAncestorContainer
    let pidEl: HTMLElement | null = null
    while (node && node !== container) {
      if (node instanceof HTMLElement && node.dataset.pid) { pidEl = node; break }
      node = node.parentNode
    }
    if (!pidEl) { setSelection(null); return }

    const rect = range.getBoundingClientRect()
    const pid = pidEl.dataset.pid!
    const text = pidEl.textContent ?? ''
    // Approximate character offsets using the selection text
    const selText = sel.toString()
    const rangeStart = text.indexOf(selText)
    if (rangeStart < 0) { setSelection(null); return }

    setSelection({
      position: { x: rect.left + rect.width / 2, y: rect.top },
      pid,
      rangeStart,
      rangeEnd: rangeStart + selText.length,
    })
  }, [canAnnotate, drawingMode])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionEnd)
    document.addEventListener('touchend', handleSelectionEnd)
    return () => {
      document.removeEventListener('mouseup', handleSelectionEnd)
      document.removeEventListener('touchend', handleSelectionEnd)
    }
  }, [handleSelectionEnd])

  async function handleHighlight(color: 'yellow' | 'green' | 'pink' | 'blue') {
    if (!selection) return
    const { pid, rangeStart, rangeEnd } = selection
    setSelection(null)
    window.getSelection()?.removeAllRanges()

    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema_id: temaId,
          paragraph_id: pid,
          type: 'highlight',
          color,
          range_start: rangeStart,
          range_end: rangeEnd,
        }),
      })
      if (!res.ok) throw new Error()
      const { annotation } = await res.json() as { annotation: Annotation }
      addAnnotation(annotation)
    } catch {
      toast.error('Error al guardar el subrayado')
    }
  }

  function handleNoteFromSelection() {
    // Just close toolbar; user needs to use the note icon on the paragraph
    setSelection(null)
    window.getSelection()?.removeAllRanges()
    if (selection) {
      const el = document.querySelector<HTMLElement>(`[data-pid="${selection.pid}"]`)
      if (el) {
        const noteBtn = el.querySelector<HTMLButtonElement>('button[aria-label*="nota"]')
        noteBtn?.click()
      }
    }
  }

  // Custom MDX components
  function makeParagraphComponent(Tag: keyof React.JSX.IntrinsicElements) {
    return function AnnotatableBlock({ children, 'data-pid': pid, ...props }: ParagraphProps) {
      if (!pid) return <Tag {...props}>{children}</Tag>
      return (
        <div className="relative group" data-pid={pid}>
          <NoteMarginIcon pid={pid} temaId={temaId} canAnnotate={canAnnotate} />
          <HighlightRenderer pid={pid}>
            <Tag {...props}>{children}</Tag>
          </HighlightRenderer>
        </div>
      )
    }
  }

  const components: MDXComponents = {
    p: makeParagraphComponent('p') as MDXComponents['p'],
    h1: makeParagraphComponent('h1') as MDXComponents['h1'],
    h2: makeParagraphComponent('h2') as MDXComponents['h2'],
    h3: makeParagraphComponent('h3') as MDXComponents['h3'],
    h4: makeParagraphComponent('h4') as MDXComponents['h4'],
    h5: makeParagraphComponent('h5') as MDXComponents['h5'],
    h6: makeParagraphComponent('h6') as MDXComponents['h6'],
    li: makeParagraphComponent('li') as MDXComponents['li'],
    blockquote: makeParagraphComponent('blockquote') as MDXComponents['blockquote'],
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/5" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-8 text-center text-muted-foreground" role="alert">
        {error ?? 'Contenido no disponible.'}
      </div>
    )
  }

  return (
    <div className="relative">
      <DrawingToolbar />

      <div ref={contentRef} className="relative">
        <DrawingCanvas temaId={temaId} canAnnotate={canAnnotate} />

        <article
          className="prose prose-slate dark:prose-invert max-w-none font-serif
            prose-headings:font-sans prose-headings:font-bold
            prose-a:text-[hsl(15,85%,50%)] prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-[hsl(15,85%,50%)] prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg prose-blockquote:py-0.5"
          aria-label={`Contenido del tema: ${data.titulo}`}
        >
          <MDXRemote {...data.source} components={components} />
        </article>

        {data.paywalled && <PaywallOverlay />}
      </div>

      {selection && (
        <SelectionToolbar
          position={selection.position}
          onHighlight={handleHighlight}
          onNote={handleNoteFromSelection}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  )
}
