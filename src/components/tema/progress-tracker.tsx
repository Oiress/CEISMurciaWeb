'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseProgressTrackerOptions {
  temaId: number
  enabled: boolean
}

interface ProgressState {
  scrollPercent: number
  lastPid: string | null
}

export function useProgressTracker({ temaId, enabled }: UseProgressTrackerOptions): ProgressState {
  const [state, setState] = useState<ProgressState>({ scrollPercent: 0, lastPid: null })
  const lastSaved = useRef<ProgressState>({ scrollPercent: -1, lastPid: undefined as unknown as null })

  const getScrollPercent = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    if (scrollHeight <= 0) return 0
    return Math.round(Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100)))
  }, [])

  const getMostCenteredPid = useCallback(() => {
    const mid = window.innerHeight / 2
    const elements = document.querySelectorAll<HTMLElement>('[data-pid]')
    let best: string | null = null
    let bestDist = Infinity
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const elMid = rect.top + rect.height / 2
      const dist = Math.abs(elMid - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = el.dataset.pid ?? null
      }
    })
    return best
  }, [])

  useEffect(() => {
    if (!enabled) return

    const update = () => {
      const scrollPercent = getScrollPercent()
      const lastPid = getMostCenteredPid()
      setState({ scrollPercent, lastPid })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [enabled, getScrollPercent, getMostCenteredPid])

  // Save every 5 seconds if changed
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      const { scrollPercent, lastPid } = state
      const prev = lastSaved.current
      if (scrollPercent === prev.scrollPercent && lastPid === prev.lastPid) return

      lastSaved.current = { scrollPercent, lastPid }
      void fetch(`/api/progress/${temaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scroll_percent: scrollPercent, last_paragraph_id: lastPid }),
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [enabled, temaId, state])

  return state
}
