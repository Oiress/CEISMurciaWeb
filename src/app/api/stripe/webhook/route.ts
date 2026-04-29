import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Stripe API 2026-04-22.dahlia: current_period_end lives on the subscription
// item, not the top-level subscription object.
// Read it from: subscription.items.data[0].current_period_end
function getPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null
}

function getPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price.id ?? null
}

async function upsertSubscription(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  subscription: Stripe.Subscription,
) {
  const userId: string | undefined =
    (subscription.metadata?.user_id as string | undefined) ??
    undefined

  const periodEndUnix = getPeriodEnd(subscription)
  const periodEndIso = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null
  const priceId = getPriceId(subscription)

  const isActive =
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    periodEndUnix !== null &&
    periodEndUnix > Math.floor(Date.now() / 1000)

  const updates = {
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_status: subscription.status,
    subscription_period_end: periodEndIso,
    cancel_at_period_end: subscription.cancel_at_period_end,
    role: isActive ? 'premium' : 'free',
  }

  if (userId) {
    console.log(`[stripe-webhook] processed event=subscription user_id=${userId}`)
    await supabase.from('profiles').update(updates).eq('id', userId)
    return
  }

  // Fallback: look up by customer_id
  console.log(`[stripe-webhook] processed event=subscription (fallback by customer) customer=${subscription.customer}`)
  await supabase
    .from('profiles')
    .update(updates)
    .eq('stripe_customer_id', subscription.customer as string)
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  // Must read as raw text BEFORE any JSON.parse — required for signature verification
  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[stripe-webhook] received event=${event.type} id=${event.id}`)

  const supabase = createSupabaseServiceClient()

  // Idempotency: insert event id; if already present, skip processing
  const { error: insertError } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique violation — event already processed
      console.log(`[stripe-webhook] skipped duplicate event=${event.type} id=${event.id}`)
      return NextResponse.json({ received: true })
    }
    console.error('[stripe-webhook] failed to record event', insertError)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Register customer_id in case checkout was created outside our endpoint
        const userId = session.metadata?.user_id
        if (userId && session.customer) {
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', userId)
            .is('stripe_customer_id', null)
          console.log(`[stripe-webhook] processed event=checkout.session.completed user_id=${userId}`)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscription(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId: string | undefined =
          (subscription.metadata?.user_id as string | undefined) ?? undefined

        const updates = {
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          stripe_price_id: null,
          cancel_at_period_end: false,
          role: 'free',
        }

        if (userId) {
          console.log(`[stripe-webhook] processed event=subscription.deleted user_id=${userId}`)
          await supabase.from('profiles').update(updates).eq('id', userId)
        } else {
          console.log(`[stripe-webhook] processed event=subscription.deleted (fallback by customer) customer=${subscription.customer}`)
          await supabase
            .from('profiles')
            .update(updates)
            .eq('stripe_customer_id', subscription.customer as string)
        }
        break
      }

      default:
        console.log(`[stripe-webhook] unhandled event=${event.type}`)
    }
  } catch (err) {
    console.error(`[stripe-webhook] error processing event=${event.type}`, err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
