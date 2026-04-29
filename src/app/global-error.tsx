'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h1>Algo ha ido mal</h1>
        <p style={{ color: '#666', margin: '1rem 0' }}>{error.message}</p>
        <button
          onClick={reset}
          style={{ padding: '0.5rem 1.5rem', cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
