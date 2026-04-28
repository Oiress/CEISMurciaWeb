import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ThemeToggle } from './theme-toggle'
import { Button } from './ui/button'
import { logoutAction } from '@/app/actions/auth'

export async function Nav() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg tracking-tight"
          aria-label="Inicio CEIS Oposiciones"
        >
          <span className="text-[hsl(15,85%,50%)]">🔥</span>
          <span>CEIS Murcia</span>
        </Link>

        <nav className="flex items-center gap-2" aria-label="Navegación principal">
          <Link href="/temas">
            <Button variant="ghost" size="sm">
              Temario
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/cuenta">
                <Button variant="ghost" size="sm">
                  Mi cuenta
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[hsl(15,85%,50%)] hover:bg-[hsl(15,85%,42%)] text-white">
                  Registrarse
                </Button>
              </Link>
            </>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
