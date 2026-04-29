import Stripe from 'stripe'

// API version 2026-04-22.dahlia — latest stable as of 2026-04-29
// current_period_end is per-item (subscription.items.data[0].current_period_end)
// NOT on the top-level Subscription object in this API version.

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

// Convenience re-export for call sites that want `stripe.xxx` syntax
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
