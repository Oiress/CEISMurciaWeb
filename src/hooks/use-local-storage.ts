// Simple hook for persisting UI state (sidebar open/closed) in localStorage.
// NOT for auth or annotation data.
'use client'

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        setValue(JSON.parse(stored) as T)
      }
    } catch {
      // ignore parse errors
    }
  }, [key])

  const set = (v: T) => {
    setValue(v)
    try {
      window.localStorage.setItem(key, JSON.stringify(v))
    } catch {
      // ignore storage errors
    }
  }

  return [value, set]
}
