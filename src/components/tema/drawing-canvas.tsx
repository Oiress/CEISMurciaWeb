'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useViewerStore } from '@/store/viewer-store'
import { useDebounce } from 'use-debounce'
import type { Stroke } from '@/types/database'

interface DrawingCanvasProps {
  temaId: number
  canAnnotate: boolean
}

export function DrawingCanvas({ temaId, canAnnotate }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const currentPoints = useRef<Array<{ x: number; y: number }>>([])

  const { drawingMode, activeTool, strokes, setStrokes } = useViewerStore()
  const [debouncedStrokes] = useDebounce(strokes, 2000)

  // Repaint all strokes on the canvas
  const repaint = useCallback((canvas: HTMLCanvasElement, allStrokes: Stroke[]) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue
      ctx.save()
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = 20
        ctx.globalAlpha = 1
      } else if (stroke.tool === 'marker') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.lineWidth = 12
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = '#facc15'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.lineWidth = stroke.width
        ctx.globalAlpha = 1
        ctx.strokeStyle = stroke.color
      }
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (const pt of stroke.points.slice(1)) ctx.lineTo(pt.x, pt.y)
      ctx.stroke()
      ctx.restore()
    }
  }, [])

  // Sync canvas size with container using ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      repaint(canvas, strokes)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [strokes, repaint])

  // Repaint when strokes change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    repaint(canvas, strokes)
  }, [strokes, repaint])

  // Debounced save
  useEffect(() => {
    if (!canAnnotate || debouncedStrokes.length === 0) return
    void fetch(`/api/drawings/${temaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strokes: debouncedStrokes }),
    })
  }, [debouncedStrokes, temaId, canAnnotate])

  // Fetch existing strokes on mount
  useEffect(() => {
    if (!canAnnotate) return
    void fetch(`/api/drawings/${temaId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { strokes: Stroke[] } | null) => {
        if (data?.strokes?.length) setStrokes(data.strokes)
      })
  }, [temaId, canAnnotate, setStrokes])

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingMode) return
    isDrawing.current = true
    const pos = getPos(e)
    if (pos) currentPoints.current = [pos]
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current || !drawingMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(e)
    if (!pos) return
    currentPoints.current.push(pos)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pts = currentPoints.current
    if (pts.length < 2) return

    ctx.save()
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 20
      ctx.globalAlpha = 1
    } else if (activeTool === 'marker') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 12
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = '#facc15'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 2
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#1e293b'
    }
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.stroke()
    ctx.restore()
  }

  function endDraw() {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentPoints.current.length > 1) {
      const newStroke: Stroke = {
        tool: activeTool,
        color: activeTool === 'pen' ? '#1e293b' : '#facc15',
        width: activeTool === 'pen' ? 2 : 12,
        points: currentPoints.current,
      }
      setStrokes([...strokes, newStroke])
    }
    currentPoints.current = []
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: drawingMode ? 10 : 0 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: drawingMode && canAnnotate ? 'auto' : 'none', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  )
}
