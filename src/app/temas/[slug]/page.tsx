import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TemaViewer } from '@/components/tema/tema-viewer'
import { SidebarToc } from '@/components/tema/sidebar-toc'
import { SidebarSummary } from '@/components/tema/sidebar-summary'
import { ViewerHeader } from '@/components/tema/viewer-header'
import type { Metadata } from 'next'
import type { Tema, UserRole } from '@/types/database'

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
    .select('id, slug, titulo, published')
    .eq('slug', slug)
    .single()

  const tema = temaRaw as Pick<Tema, 'id' | 'slug' | 'titulo' | 'published'> | null

  if (!tema || !tema.published) {
    notFound()
  }

  // Determine user role
  let userRole: 'guest' | UserRole = 'guest'
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const profile = profileRaw as { role: UserRole } | null
    userRole = profile?.role === 'premium' ? 'premium' : 'free'
  }

  const FREE_PREVIEW_SLUG = 'general-01-constitucion'
  const canAnnotate =
    userRole !== 'guest' &&
    (userRole === 'premium' || slug === FREE_PREVIEW_SLUG)

  return (
    <div className="flex h-[calc(100vh-var(--nav-height,4rem))] overflow-hidden relative">
      <SidebarToc canAnnotate={canAnnotate} />

      <div className="flex-1 overflow-y-auto" id="content-scroll-container">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <ViewerHeader titulo={tema.titulo} canAnnotate={canAnnotate} />
          <TemaViewer
            slug={slug}
            temaId={tema.id}
            userRole={userRole}
            canAnnotate={canAnnotate}
          />
        </div>
      </div>

      <SidebarSummary temaId={tema.id} canAnnotate={canAnnotate} />
    </div>
  )
}
