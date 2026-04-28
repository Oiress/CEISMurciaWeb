import { notFound } from 'next/navigation'
import { DevPromoteClient } from './promote-client'

export default function DevPromotePage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <DevPromoteClient />
}
