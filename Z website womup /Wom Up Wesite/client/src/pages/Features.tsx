import React from 'react';
import { Zap, ShieldCheck, Printer, Percent, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const Features: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="features-page-root" style={{ padding: '32px 0 80px' }}>
      <div className="container">
        {/* ==============================================================
            Hero Section
            ============================================================== */}
        <div
          style={{
            background: 'linear-gradient(135deg, #071B52 0%, #102B68 50%, #7856F6 100%)',
            borderRadius: '28px',
            color: '#FFFFFF',
            padding: '56px 64px',
            marginBottom: '48px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            alignItems: 'center',
            gap: '40px',
            boxShadow: '0 16px 40px rgba(7, 27, 82, 0.2)',
          }}
        >
          <div>
            <span style={{ background: '#FF3B98', color: '#fff', padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
              ⚡ Unified Hyper-Local Ecosystem
            </span>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#FFFFFF', margin: '14px 0 8px', lineHeight: 1.18 }}>
              Why Choose WormUp?<br />
              <span style={{ color: '#FF5BAA' }}>More Than Just Shopping.</span>
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '540px' }}>
              Fast, Fresh & Reliable — All in One Place.<br />
              Experience 10-minute dark store grocery delivery, on-demand cloud printing, and high-value rewards with WormUp Coins across Ahmedabad.
            </p>

            <button
              className="btn-primary"
              style={{ background: '#FFFFFF', color: '#071B52', fontWeight: 700, padding: '14px 30px' }}
              onClick={() => navigateTo('shop')}
            >
              <span>Start Shopping Now</span>
              <ArrowRight size={18} color="#FF3B98" />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
              alt="WormUp Ecosystem"
              style={{ width: '100%', maxWidth: '380px', height: '260px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>

        {/* ==============================================================
            3x2 Ecosystem Grid
            ============================================================== */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
          <h2 className="section-h2">The WormUp Super-App Architecture</h2>
          <p style={{ color: '#667085', fontSize: '0.95rem', marginTop: '6px' }}>
            Built ground-up with specialized micro-services for lightning speed and reliability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
          {[
            {
              title: '10 Min Quick Delivery',
              desc: 'Localized dark stores within 2 km radius ensure items are picked, packed, and delivered in minutes.',
              icon: Zap,
              color: '#FF3B98',
            },
            {
              title: 'Fresh & Quality Guaranteed',
              desc: 'Chemical-free farm produce inspected every morning with zero-decay packaging.',
              icon: ShieldCheck,
              color: '#13B978',
            },
            {
              title: 'Cloud Document Printing',
              desc: 'Upload assignments, contracts, or photos online and get sealed prints in 15 mins.',
              icon: Printer,
              color: '#7856F6',
            },
            {
              title: 'Zero Minimum Order',
              desc: 'No cart minimums. Order everything from a single milk pouch or pen to full weekly grocery baskets.',
              icon: Percent,
              color: '#2563EB',
            },
            {
              title: 'Rewards & WormUp Coins',
              desc: '1 Coin = ₹1.00 INR. Earn guaranteed coins on grocery and print orders and redeem instantly at checkout.',
              icon: Sparkles,
              color: '#D97706',
            },
            {
              title: 'Secure & Safe Payments',
              desc: 'UPI, credit/debit cards, and cash on delivery protected with 256-bit encryption.',
              icon: CreditCard,
              color: '#071B52',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6EAF2',
                  borderRadius: '20px',
                  padding: '28px',
                  boxShadow: '0 4px 18px rgba(7, 27, 82, 0.04)',
                  transition: 'transform 0.25s ease',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#F8F2FF',
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={26} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#667085', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Trust Badges Bar */}
        <div
          style={{
            background: '#F8F2FF',
            borderRadius: '24px',
            border: '1px solid #EEE6FF',
            padding: '36px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#071B52', marginBottom: '10px' }}>
            Ready to experience 10-minute convenience?
          </h3>
          <p style={{ color: '#667085', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 24px' }}>
            Join over 50,000 satisfied shoppers in Ahmedabad and enjoy up to ₹2,000 monthly benefit.
          </p>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={() => navigateTo('shop')}>
            <span>Explore WormUp Catalog</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
