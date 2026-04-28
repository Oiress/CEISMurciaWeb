import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/database'

export const metadata = {
  title: 'Mi cuenta — CEIS Murcia',
}

export default async function CuentaPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, created_at')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Pick<Profile, 'role' | 'created_at'> | null
  const role = profile?.role ?? 'free'
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Mi cuenta</h1>

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
                role === 'premium'
                  ? 'bg-[hsl(15,85%,50%)] text-white border-0'
                  : 'bg-secondary text-secondary-foreground border-0'
              }
            >
              {role === 'premium' ? 'Premium' : 'Gratuita'}
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
