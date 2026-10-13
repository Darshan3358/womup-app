import React from 'react';
import { Heart, Smartphone } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-columns-grid">
          {/* Col 1: Brand Info */}
          <div className="footer-col">
            <div className="brand-logo-wrap" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/Wormup.png"
                alt="WormUp"
                style={{
                  width: '38px',
                  height: '38px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                }}
              />
              <div className="brand-text">
                Worm<span>Up</span>
              </div>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '340px' }}>
              Your one-stop platform for 10-minute quick commerce grocery delivery, instant cloud document printing, and shopping coins rewards.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <span style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 12px', borderRadius: '6px', color: '#FF3B98', fontWeight: 600 }}>
                ⚡ 10-Min Delivery
              </span>
              <span style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 12px', borderRadius: '6px', color: '#13B978', fontWeight: 600 }}>
                🛡️ 100% Quality
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-nav-list">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Home</a></li>
              <li><a href="#shop" onClick={(e) => { e.preventDefault(); navigateTo('shop'); }}>Shop Groceries</a></li>
              <li><a href="#printing" onClick={(e) => { e.preventDefault(); navigateTo('printing'); }}>Cloud Printing</a></li>
              <li><a href="#coins" onClick={(e) => { e.preventDefault(); navigateTo('account', { accountTab: 'coins' }); }}>Coins & Rewards</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); navigateTo('features'); }}>Why WormUp</a></li>
            </ul>
          </div>

          {/* Col 3: Help & Support */}
          <div className="footer-col">
            <h4>Help & Support</h4>
            <ul className="footer-nav-list">
              <li><a href="#orders" onClick={(e) => { e.preventDefault(); navigateTo('account', { accountTab: 'orders' }); }}>Track My Order</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); alert('24/7 WormUp Help Support Desk: help@wormup.in'); }}>FAQ & Help Center</a></li>
              <li><a href="#return" onClick={(e) => { e.preventDefault(); alert('No-Questions-Asked Instant Returns & Refund policy active.'); }}>Return Policy</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); alert('Call: 1800-WOR-MUP | Ahmedabad, Gujarat'); }}>Contact Us</a></li>
            </ul>
          </div>

          {/* Col 4: Download App */}
          <div className="footer-col">
            <h4>Experience WormUp App</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Order on the go and get real-time rider tracking with live map telemetry.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 18px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
                onClick={() => alert('WormUp Android Customer App available on Google Play!')}
              >
                <Smartphone size={16} color="#FF3B98" />
                <span>Google Play Store</span>
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 18px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
                onClick={() => alert('WormUp iOS App on Apple App Store!')}
              >
                <Smartphone size={16} color="#7856F6" />
                <span>Apple App Store</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © 2026 WormUp Technologies Pvt Ltd. All rights reserved. • <a href="#terms" style={{ color: 'inherit' }}>Terms & Conditions</a> • <a href="#privacy" style={{ color: 'inherit' }}>Privacy Policy</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Crafted with</span>
            <Heart size={14} color="#FF3B98" fill="#FF3B98" />
            <span>for Modern Neighborhoods</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
  