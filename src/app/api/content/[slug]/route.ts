import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { serialize } from 'next-mdx-remote/serialize'
import fs from 'fs/promises'
import path from 'path'
import type { Tema, UserRole, TocItem } from '@/types/database'
import { computeParagraphId } from '@/lib/paragraph-id'

type Role = 'guest' | UserRole

// ── Hast types (inline, avoids @types/hast dependency) ────────────────────────
interface HastText {
  type: 'text'
  value: string
}
interface HastElement {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  children: HastNode[]
}
interface HastRoot {
  type: 'root'
  children: HastNode[]
}
type HastNode = HastText | HastElement | HastRoot | { type: string }

// Inline hast walker — avoids unist-util-visit dependency
function walkHast(node: HastNode, visitor: (node: HastNode) => void): void {
  visitor(node)
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) walkHast(child, visitor)
  }
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text') return (node as HastText).value
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as HastNode[]).map(getTextContent).join('')
  }
  return ''
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const ANNOTATABLE_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'])
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

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

  // 5. Build rehype plugin that assigns data-pid to annotatable blocks
  const toc: TocItem[] = []

  const rehypeParagraphIds = () => (tree: HastNode) => {
    const counters: Record<string, number> = {}

    walkHast(tree, (node) => {
      if (node.type !== 'element') return
      const el = node as HastElement
      if (!ANNOTATABLE_TAGS.has(el.tagName)) return

      const tagName = el.tagName
      if (counters[tagName] === undefined) counters[tagName] = 0
      const index = counters[tagName]++

      const text = getTextContent(el)
      const pid = computeParagraphId(tagName, index, text)
      el.properties['data-pid'] = pid

      if (HEADING_TAGS.has(tagName)) {
        const headingSlug = slugify(text)
        el.properties['id'] = headingSlug
        toc.push({
          level: parseInt(tagName[1], 10),
          text,
          pid,
        })
      }
    })
  }

  const source = await serialize(content, {
    mdxOptions: {
      rehypePlugins: [rehypeParagraphIds],
    },
  })

  return NextResponse.json({
    source,
    paywalled: !hasFullAccess,
    titulo: tema.titulo,
    temaId: tema.id,
    toc,
  })
}
