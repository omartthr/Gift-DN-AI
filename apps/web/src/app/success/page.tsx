'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/store/i18nStore';
import { Suspense } from 'react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { lang } = useI18n();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setMessage(lang === 'tr' ? 'Geçersiz oturum.' : 'Invalid session.');
      return;
    }

    // Ödeme tamamlandı — profil güncelleme isteği gönder
    fetch('/api/confirm-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setStatus('success');
          setMessage(
            lang === 'tr'
              ? 'Aboneliğiniz aktif edildi! Hoş geldiniz 🎉'
              : 'Your subscription is now active! Welcome 🎉'
          );
          // 3 saniye sonra anasayfaya yönlendir
          setTimeout(() => router.push('/'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || (lang === 'tr' ? 'Bir hata oluştu.' : 'Something went wrong.'));
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage(lang === 'tr' ? 'Bağlantı hatası.' : 'Connection error.');
      });
  }, []);

  return (
    <div
      className="shell fade-in col items-center justify-center"
      style={{ minHeight: '70vh', textAlign: 'center', gap: 24 }}
    >
      {status === 'loading' && (
        <>
          <span className="dots" style={{ fontSize: 32 }}><span /><span /><span /></span>
          <p style={{ fontSize: 18, color: 'var(--ink-2)' }}>
            {lang === 'tr' ? 'Aboneliğiniz doğrulanıyor…' : 'Confirming your subscription…'}
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--sage), #4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.02em' }}>
            {lang === 'tr' ? 'Abonelik Aktif!' : 'Subscription Active!'}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 480 }}>{message}</p>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {lang === 'tr' ? 'Anasayfaya yönlendiriliyorsunuz…' : 'Redirecting to home…'}
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(217, 74, 41, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="serif" style={{ fontSize: 32 }}>
            {lang === 'tr' ? 'Bir sorun oluştu' : 'Something went wrong'}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)' }}>{message}</p>
          <button className="btn btn-coral" onClick={() => router.push('/pricing')}>
            {lang === 'tr' ? 'Tekrar dene' : 'Try again'}
          </button>
        </>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="shell col items-center justify-center" style={{ minHeight: '70vh' }}>
        <span className="dots"><span /><span /><span /></span>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
