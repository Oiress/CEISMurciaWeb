import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Pago cancelado — CEIS Murcia' }

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl mb-6">😕</p>
      <h1 className="text-2xl font-bold mb-3">Has cancelado el proceso de pago</h1>
      <p className="text-muted-foreground mb-8">
        ¿Cambiaste de idea? Puedes volver a ver los planes cuando quieras.
      </p>
      <Button render={<Link href="/precios" />}>Ver planes</Button>
    </div>
  )
}
