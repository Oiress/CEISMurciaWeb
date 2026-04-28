import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { serialize } from 'next-mdx-remote/serialize'
import fs from 'fs/promises'
import path from 'path'
import type { Tema, UserRole } from '@/types/database'

type Role = 'guest' | UserRole

function extractTeaser(mdx: string): string {
  // Simple paragraph extraction — does not handle all MDX syntax
  const blocks = mdx.split(/\n\n+/)
  const paragraphs: string[] = []
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    if (/^[#>*\-<`\s]/.test(trimmed)) continue
    paragraphs.push(trimmed)
    if (paragraphs.length >= 2) break
  }
  return paragraphs.join('\n\n')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const supabase = await createSupabaseServerClient()

  // 1. Lookup tema
  const { data: temaRaw, error: temaError } = await supabase
    .from('temas')
    .select('*')
    .eq('slug', slug)
    .single()

  const tema = temaRaw as Tema | null

  if (temaError || !tema || !tema.published) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 2. Determine user role
  let role: Role = 'guest'
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { role: UserRole } | null
    role = profile?.role === 'premium' ? 'premium' : 'free'
  }

  // 3. Determine access
  const hasFullAccess = tema.preview_for_free || role === 'premium'

  // 4. Derive file path from slug
  // slug format: general-01-constitucion → parte=general, file=01-constitucion.mdx
  const slugParts = slug.split('-')
  const parte = slugParts[0] // 'general' or 'especifica'
  const rest = slugParts.slice(1).join('-') // '01-constitucion'
  const filename = `${rest}.mdx`
  const filePath = path.join(process.cwd(), 'content', 'temas', parte, filename)

  let rawMdx: string
  try {
    rawMdx = await fs.readFile(filePath, 'utf-8')
  } catch {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const content = hasFullAccess ? rawMdx : extractTeaser(rawMdx)
  const source = await serialize(content)

  return NextResponse.json({
    source,
    paywalled: !hasFullAccess,
    titulo: tema.titulo,
  })
}
