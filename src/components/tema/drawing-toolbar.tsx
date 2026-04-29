'use client'

import { useState } from 'react'
import { Pencil, Highlighter, Eraser, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useViewerStore } from '@/store/viewer-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function DrawingToolbar() {
  const { drawingMode, setDrawingMode, activeTool, setActiveTool, setStrokes } = useViewerStore()
  const [confirmClear, setConfirmClear] = useState(false)

  if (!drawingMode) return null

  function clearDrawing() {
    setStrokes([])
    setConfirmClear(false)
  }

  const tools = [
    { id: 'pen' as const, label: 'Lápiz', icon: Pencil },
    { id: 'marker' as const, label: 'Marcador', icon: Highlighter },
    { id: 'eraser' as const, label: 'Goma', icon: Eraser },
  ]

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-2 bg-background/95 backdrop-blur border-b px-4 py-2">
        {tools.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTool === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool(id)}
            className="gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmClear(true)}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpiar dibujo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDrawingMode(false)}
          className="gap-1.5 ml-auto"
        >
          <X className="h-3.5 w-3.5" />
          Salir del modo dibujo
        </Button>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpiar dibujo</DialogTitle>
            <DialogDescription>
              Se eliminarán todos los trazos de este tema. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={clearDrawing}>Limpiar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
