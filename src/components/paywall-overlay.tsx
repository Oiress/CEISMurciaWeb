import Link from 'next/link'
import { Button } from './ui/button'
import { Lock } from 'lucide-react'

export function PaywallOverlay() {
  return (
    <div className="relative mt-8 rounded-xl border bg-gradient-to-b from-transparent to-background">
      {/* Fade gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-background" />

      {/* Overlay content */}
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(15,85%,50%)]/10">
          <Lock className="h-7 w-7 text-[hsl(15,85%,50%)]" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold">Contenido para suscriptores</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Este tema está disponible en la versión premium. Regístrate o accede a tu cuenta
          para desbloquear todo el temario.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button className="bg-[hsl(15,85%,50%)] hover:bg-[hsl(15,85%,42%)] text-white">
              Crear cuenta gratuita
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Próximamente disponible la suscripción premium.
        </p>
      </div>
    </div>
  )
}
