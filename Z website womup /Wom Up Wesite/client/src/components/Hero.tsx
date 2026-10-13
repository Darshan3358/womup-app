import React from 'react';
import { Clock, ShieldCheck, Store as StoreIcon, Sparkles } from 'lucide-react';

interface HeroProps {
  onExploreStores: () => void;
  onExploreProducts: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreStores, onExploreProducts }) => {
  return (
    <section className="hero-section">
      <div className="hero-glow"></div>
      <div className="container">
        <div className="hero-content">
          <div>
            <div className="hero-banner-badge">
              <Sparkles size={15} />
              <span>Hyper-Local Commerce Platform</span>
            </div>
            <h1 className="hero-title">
              Your Neighborhood Stores, <br />
              <span className="highlight">Delivered in Minutes.</span>
            </h1>
            <p className="hero-description">
              Order fresh organic groceries, daily essentials, bakery delights, and health wellness directly from top-rated local retailers right around your corner.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                id="hero-explore-stores-btn"
                className="cart-button"
                onClick={onExploreStores}
                style={{ padding: '14px 28px', fontSize: '1rem' }}
              >
                <StoreIcon size={18} />
                <span>Explore Local Stores</span>
              </button>
              <button
                id="hero-view-products-btn"
                className="add-btn"
                onClick={onExploreProducts}
                style={{ padding: '14px 24px', fontSize: '1rem', background: 'var(--bg-card)' }}
              >
                <span>Browse Products</span>
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat-item">
                <span className="hero-stat-value">15-25 min</span>
                <span className="hero-stat-label">Average Delivery</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-value">500+</span>
                <span className="hero-stat-label">Verified Stores</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-value">99.4%</span>
                <span className="hero-stat-label">Happy Orders</span>
              </div>
            </div>
          </div>

          {/* Hero Promo Box */}
          <div className="hero-card-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255, 94, 54, 0.15)', padding: '10px', borderRadius: '12px' }}>
                <Clock size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Lightning Fast Delivery</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>From local racks to your doorstep</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(10, 135, 84, 0.15)', padding: '10px', borderRadius: '12px' }}>
                <ShieldCheck size={24} color="#34D399" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>100% Quality Guarantee</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Handpicked & fresh items only</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>🎁 First Order Discount</span>
                <span style={{ fontSize: '0.8rem', background: 'var(--color-primary)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>WOMUP50</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Get ₹50 OFF + Free Delivery on orders above ₹199!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
