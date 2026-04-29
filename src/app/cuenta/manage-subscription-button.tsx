'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        toast.error('No se pudo abrir el portal de suscripción. Inténtalo de nuevo.')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Error de red. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => void handleClick()}
      disabled={loading}
    >
      {loading ? 'Cargando…' : 'Gestionar suscripción'}
    </Button>
  )
}
