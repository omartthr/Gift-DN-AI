import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { message: 'Ödeme sistemi henüz yapılandırılmamış.' },
        { status: 503 }
      );
    }

    const { stripe } = await import('@/lib/stripe');

    // Body'yi clone'layıp oku (getUser'dan önce tüketilmemesi için)
    const body = await req.json();
    const { priceId } = body;

    // Authorization header'dan token'ı al
    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    let user: { id: string; email?: string } | null = null;

    if (accessToken) {
      // Client'tan gelen JWT ile kullanıcıyı doğrula
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: { get: () => undefined, set: () => {}, remove: () => {} },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) user = data.user;
    }

    // Fallback: cookie tabanlı oturumu kontrol et
    if (!user) {
      const { createServerSupabaseClient } = await import('@/lib/supabase-server');
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) user = data.user;
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Oturumunuz bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      client_reference_id: user.id,
      customer_email: user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { message: error.message || 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
