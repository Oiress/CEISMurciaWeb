import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { upsertSummarySchema } from '@/lib/schemas'
import { escapeHtml } from '@/lib/sanitize'
import type { UserRole } from '@/types/database'

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function getUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getRole(supabase: SupabaseClient, userId: string): Promise<UserRole> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return data?.role === 'premium' ? 'premium' : 'free'
}

const FREE_PREVIEW_SLUG = 'general-01-constitucion'

async function canAccess(supabase: SupabaseClient, temaId: number, role: string): Promise<boolean> {
  if (role === 'premium') return true
  const { data } = await supabase.from('temas').select('slug').eq('id', temaId).single()
  return data?.slug === FREE_PREVIEW_SLUG
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ temaId: string }> }
) {
  const { temaId: temaIdStr } = await params
  const temaId = parseInt(temaIdStr, 10)

  const supabase = await createSupabaseServerClient()
  const user = await getUser(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('tema_id', temaId)
    .single()

  if (!data) return NextResponse.json({ content: '' })
  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ temaId: string }> }
) {
  const { temaId: temaIdStr } = await params
  const temaId = parseInt(temaIdStr, 10)

  const supabase = await createSupabaseServerClient()
  const user = await getUser(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getRole(supabase, user.id)
  if (!await canAccess(supabase, temaId, role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = upsertSummarySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('summaries')
    .upsert({ user_id: user.id, tema_id: temaId, content: escapeHtml(parsed.data.content) })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
