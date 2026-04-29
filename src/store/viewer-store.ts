import { create } from 'zustand'
import type { Annotation, Stroke, TocItem } from '@/types/database'

interface ViewerState {
  // Drawing
  drawingMode: boolean
  setDrawingMode: (v: boolean) => void
  activeTool: 'pen' | 'marker' | 'eraser'
  setActiveTool: (tool: 'pen' | 'marker' | 'eraser') => void

  // Sidebars
  leftSidebarOpen: boolean
  setLeftSidebarOpen: (v: boolean) => void
  rightSidebarOpen: boolean
  setRightSidebarOpen: (v: boolean) => void

  // Annotations
  annotations: Annotation[]
  setAnnotations: (annotations: Annotation[]) => void
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void

  // Summary
  summary: string
  setSummary: (content: string) => void

  // Strokes
  strokes: Stroke[]
  setStrokes: (strokes: Stroke[]) => void

  // TOC (populated after content loads)
  toc: TocItem[]
  setToc: (toc: TocItem[]) => void
}

export const useViewerStore = create<ViewerState>((set) => ({
  drawingMode: false,
  setDrawingMode: (v) => set({ drawingMode: v }),

  activeTool: 'pen',
  setActiveTool: (tool) => set({ activeTool: tool }),

  leftSidebarOpen: true,
  setLeftSidebarOpen: (v) => set({ leftSidebarOpen: v }),

  rightSidebarOpen: true,
  setRightSidebarOpen: (v) => set({ rightSidebarOpen: v }),

  annotations: [],
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
  updateAnnotation: (id, patch) =>
    set((state) => ({
      annotations: state.annotations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),
  removeAnnotation: (id) =>
    set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),

  summary: '',
  setSummary: (content) => set({ summary: content }),

  strokes: [],
  setStrokes: (strokes) => set({ strokes }),

  toc: [],
  setToc: (toc) => set({ toc }),
}))
