'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/schemas'

export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? 'Datos inválidos'
    return { error: firstError }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    return { error: 'Correo o contraseña incorrectos. Inténtalo de nuevo.' }
  }

  redirect('/temas')
}

export async function registerAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? 'Datos inválidos'
    return { error: firstError }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Este correo ya está registrado. Prueba a iniciar sesión.' }
    }
    return { error: 'Error al crear la cuenta. Inténtalo de nuevo.' }
  }

  redirect('/temas')
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
