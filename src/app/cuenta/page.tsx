import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ManageSubscriptionButton } from './manage-subscription-button'
import Link from 'next/link'

export const metadata = {
  title: 'Mi cuenta — CEIS Murcia',
}

type Profile = {
  role: string
  created_at: string | null
  subscription_status: string | null
  subscription_period_end: string | null
  cancel_at_period_end: boolean | null
  stripe_customer_id: string | null
  stripe_price_id: string | null
}

const STATUS_LABELS: Record<string, string> = {
  active:             'Activa',
  trialing:           'En prueba',
  past_due:           'Pendiente de pago',
  canceled:           'Cancelada',
  incomplete:         'Incompleta',
  incomplete_expired: 'Incompleta (expirada)',
  paused:             'Pausada',
  unpaid:             'Impagada',
}

const PRICE_LABELS: Record<string, string> = {
  [process.env.STRIPE_PRICE_ID_MONTHLY ?? '']: 'Mensual',
  [process.env.STRIPE_PRICE_ID_YEARLY  ?? '']: 'Anual',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default async function CuentaPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, created_at, subscription_status, subscription_period_end, cancel_at_period_end, stripe_customer_id, stripe_price_id')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Profile | null
  const role = profile?.role ?? 'free'
  const createdAt = formatDate(profile?.created_at ?? null)

  const isPremium = role === 'premium'
  const hasPortal = isPremium && !!profile?.stripe_customer_id

  const statusLabel = profile?.subscription_status
    ? (STATUS_LABELS[profile.subscription_status] ?? profile.subscription_status)
    : null

  const planLabel = profile?.stripe_price_id
    ? (PRICE_LABELS[profile.stripe_price_id] ?? 'Plan premium')
    : 'Plan premium'

  return (
    <div className="container mx-auto max-w-lg px-4 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Mi cuenta</h1>

      {/* ── Subscription section ── */}
      {isPremium ? (
        <Card>
          <CardHeader>
            <CardTitle>Tu suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">{planLabel}</span>
            </div>

            {statusLabel && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge
                  className={
                    profile?.subscription_status === 'active'
                      ? 'bg-green-500 text-white border-0'
                      : profile?.subscription_status === 'past_due'
                        ? 'bg-yellow-500 text-white border-0'
                        : 'bg-secondary text-secondary-foreground border-0'
                  }
                >
                  {statusLabel}
                </Badge>
              </div>
            )}

            {profile?.cancel_at_period_end ? (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-300">
                Tu suscripción se cancelará el{' '}
                <span className="font-semibold">
                  {formatDate(profile.subscription_period_end)}
                </span>
                . Hasta entonces sigues teniendo acceso premium completo.
              </div>
            ) : profile?.subscription_period_end ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Próxima renovación</span>
                <span className="font-medium">{formatDate(profile.subscription_period_end)}</span>
              </div>
            ) : null}

            {hasPortal && <ManageSubscriptionButton />}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Hazte premium para acceder a todo el temario y al chat con IA.
            </p>
            <Button size="sm" render={<Link href="/precios" />}>Ver planes</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Profile section ── */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de tu perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Correo electrónico
            </p>
            <p className="font-medium">{user.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Tipo de cuenta
            </p>
            <Badge
              className={
                isPremium
                  ? 'bg-[hsl(15,85%,50%)] text-white border-0'
                  : 'bg-secondary text-secondary-foreground border-0'
              }
            >
              {isPremium ? 'Premium' : 'Gratuita'}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Miembro desde
            </p>
            <p className="font-medium">{createdAt}</p>
          </div>

          <div className="pt-4 border-t">
            <form action={logoutAction}>
              <Button variant="outline" type="submit" className="w-full">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
