import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import type { Tema } from '@/types/database'

interface TemaCardProps {
  tema: Tema
}

function getTemaStatus(tema: Tema) {
  if (!tema.published) {
    return { label: 'Próximamente', variant: 'secondary' as const, href: null }
  }
  if (tema.preview_for_free) {
    return { label: 'Disponible', variant: 'default' as const, href: `/temas/${tema.slug}` }
  }
  return { label: 'Versión de pago', variant: 'outline' as const, href: `/temas/${tema.slug}` }
}

export function TemaCard({ tema }: TemaCardProps) {
  const { label, variant, href } = getTemaStatus(tema)

  const cardContent = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm text-muted-foreground font-mono">
            Tema {tema.numero}
          </span>
          <Badge
            variant={variant}
            className={
              label === 'Disponible'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0'
                : label === 'Versión de pago'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-0'
                : ''
            }
          >
            {label}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug">{tema.titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground capitalize">{tema.parte}</p>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(15,85%,50%)] rounded-lg">
        {cardContent}
      </Link>
    )
  }

  return <div className="cursor-not-allowed opacity-70">{cardContent}</div>
}
