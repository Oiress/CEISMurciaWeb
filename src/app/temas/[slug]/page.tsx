import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TemaViewer } from '@/components/tema-viewer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import type { Tema } from '@/types/database'

interface TemaPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TemaPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: temaRaw } = await supabase
    .from('temas')
    .select('titulo')
    .eq('slug', slug)
    .single()

  const tema = temaRaw as Pick<Tema, 'titulo'> | null

  return {
    title: tema ? `${tema.titulo} — CEIS Murcia` : 'Tema — CEIS Murcia',
  }
}

export default async function TemaPage({ params }: TemaPageProps) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  const { data: temaRaw } = await supabase
    .from('temas')
    .select('slug, titulo, published')
    .eq('slug', slug)
    .single()

  const tema = temaRaw as Pick<Tema, 'slug' | 'titulo' | 'published'> | null

  if (!tema || !tema.published) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/temas" aria-label="Volver al listado de temas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold leading-snug font-sans">{tema.titulo}</h1>
      </div>

      {/* Content */}
      <TemaViewer slug={slug} />
    </div>
  )
}
