'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DevPromoteClient() {
  const [result, setResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePromote() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/dev/promote', { method: 'POST' })
        const data = (await res.json()) as { success?: boolean; error?: string }
        if (res.ok && data.success) {
          setResult('✅ Cuenta actualizada a premium. Recarga la página de tu cuenta.')
        } else {
          setResult(`❌ Error: ${data.error ?? 'Respuesta inesperada'}`)
        }
      } catch {
        setResult('❌ Error de red al contactar con la API.')
      }
    })
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card className="border-dashed border-orange-400">
        <CardHeader>
          <CardTitle className="text-orange-600">Dev — Promover a Premium</CardTitle>
          <CardDescription>
            Esta página solo está disponible en entorno de desarrollo. Úsala para probar el acceso
            premium sin necesidad de suscripción real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handlePromote}
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending ? 'Procesando...' : 'Actualizar mi cuenta a Premium'}
          </Button>
          {result && (
            <p className="text-sm text-center text-muted-foreground">{result}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
