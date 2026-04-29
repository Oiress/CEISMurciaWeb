import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, subscription_status, cancel_at_period_end')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as {
    role: string
    subscription_status: string | null
    cancel_at_period_end: boolean | null
  } | null

  return NextResponse.json({
    role: profile?.role ?? 'free',
    subscription_status: profile?.subscription_status ?? null,
    cancel_at_period_end: profile?.cancel_at_period_end ?? false,
  })
}
