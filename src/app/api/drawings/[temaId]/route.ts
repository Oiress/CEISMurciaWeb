import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { upsertDrawingSchema } from '@/lib/schemas'
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
    .from('drawings')
    .select('*')
    .eq('user_id', user.id)
    .eq('tema_id', temaId)
    .single()

  if (!data) return NextResponse.json({ strokes: [] })
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

  const parsed = upsertDrawingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('drawings')
    .upsert({ user_id: user.id, tema_id: temaId, strokes: parsed.data.strokes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
