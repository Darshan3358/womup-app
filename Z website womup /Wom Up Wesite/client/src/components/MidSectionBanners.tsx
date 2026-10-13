import React from 'react';
import { ArrowRight, Gift, Sparkles, ShoppingBag, Zap, Smartphone, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// Mid-Section Grid 1: 2 Modular Banners (Printing + Bulk Orders)
// ============================================================================
export const DocumentPrintingBanner: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section style={{ margin: '32px 0 24px' }}>
      <div className="container">
        <div
          className="modular-banner-grid-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          {/* Banner A (Left): Instant Document Printing */}
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(7, 27, 82, 0.22)' }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #071B52 0%, #0F2A7A 60%, #1A3E9C 100%)',
              borderRadius: '18px',
              overflow: 'hidden',
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '230px',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(7, 27, 82, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
            }}
          >
            <div style={{ maxWidth: '58%', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 59, 152, 0.2)',
                  color: '#FF70B8',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <Sparkles size={11} />
                <span>10-MIN CLOUD PRINTING</span>
              </div>

              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  margin: '0 0 6px',
                  lineHeight: 1.25,
                }}
              >
                Instant Document Printing
              </h3>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: '0 0 16px',
                  lineHeight: 1.4,
                }}
              >
                Upload PDF & get doorstep delivery in 10 minutes. Color, B&W & spiral binding.
              </p>

              <button
                id="mid-banner-print-btn"
                onClick={() => navigateTo('printing')}
                style={{
                  background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(255, 59, 152, 0.4)',
                }}
              >
                <span>Upload PDF</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right Side: High-Resolution 3D Image Asset */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '46%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <motion.img
                src="/banners/banner_doc_printing.jpg"
                alt="Document Printing 3D"
                whileHover={{ scale: 1.05, x: 4 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          </motion.div>

          {/* Banner B (Right): Bulk Orders / Save More */}
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(19, 185, 120, 0.22)' }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)',
              borderRadius: '18px',
              overflow: 'hidden',
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '230px',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(6, 78, 59, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
            }}
          >
            <div style={{ maxWidth: '58%', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(52, 211, 153, 0.2)',
                  color: '#6EE7B7',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <ShoppingBag size={11} />
                <span>WHOLESALE MANDI PRICES</span>
              </div>

              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  margin: '0 0 6px',
                  lineHeight: 1.25,
                }}
              >
                Buy in Bulk, Save More
              </h3>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: '0 0 16px',
                  lineHeight: 1.4,
                }}
              >
                Direct farm produce & kitchen staples at up to 35% discount for bulk orders.
              </p>

              <button
                id="mid-banner-bulk-btn"
                onClick={() => navigateTo('shop', { categorySlug: 'vegetables' })}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                <span>Shop Bulk</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right Side: High-Resolution 3D Image Asset */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '46%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <motion.img
                src="/banners/banner_bulk_groceries.jpg"
                alt="Buy in Bulk Farm Groceries"
                whileHover={{ scale: 1.05, x: 4 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// ============================================================================
// Mid-Section Category Banners: Dairy, Bread & Eggs + Fresh Fruits & Vegetables
// ============================================================================
export const CategoryMidBanners: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section style={{ margin: '32px 0 24px' }}>
      <div className="container">
        <div
          className="modular-banner-grid-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          {/* Banner 1 (Left): Dairy, Bread & Eggs (Light Blue Theme) */}
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(2, 132, 199, 0.22)' }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 55%, #BAE6FD 100%)',
              borderRadius: '20px',
              overflow: 'hidden',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '210px',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)',
              border: '1.5px solid #BAE6FD',
              cursor: 'pointer',
            }}
            onClick={() => navigateTo('shop', { categorySlug: 'dairy' })}
          >
            <div style={{ maxWidth: '58%', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                <span>🥛 MORNING ESSENTIALS</span>
              </div>

              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#0C4A6E',
                  margin: '0 0 6px',
                  lineHeight: 1.2,
                }}
              >
                Dairy, Bread & Eggs
              </h3>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#0369A1',
                  margin: '0 0 14px',
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}
              >
                Farm-fresh milk, artisan loaves, butter & farm brown eggs delivered in 9 mins.
              </p>

              <button
                id="mid-banner-dairy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo('shop', { categorySlug: 'dairy' });
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                }}
              >
                <span>Explore Dairy</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right Side 3D Image Asset */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '46%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <motion.img
                src="/banners/banner_dairy_bread_eggs.jpg"
                alt="Dairy, Bread & Eggs"
                whileHover={{ scale: 1.06, x: 4 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          </motion.div>

          {/* Banner 2 (Right): Fresh Fruits & Vegetables (Light Green Theme) */}
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(22, 163, 74, 0.22)' }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 55%, #BBF7D0 100%)',
              borderRadius: '20px',
              overflow: 'hidden',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '210px',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)',
              border: '1.5px solid #BBF7D0',
              cursor: 'pointer',
            }}
            onClick={() => navigateTo('shop', { categorySlug: 'vegetables' })}
          >
            <div style={{ maxWidth: '58%', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                <span>🥦 FARM FRESH DIRECT</span>
              </div>

              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#14532D',
                  margin: '0 0 6px',
                  lineHeight: 1.2,
                }}
              >
                Fresh Fruits & Veggies
              </h3>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#15803D',
                  margin: '0 0 14px',
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}
              >
                Crisp greens, morning-picked vegetables & seasonal fruits direct from farms.
              </p>

              <button
                id="mid-banner-veggies-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo('shop', { categorySlug: 'vegetables' });
                }}
                style={{
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                }}
              >
                <span>Shop Fresh Produce</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right Side 3D Image Asset */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '46%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <motion.img
                src="/banners/banner_fresh_veggies_fruits.jpg"
                alt="Fresh Fruits & Vegetables"
                whileHover={{ scale: 1.06, x: 4 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// Pre-Footer Grid: 2 Modular Banners (Coins + Refer a Friend) - Compact 180px
// ============================================================================
export const ShoppingCoinsBanner: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { isAuthenticated, openLoginModal } = useAuth();

  const handleCoinsClick = () => {
    if (!isAuthenticated) openLoginModal();
    else navigateTo('account', { accountTab: 'wallet' });
  };

  const handleReferClick = () => {
    if (!isAuthenticated) openLoginModal();
    else navigateTo('account', { accountTab: 'wallet' });
  };

  return (
    <section style={{ margin: '28px 0 20px' }}>
      <div className="container">
        <div
          className="modular-banner-grid-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          {/* Banner A (Left): Shopping Coins */}
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(245, 158, 11, 0.25)' }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
              borderRadius: '18px',
              overflow: 'hidden',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '185px',
              position: 'relative',
              boxShadow: '0 8px 22px rgba(245, 158, 11, 0.12)',
              border: '1.5px solid #FCD34D',
            }}
          >
            <div style={{ maxWidth: '56%', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <span>🪙 1 COIN = ₹1 CASH</span>
              </div>

              <h3
                style={{
                  fontSize: '1.30rem',
                  fontWeight: 900,
                  color: '#78350F',
                  margin: '0 0 6px',
                  lineHeight: 1.25,
                }}
              >
                Earn 10 Shopping Coins
              </h3>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#92400E',
                  margin: '0 0 16px',
                  lineHeight: 1.4,
                }}
              >
                Accumulate coins on every grocery order. Redeem on checkout or partner shops.
              </p>

              <button
                id="mid-banner-coins-btn"
                onClick={handleCoinsClick}
                style={{
                  background: '#78350F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(120, 53, 15, 0.25)',
                }}
              >
                <span>View My Coins</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right Side: High-Resolution 3D Image Asset */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '46%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <motion.img
                src="/banners/banner_coins_rewards.jpg"
                alt="Shopping Coins Rewards"
                whileHover={{ scale: 1.05, x: 4 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          </motion.div>

          {/* Banner B (Right): Refer & Earn */}
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(16, 185, 129, 0.25)' }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
              borderRadius: '18px',
              overflow: 'hidden',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '185px',
              position: 'relative',
              boxShadow: '0 8px 22px rgba(16, 185, 129, 0.12)',
              border: '1.5px solid #6EE7B7',
            }}
          >
            <div style={{ maxWidth: '56%', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#059669',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <Gift size={11} />
                <span>REFERRAL BONUS</span>
              </div>

              <h3
                style={{
                  fontSize: '1.30rem',
                  fontWeight: 900,
                  color: '#064E3B',
                  margin: '0 0 6px',
                  lineHeight: 1.25,
                }}
              >
                Refer a Friend, Get ₹100
              </h3>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#047857',
                  margin: '0 0 16px',
                  lineHeight: 1.4,
                }}
              >
                Share your invite link. When friends place their first order, get ₹100 instant wallet credit.
              </p>

              <button
                id="mid-banner-refer-btn"
                onClick={handleReferClick}
                style={{
                  background: '#064E3B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
                }}
              >
                <span>Refer Now</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right Side: High-Resolution 3D Image Asset */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '46%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <motion.img
                src="/banners/banner_refer_earn.jpg"
                alt="Refer a Friend Rewards"
                whileHover={{ scale: 1.05, x: 4 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Aliased export for compatibility with existing Home.tsx references
export const ReferAndEarnBanner: React.FC = () => null;

// ============================================================================
// Bottom Section: 3-Banner Grid (Guarantees, App Download, 24/7 Support)
// ============================================================================
export const PreFooterBanners: React.FC = () => {
  return (
    <section style={{ margin: '36px 0 28px' }}>
      <div className="container">
        <div
          className="modular-banner-grid-3"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {/* Card 1: 9-Minute Delivery Guarantee */}
          <motion.div
            whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(7, 27, 82, 0.08)' }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={26} strokeWidth={2.4} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#071B52', margin: '0 0 3px' }}>
                9-Minute Delivery
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Directly from our hyperlocal dark store network in Ahmedabad.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Mobile App Download */}
          <motion.div
            whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(7, 27, 82, 0.08)' }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#FDF2F8',
                color: '#DB2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Smartphone size={26} strokeWidth={2.4} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#071B52', margin: '0 0 3px' }}>
                Get the WormUp App
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Faster checkout, live rider tracking, and exclusive daily coins.
              </p>
            </div>
          </motion.div>

          {/* Card 3: 24/7 Live Customer Care */}
          <motion.div
            whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(7, 27, 82, 0.08)' }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#F0FDF4',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Headphones size={26} strokeWidth={2.4} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#071B52', margin: '0 0 3px' }}>
                24/7 Dedicated Support
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Instant replacements and hassle-free 1-minute refund support.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// Section: Up to ₹2,000 Monthly Benefits Banner (Matches Mobile App Section 11)
// ============================================================================
export const MonthlyBenefitsBanner: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { isAuthenticated, openLoginModal } = useAuth();

  const handleJoinClick = () => {
    if (!isAuthenticated) {
      openLoginModal();
    } else {
      navigateTo('account', { accountTab: 'wallet' });
    }
  };

  return (
    <section style={{ margin: '32px 0 42px' }}>
      <div className="container">
        <motion.div
          whileHover={{ y: -4, scale: 1.008, boxShadow: '0 20px 42px rgba(7, 27, 82, 0.14)' }}
          transition={{ duration: 0.22 }}
          onClick={handleJoinClick}
          style={{
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#F2EEFF',
            boxShadow: '0 10px 30px rgba(7, 27, 82, 0.08)',
            border: '1.5px solid #E2D8FD',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <img
            src="/banners/offer2000.png"
            alt="Up to ₹2,000 Monthly Benefits. Shop, Save, Get Rewarded. Join Free"
            style={{
              width: '100%',
              height: 'auto',
              minHeight: '220px',
              aspectRatio: '1024 / 288',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </motion.div>
      </div>
    </section>
  );
};
