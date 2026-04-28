import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TemaCard } from '@/components/tema-card'
import type { Tema } from '@/types/database'

export const metadata = {
  title: 'Temario — CEIS Murcia Oposiciones',
  description: 'Todos los temas de la oposición al CEIS Murcia, parte general y específica.',
}

export default async function TemasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: temasRaw, error } = await supabase
    .from('temas')
    .select('*')
    .order('orden', { ascending: true })

  const temas = temasRaw as Tema[] | null

  if (error || !temas) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Error al cargar el temario. Inténtalo de nuevo más tarde.
      </div>
    )
  }

  const general = temas.filter((t) => t.parte === 'general')
  const especifica = temas.filter((t) => t.parte === 'especifica')

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Temario completo</h1>
      <p className="mb-10 text-muted-foreground">
        40 temas organizados según el programa oficial de la oposición al CEIS Murcia.
      </p>

      {/* Parte General */}
      <section aria-labelledby="parte-general-heading" className="mb-12">
        <h2
          id="parte-general-heading"
          className="mb-6 text-xl font-semibold border-b pb-2"
        >
          Parte General
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({general.length} temas)
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {general.map((tema) => (
            <TemaCard key={tema.id} tema={tema} />
          ))}
        </div>
      </section>

      {/* Parte Específica */}
      <section aria-labelledby="parte-especifica-heading">
        <h2
          id="parte-especifica-heading"
          className="mb-6 text-xl font-semibold border-b pb-2"
        >
          Parte Específica
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({especifica.length} temas)
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {especifica.map((tema) => (
            <TemaCard key={tema.id} tema={tema} />
          ))}
        </div>
      </section>
    </div>
  )
}
