'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const BENEFITS = [
  'Acceso a todos los temas publicados',
  'Apuntes ilimitados',
  'Subrayado y notas',
  'Chat IA con tutor experto (próximamente)',
  'Cancela cuando quieras',
]

const PLANS = [
  {
    id: 'monthly' as const,
    label: 'Mensual',
    price: '12 €',
    period: '/mes',
    badge: null,
    description: 'Pago mensual, sin permanencia.',
  },
  {
    id: 'yearly' as const,
    label: 'Anual',
    price: '96 €',
    period: '/año',
    badge: 'Ahorra 33%',
    description: '8 €/mes — dos meses gratis frente al mensual.',
  },
]

interface PricingCardsProps {
  isAuthenticated: boolean
  role: string | null
}

export function PricingCards({ isAuthenticated, role }: PricingCardsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

  const isPremium = role === 'premium'

  async function handleSubscribe(plan: 'monthly' | 'yearly') {
    if (!isAuthenticated) {
      router.push('/login?next=/precios')
      return
    }

    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        const message =
          typeof data.error === 'string'
            ? data.error
            : 'No se pudo iniciar el proceso de pago. Inténtalo de nuevo.'
        toast.error(message)
        return
      }

      window.location.href = data.url
    } catch {
      toast.error('Error de red. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('monthly') // reuse loading state; any non-null value shows spinner
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        toast.error('No se pudo abrir el portal de suscripción.')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={plan.id === 'yearly' ? 'border-primary ring-1 ring-primary' : ''}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{plan.label}</CardTitle>
              {plan.badge && (
                <Badge className="bg-[hsl(15,85%,50%)] text-white border-0 text-xs">
                  {plan.badge}
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <ul className="space-y-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground font-medium">
                  ✓ Ya eres premium
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void handlePortal()}
                  disabled={loading !== null}
                >
                  {loading !== null ? 'Cargando…' : 'Gestionar suscripción'}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => void handleSubscribe(plan.id)}
                disabled={loading !== null}
              >
                {loading === plan.id
                  ? 'Redirigiendo…'
                  : isAuthenticated
                    ? 'Suscribirse'
                    : 'Iniciar sesión para suscribirse'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
