import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle, Lock } from 'lucide-react'

const HOW_IT_WORKS = [
  {
    icon: BookOpen,
    step: '1',
    title: 'Accede al temario',
    description: 'Navega por los 40 temas organizados en Parte General y Parte Específica del CEIS Murcia.',
  },
  {
    icon: CheckCircle,
    step: '2',
    title: 'Estudia con contenido de calidad',
    description: 'Cada tema está redactado con el nivel de detalle necesario para superar la oposición.',
  },
  {
    icon: Lock,
    step: '3',
    title: 'Desbloquea todo el temario',
    description: 'El Tema 1 es gratis. Próximamente disponible la suscripción para acceder a todo el contenido.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-[hsl(15,85%,50%)]/5 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[hsl(15,85%,50%)]/10 px-4 py-1.5 text-sm font-medium text-[hsl(15,85%,50%)]">
            <span aria-hidden="true">🔥</span>
            Preparación oficial CEIS Murcia
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Supera la oposición de{' '}
            <span className="text-[hsl(15,85%,50%)]">Bombero/a</span>
            <br />
            del CEIS Murcia
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Todo el temario estructurado, actualizado y listo para estudiar. Parte General y Parte
            Específica en un solo lugar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/temas/general-01-constitucion">
              <Button
                size="lg"
                className="bg-[hsl(15,85%,50%)] hover:bg-[hsl(15,85%,42%)] text-white px-8"
              >
                Probar Tema 1 gratis
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="px-8">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="px-4 py-20 bg-muted/30" aria-labelledby="como-funciona-heading">
        <div className="mx-auto max-w-5xl">
          <h2
            id="como-funciona-heading"
            className="mb-12 text-center text-3xl font-bold tracking-tight"
          >
            Cómo funciona
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(15,85%,50%)]/10 shrink-0">
                  <Icon className="h-7 w-7 text-[hsl(15,85%,50%)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Paso {step}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suscripción */}
      <section className="px-4 py-16 text-center" aria-labelledby="suscripcion-heading">
        <div className="mx-auto max-w-xl">
          <h2 id="suscripcion-heading" className="mb-4 text-2xl font-bold">
            Próximamente: suscripción premium
          </h2>
          <p className="text-muted-foreground">
            Estamos preparando un plan de suscripción para que puedas acceder a los 40 temas
            completos, actualizaciones continuas y recursos adicionales. Regístrate ahora para
            recibir las novedades.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button variant="outline" size="lg">
                Crear cuenta gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
