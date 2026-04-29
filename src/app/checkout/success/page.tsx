'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 30000

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'polling' | 'activated' | 'timeout'>('polling')

  useEffect(() => {
    if (!sessionId) { setStatus('timeout'); return }

    const start = Date.now()

    const poll = async () => {
      try {
        const res = await fetch('/api/me')
        if (res.ok) {
          const data = await res.json() as { role: string }
          if (data.role === 'premium') { setStatus('activated'); return }
        }
      } catch { /* network error — keep polling */ }

      if (Date.now() - start >= POLL_TIMEOUT_MS) {
        setStatus('timeout')
        return
      }

      setTimeout(() => { void poll() }, POLL_INTERVAL_MS)
    }

    void poll()
  }, [sessionId])

  if (status === 'polling') {
    return (
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-5xl mb-6 animate-pulse">⏳</p>
        <h1 className="text-2xl font-bold mb-3">Activando tu suscripción…</h1>
        <p className="text-muted-foreground">
          Tu pago se ha procesado correctamente. Estamos activando tu acceso premium.
          Esto solo tarda unos segundos.
        </p>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-5xl mb-6">🕐</p>
        <h1 className="text-2xl font-bold mb-3">Tu suscripción se está procesando</h1>
        <p className="text-muted-foreground mb-6">
          El pago se realizó correctamente pero la activación está tardando más de lo normal.
          Recarga la página en unos segundos o escríbenos si el problema persiste.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recargar
          </Button>
          <Button render={<Link href="/temas" />}>Ir a los temas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl mb-6">🎉</p>
      <h1 className="text-2xl font-bold mb-3">¡Bienvenido a CEIS Murcia Premium!</h1>
      <p className="text-muted-foreground mb-8">
        Ya tienes acceso completo a todo el temario, apuntes ilimitados, subrayados y notas.
      </p>
      <Button size="lg" render={<Link href="/temas" />}>Ir a los temas</Button>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-5xl mb-6 animate-pulse">⏳</p>
        <h1 className="text-2xl font-bold mb-3">Activando tu suscripción…</h1>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
