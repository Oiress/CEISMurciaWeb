import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PricingCards } from './pricing-cards'

export const metadata = { title: 'Planes y precios — CEIS Murcia' }

export default async function PreciosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = (profileRaw as { role: string } | null)?.role ?? 'free'
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Elige tu plan</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Accede a todo el temario, apuntes ilimitados y herramientas de estudio
          para preparar tu oposición al CEIS Murcia.
        </p>
      </div>
      <PricingCards isAuthenticated={!!user} role={role} />
      <p className="text-center text-xs text-muted-foreground mt-10">
        Pago seguro mediante Stripe. IVA incluido. Cancela cuando quieras desde tu cuenta.
      </p>
    </div>
  )
}
