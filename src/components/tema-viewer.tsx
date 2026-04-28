'use client'

import { useEffect, useState } from 'react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { PaywallOverlay } from './paywall-overlay'

interface TemaViewerProps {
  slug: string
}

interface ContentResponse {
  source: MDXRemoteSerializeResult
  paywalled: boolean
  titulo: string
}

export function TemaViewer({ slug }: TemaViewerProps) {
  const [data, setData] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/content/${slug}`)
        if (!res.ok) {
          setError('No se pudo cargar el contenido de este tema.')
          return
        }
        const json = await res.json() as ContentResponse
        setData(json)
      } catch {
        setError('Error de red al cargar el contenido.')
      } finally {
        setLoading(false)
      }
    }
    void fetchContent()
  }, [slug])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/5" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-8 text-center text-muted-foreground" role="alert">
        {error ?? 'Contenido no disponible.'}
      </div>
    )
  }

  return (
    <div>
      <article
        className="prose prose-slate dark:prose-invert max-w-none font-serif
          prose-headings:font-sans prose-headings:font-bold
          prose-a:text-[hsl(15,85%,50%)] prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-[hsl(15,85%,50%)] prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg prose-blockquote:py-0.5"
        aria-label={`Contenido del tema: ${data.titulo}`}
      >
        <MDXRemote {...data.source} />
      </article>

      {data.paywalled && <PaywallOverlay />}
    </div>
  )
}
