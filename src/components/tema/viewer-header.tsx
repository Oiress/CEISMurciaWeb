'use client'

import Link from 'next/link'
import { ArrowLeft, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useViewerStore } from '@/store/viewer-store'

interface ViewerHeaderProps {
  titulo: string
  canAnnotate: boolean
}

export function ViewerHeader({ titulo, canAnnotate }: ViewerHeaderProps) {
  const { drawingMode, setDrawingMode } = useViewerStore()

  return (
    <div className="mb-8 flex items-center gap-4">
      <Link href="/temas" aria-label="Volver al listado de temas">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <h1 className="flex-1 text-2xl font-bold leading-snug font-sans">{titulo}</h1>
      {canAnnotate && (
        <Button
          variant={drawingMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDrawingMode(!drawingMode)}
          className="gap-1.5 shrink-0"
        >
          <PenLine className="h-4 w-4" />
          {drawingMode ? 'Salir modo dibujo' : 'Modo dibujo'}
        </Button>
      )}
    </div>
  )
}
