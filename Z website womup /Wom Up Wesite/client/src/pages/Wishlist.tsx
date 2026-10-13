import React from 'react';
import { Heart, Trash2, ArrowLeft, ShoppingBag, Sparkles, ShoppingCart, Zap } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';

export const Wishlist: React.FC = () => {
  const { wishlist, clearWishlist, totalWishlistItems } = useWishlist();
  const { navigateTo } = useNavigation();
  const { addToCart } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();

  const handleAddAllToCart = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    wishlist.forEach((product) => {
      addToCart(product);
    });
  };

  return (
    <div className="wishlist-page" style={{ minHeight: '80vh', padding: '24px 0 60px 0', background: '#F8FAFC' }}>
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
          <span 
            onClick={() => navigateTo('home')} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#071B52' }}
          >
            <ArrowLeft size={14} /> Home
          </span>
          <span>/</span>
          <span style={{ color: '#FF3B98', fontWeight: 700 }}>My Wishlist</span>
        </div>

        {/* Website Style Wishlist Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F9 100%)',
            borderRadius: '20px',
            border: '1px solid #FFE4EE',
            padding: '28px 32px',
            marginBottom: '32px',
            boxShadow: '0 10px 30px rgba(255, 59, 152, 0.05)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(255, 59, 152, 0.3)',
                }}
              >
                <Heart size={22} fill="#FFFFFF" />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#071B52', margin: 0, letterSpacing: '-0.5px' }}>
                My Wishlist
              </h1>
              <span
                style={{
                  background: '#FFE4EE',
                  color: '#FF3B98',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                }}
              >
                {totalWishlistItems} {totalWishlistItems === 1 ? 'item' : 'items'} saved
              </span>
            </div>

            <p style={{ color: '#64748B', fontSize: '0.95rem', margin: '0 0 12px 0' }}>
              Showing products liked by your account with live prices and fast 9-min delivery.
            </p>

            {/* Notification alert pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '10px',
              }}
            >
              <Sparkles size={14} color="#D97706" />
              <span>Prices and 9-minute lightning delivery are updated live for your area.</span>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {totalWishlistItems > 0 && (
              <>
                <button
                  onClick={handleAddAllToCart}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px 20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <ShoppingCart size={16} />
                  <span>Add All to Cart</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your wishlist?')) {
                      clearWishlist();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FFFFFF',
                    color: '#EF4444',
                    border: '1.5px solid #FECACA',
                    borderRadius: '12px',
                    padding: '11px 18px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FEF2F2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <Trash2 size={16} />
                  <span>Clear All</span>
                </button>
              </>
            )}

            <button
              onClick={() => navigateTo('shop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                color: '#071B52',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                padding: '11px 20px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#071B52';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <ShoppingBag size={16} />
              <span>Explore Products</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {totalWishlistItems === 0 ? (
          /* Premium Empty Wishlist State */
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E6EAF2',
              padding: '60px 24px',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
                color: '#FF3B98',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                boxShadow: '0 8px 24px rgba(255, 59, 152, 0.15)',
              }}
            >
              <Heart size={44} fill="#FF3B98" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#071B52', marginBottom: '10px' }}>
              Your Wishlist is Empty
            </h2>

            <p style={{ color: '#64748B', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 28px auto', lineHeight: '1.6' }}>
              Explore our fresh produce, pantry essentials, and snacks. Tap the heart icon on any product to save it here for fast ordering.
            </p>

            {/* Quick category pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
              {['Vegetables & Fruits', 'Dairy & Bread', 'Atta, Rice & Dal', 'Snacks & Munchies', 'Cold Drinks'].map((cat) => (
                <span
                  key={cat}
                  onClick={() => navigateTo('shop')}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FF3B98';
                    e.currentTarget.style.color = '#FF3B98';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            <button
              onClick={() => navigateTo('shop')}
              style={{
                background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 36px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(255, 59, 152, 0.35)',
                transition: 'transform 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <ShoppingBag size={18} />
              <span>Start Shopping</span>
            </button>
          </div>
        ) : (
          /* Responsive Website Product Grid */
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '24px',
              }}
            >
              {wishlist.map((prod) => (
                <ProductCard key={prod.id || prod._id} product={prod} />
              ))}
            </div>

            {/* Bottom shopping summary bar */}
            <div
              style={{
                marginTop: '40px',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E6EAF2',
                padding: '20px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.92rem' }}>
                    Instant 9-Minute Express Delivery Available
                  </div>
                  <div style={{ color: '#64748B', fontSize: '0.82rem' }}>
                    Items in your cart deliver from the nearest dark store in your area.
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigateTo('shop')}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: '#071B52',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
