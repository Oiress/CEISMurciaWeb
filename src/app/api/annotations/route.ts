import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createAnnotationSchema } from '@/lib/schemas'
import { checkLimit } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/sanitize'
import type { UserRole } from '@/types/database'

const FREE_PREVIEW_SLUG = 'general-01-constitucion'

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function getUserAndRole(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: 'guest' as const }

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role: UserRole = data?.role === 'premium' ? 'premium' : 'free'
  return { user, role }
}

async function canAccessTema(supabase: SupabaseClient, temaId: number, role: string): Promise<boolean> {
  if (role === 'premium') return true
  const { data } = await supabase.from('temas').select('slug').eq('id', temaId).single()
  return data?.slug === FREE_PREVIEW_SLUG
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { user, role } = await getUserAndRole(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const temaIdParam = request.nextUrl.searchParams.get('temaId')
  if (!temaIdParam) return NextResponse.json({ error: 'Missing temaId' }, { status: 400 })
  const temaId = parseInt(temaIdParam, 10)
  if (isNaN(temaId)) return NextResponse.json({ error: 'Invalid temaId' }, { status: 400 })

  if (!await canAccessTema(supabase, temaId, role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('user_id', user.id)
    .eq('tema_id', temaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ annotations: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { user, role } = await getUserAndRole(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkLimit(user.id, 'annotation-create')) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createAnnotationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const input = parsed.data
  if (!await canAccessTema(supabase, input.tema_id, role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('annotations')
    .insert({
      user_id: user.id,
      tema_id: input.tema_id,
      paragraph_id: input.paragraph_id,
      type: input.type,
      content: input.content ? escapeHtml(input.content) : null,
      color: input.color ?? null,
      range_start: input.range_start ?? null,
      range_end: input.range_end ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ annotation: data }, { status: 201 })
}
