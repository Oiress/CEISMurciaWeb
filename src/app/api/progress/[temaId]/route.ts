import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { upsertProgressSchema } from '@/lib/schemas'

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function getUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
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
    .from('progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('tema_id', temaId)
    .single()

  if (!data) return NextResponse.json({ scroll_percent: 0, last_paragraph_id: null })
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

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  console.log('[progress] received', body)

  const parsed = upsertProgressSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('progress')
    .upsert({
      user_id: user.id,
      tema_id: temaId,
      scroll_percent: parsed.data.scroll_percent,
      last_paragraph_id: parsed.data.last_paragraph_id,
      last_visited_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
