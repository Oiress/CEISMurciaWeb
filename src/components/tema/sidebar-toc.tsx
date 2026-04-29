'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, List, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useViewerStore } from '@/store/viewer-store'
import type { Annotation, TocItem } from '@/types/database'

interface SidebarTocProps {
  canAnnotate: boolean
}

function TocContent({ canAnnotate }: { canAnnotate: boolean }) {
  const toc = useViewerStore((s) => s.toc)
  const annotations = useViewerStore((s) => s.annotations)
  const [tab, setTab] = useState<'toc' | 'notes'>('toc')

  const notes = annotations.filter((a) => a.type === 'note')

  function scrollToHeading(pid: string, headingText: string) {
    // find by id (slugified heading text)
    const slug = headingText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
    const el = document.getElementById(slug) ?? document.querySelector(`[data-pid="${pid}"]`)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToParagraph(pid: string) {
    document.querySelector(`[data-pid="${pid}"]`)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setTab('toc')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'toc' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-3.5 w-3.5" />
          Índice
        </button>
        {canAnnotate && (
          <button
            onClick={() => setTab('notes')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'notes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Notas {notes.length > 0 && <span className="ml-0.5 text-xs">({notes.length})</span>}
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {tab === 'toc' ? (
          <nav className="p-3 space-y-0.5">
            {toc.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4">Sin índice disponible</p>
            )}
            {toc.map((item: TocItem, i: number) => (
              <button
                key={i}
                onClick={() => scrollToHeading(item.pid, item.text)}
                className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors truncate"
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              >
                {item.text}
              </button>
            ))}
          </nav>
        ) : (
          <div className="p-3 space-y-2">
            {notes.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4">Sin notas todavía</p>
            )}
            {notes.map((note: Annotation) => (
              <button
                key={note.id}
                onClick={() => scrollToParagraph(note.paragraph_id)}
                className="w-full text-left p-2 rounded border hover:bg-muted transition-colors"
              >
                <p className="text-xs text-muted-foreground mb-0.5">
                  {new Date(note.created_at).toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm line-clamp-3">{note.content}</p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export function SidebarToc({ canAnnotate }: SidebarTocProps) {
  const [open, setOpen] = useLocalStorage('sidebar-left', true)

  // Mobile sheet
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger className="fixed bottom-4 left-4 z-30 inline-flex items-center justify-center rounded-md border bg-background p-2 shadow-md hover:bg-muted">
            <List className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <TocContent canAnnotate={canAnnotate} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r bg-background transition-all duration-200 overflow-hidden ${
          open ? 'w-[280px]' : 'w-0'
        }`}
      >
        <TocContent canAnnotate={canAnnotate} />
      </aside>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-background border border-l-0 rounded-r-md p-1 shadow-sm hover:bg-muted transition-colors"
        style={{ left: open ? '280px' : '0px' }}
        aria-label={open ? 'Cerrar índice' : 'Abrir índice'}
      >
        {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </>
  )
}
