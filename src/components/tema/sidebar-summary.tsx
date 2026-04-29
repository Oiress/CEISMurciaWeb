'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useViewerStore } from '@/store/viewer-store'
import { useDebounce } from 'use-debounce'

interface SidebarSummaryProps {
  temaId: number
  canAnnotate: boolean
}

export function SidebarSummary({ temaId, canAnnotate }: SidebarSummaryProps) {
  const [open, setOpen] = useLocalStorage('sidebar-right', true)
  const { summary, setSummary } = useViewerStore()
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [debouncedSummary] = useDebounce(summary, 1000)
  const [initialLoaded, setInitialLoaded] = useState(false)

  // Fetch existing summary
  useEffect(() => {
    if (!canAnnotate) return
    void fetch(`/api/summaries/${temaId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { content: string } | null) => {
        if (data) setSummary(data.content ?? '')
        setInitialLoaded(true)
      })
  }, [temaId, canAnnotate, setSummary])

  // Autosave
  useEffect(() => {
    if (!canAnnotate || !initialLoaded) return
    setStatus('saving')
    void fetch(`/api/summaries/${temaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: debouncedSummary }),
    })
      .then((r) => {
        setStatus(r.ok ? 'saved' : 'error')
      })
      .catch(() => setStatus('error'))
  }, [debouncedSummary, temaId, canAnnotate, initialLoaded])

  const statusText = {
    idle: '',
    saving: 'Guardando...',
    saved: 'Guardado ✓',
    error: 'Error al guardar',
  }[status]

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 border-l bg-background transition-all duration-200 overflow-hidden ${
        open ? 'w-[320px]' : 'w-0'
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-background border border-r-0 rounded-l-md p-1 shadow-sm hover:bg-muted transition-colors"
        style={{ right: open ? '320px' : '0px' }}
        aria-label={open ? 'Cerrar resumen' : 'Abrir resumen'}
      >
        {open ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="flex flex-col h-full p-4 space-y-3">
        {/* Tabs */}
        <div className="flex border-b">
          <span className="px-3 py-2 text-sm font-medium border-b-2 border-primary text-primary">
            Mi resumen
          </span>
          <button
            disabled
            className="px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-60"
            title="Disponible en próxima fase"
          >
            Chat IA
          </button>
        </div>

        {!canAnnotate ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-2 text-muted-foreground">
            <p className="text-sm">Hazte premium para acceder al resumen propio</p>
          </div>
        ) : (
          <>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Escribe tu resumen de este tema..."
              className="flex-1 resize-none"
              style={{ minHeight: '300px', maxHeight: '1000px', whiteSpace: 'pre-wrap' }}
              maxLength={10000}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{summary.length}/10000</span>
              <span className={status === 'error' ? 'text-destructive' : ''}>{statusText}</span>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
