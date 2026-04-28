import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { Nav } from '@/components/nav'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CEIS Murcia — Preparación Oposiciones Bombero',
  description:
    'Plataforma de estudio para las oposiciones al CEIS Murcia. Temario completo, parte general y específica.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Nav />
          <main id="main-content">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
