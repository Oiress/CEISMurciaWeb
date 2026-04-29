import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createSupabaseServiceClient()
  const { error } = await serviceClient
    .from('profiles')
    .update({ role: 'premium' })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to promote' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
