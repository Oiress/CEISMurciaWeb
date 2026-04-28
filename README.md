# CEIS Murcia — Plataforma de Preparación de Oposiciones

Plataforma web para la preparación de las oposiciones al Consorcio de Extinción de Incendios y Salvamento de la Región de Murcia (CEIS Murcia). Incluye el temario completo dividido en Parte General (15 temas) y Parte Específica (25 temas), con control de acceso por suscripción, modo oscuro y lectura de contenido en formato MDX.

## Stack tecnológico

- **Next.js 15** — App Router, Server Components, Server Actions
- **TypeScript** — modo estricto
- **Supabase** — Auth + Postgres (via `@supabase/ssr`)
- **Tailwind CSS v4** + **shadcn/ui**
- **next-mdx-remote v5** — renderizado de MDX en runtime
- **Zod** — validación de formularios
- **next-themes** — modo oscuro persistido
- **react-hook-form** + **@hookform/resolvers** — formularios con validación cliente

## Configuración y arranque

### 1. Crear proyecto Supabase

Ve a [supabase.com](https://supabase.com), crea un nuevo proyecto y anota:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Ejecutar migración SQL

En el editor SQL de Supabase, copia y ejecuta el contenido de:
```
supabase/migrations/0001_init.sql
```

### 3. Ejecutar seed SQL

En el mismo editor SQL, copia y ejecuta:
```
supabase/seed.sql
```

### 4. Crear `.env.local`

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Promover cuenta a Premium (desarrollo)

1. Registra una cuenta en `/register`
2. Ve a [http://localhost:3000/dev/promote](http://localhost:3000/dev/promote)
3. Pulsa el botón — tu cuenta pasará a `role='premium'`
4. Recarga `/cuenta` para verificar el cambio

El endpoint `/api/dev/promote` devuelve 404 en producción (`NODE_ENV !== 'development'`).

## Estructura del proyecto (resumida)

```
.
├── content/
│   └── temas/
│       └── general/
│           ├── 01-constitucion.mdx
│           └── 02-corona.mdx
├── supabase/
│   ├── migrations/0001_init.sql
│   └── seed.sql
└── src/
    ├── app/
    │   ├── actions/auth.ts          # Server Actions: login, register, logout
    │   ├── api/
    │   │   ├── content/[slug]/      # MDX protegido por rol
    │   │   └── dev/promote/         # Solo dev: promover a premium
    │   ├── cuenta/                  # Perfil privado
    │   ├── dev/promote/             # UI dev promote
    │   ├── login/
    │   ├── register/
    │   ├── temas/
    │   │   ├── page.tsx             # Listado de temas
    │   │   └── [slug]/page.tsx      # Vista de tema
    │   ├── layout.tsx
    │   └── page.tsx                 # Landing
    ├── components/
    │   ├── nav.tsx
    │   ├── paywall-overlay.tsx
    │   ├── tema-card.tsx
    │   ├── tema-viewer.tsx
    │   ├── theme-toggle.tsx
    │   └── ui/                      # shadcn/ui components
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   └── server.ts
    │   ├── schemas.ts
    │   └── utils.ts
    ├── middleware.ts
    └── types/database.ts
```

## Fases previstas

- **Fase 1** (actual): Temario con control de acceso, auth, modo oscuro, 2 temas MDX de muestra.
- **Fase 2**: Suscripción Stripe, resto de temas MDX, tests de tipo test por tema.
- **Fase 3**: Panel de progreso, marcadores, estadísticas de estudio.
- **Fase 4**: Simulacros de examen cronometrados, ranking de resultados.
