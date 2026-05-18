import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

// Admin client to bypass RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          // Retrieve subscription from Stripe to get price and current period end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;
          const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

          // Update user in Supabase
          const { error } = await supabaseAdmin
            .from('profiles') // Adjust this to your actual users table name
            .update({
              stripe_customer_id: customerId,
              subscription_status: subscription.status,
              price_id: priceId,
              current_period_end: currentPeriodEnd,
            })
            .eq('id', userId);

          if (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

        // Update user based on customerId
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            price_id: priceId,
            current_period_end: currentPeriodEnd,
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating user subscription from webhook:', error);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error(`Webhook processing failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 500 });
  }
}
