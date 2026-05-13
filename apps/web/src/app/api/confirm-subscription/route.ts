import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, message: 'Ödeme sistemi yapılandırılmamış.' }, { status: 503 });
    }

    const { stripe } = await import('@/lib/stripe');
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, message: 'Session ID eksik.' }, { status: 400 });
    }

    // Kullanıcı oturumu doğrula
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: 'Oturum bulunamadı.' }, { status: 401 });
    }

    // Stripe'dan checkout session'ını çek
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ ok: false, message: 'Ödeme henüz tamamlanmadı.' }, { status: 402 });
    }

    // Subscription bilgilerini al
    const subscription = session.subscription as any;
    const customerId = session.customer as string;
    const priceId = subscription?.items?.data?.[0]?.price?.id || '';
    const currentPeriodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    // Service role ile RLS bypass ederek profili güncelle
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        subscription_status: subscription?.status || 'active',
        price_id: priceId,
        current_period_end: currentPeriodEnd,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ ok: false, message: 'Profil güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('confirm-subscription error:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
