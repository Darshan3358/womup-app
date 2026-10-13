import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Tag, Sparkles, ChevronDown, ChevronUp, Info, CheckCircle2, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { LocationPickerModal } from './LocationPickerModal';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    mrpTotal,
    productDiscount,
    distanceKm,
    ratePerKm,
    deliveryFee,
    platformFee,
    totalSavings,
    couponDiscount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    useCoins,
    setUseCoins,
    coinDiscount,
    total,
    totalItems,
    userCoins,
    cartNotification,
    clearCartNotification,
  } = useCart();

  const { isAuthenticated, openLoginModal } = useAuth();
  const { navigateTo, resolvedLocation, selectedAreaName } = useNavigation();
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  if (!isCartOpen) return null;

  const storeDisplayName = resolvedLocation?.storeName || (selectedAreaName ? `Wom Up ${selectedAreaName} Dark Store` : 'Wom Up Dark Store');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCoupon(couponInput);
    if (ok) {
      setCouponMsg({ text: `Coupon ${couponInput.toUpperCase()} applied successfully!` });
      setCouponInput('');
    } else {
      setCouponMsg({ text: 'Invalid coupon. Try WORMUP50 or FIRST100', error: true });
    }
  };

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="#FF3B98" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#071B52' }}>
              Your Cart ({totalItems})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: '#F8F2FF',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#071B52',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div style={{ padding: '12px 24px', background: subtotal >= 149 ? '#EEF9F3' : '#F8F2FF', borderBottom: '1px solid #E6EAF2', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color={subtotal >= 149 ? '#13B978' : '#7856F6'} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#14224A' }}>
            {subtotal >= 149
              ? '🎉 You unlocked FREE Instant 10-Min Delivery!'
              : `Add ₹${149 - subtotal} more to unlock FREE Delivery!`}
          </span>
        </div>

        {/* Dynamic Price Adjustment / Store Switch Alert Banner */}
        {cartNotification && (
          <div
            style={{
              padding: '10px 18px',
              background: '#FFFBEB',
              borderBottom: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#B45309' }}>
              ℹ️ {cartNotification}
            </span>
            <button
              onClick={clearCartNotification}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontSize: '13px', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        {cart.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: '#F8F2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7856F6',
                marginBottom: '16px',
              }}
            >
              <ShoppingBag size={38} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', marginBottom: '6px' }}>
              Your Cart is Empty
            </h4>
            <p style={{ color: '#667085', fontSize: '0.88rem', maxWidth: '260px', marginBottom: '20px' }}>
              Explore farm-fresh produce, groceries, and daily essentials delivered in 10 mins.
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                setIsCartOpen(false);
                navigateTo('shop');
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-drawer-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Delivering from {storeDisplayName}
              </span>
              <button
                onClick={clearCart}
                style={{ background: 'none', border: 'none', color: '#667085', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={13} /> Clear
              </button>
            </div>

            {/* Cart Items list */}
            {cart.map((item, idx) => {
              const prodId = (item.product.id || item.product._id) as string;
              const unitPrice = item.selectedVariant?.price || item.product.price || item.product.sellingPrice || 0;
              const unitMrp = item.selectedVariant
                ? (item.selectedVariant.mrp || unitPrice)
                : (item.product.mrp || item.product.oldPrice || unitPrice);
              const unitLabel = item.selectedVariant?.label || item.product.unit || '1 unit';

              return (
                <div
                  key={`${prodId}_${item.selectedVariant?.label || 'default'}_${idx}`}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #E6EAF2',
                    background: '#FFFFFF',
                  }}
                >
                  <img
                    src={item.product.image || item.product.imageUrl}
                    alt={item.product.name}
                    style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#071B52', lineHeight: 1.3 }}>
                          {item.product.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#667085' }}>
                          {unitLabel}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(prodId)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontWeight: 800, color: '#071B52', fontSize: '0.95rem' }}>
                          ₹{unitPrice * item.quantity}
                        </span>
                        {unitMrp > unitPrice && (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                            ₹{unitMrp * item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="stepper-ctrl" style={{ padding: '2px 6px' }}>
                        <button className="stepper-btn" onClick={() => updateQuantity(prodId, item.quantity - 1)}>
                          -
                        </button>
                        <span className="stepper-val">{item.quantity}</span>
                        <button className="stepper-btn" onClick={() => updateQuantity(prodId, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* WormUp Coins Redemption Toggle */}
            <div
              style={{
                background: '#F8F2FF',
                border: '1px solid #EEE6FF',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#FF3B98" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52' }}>
                      WormUp Coins Wallet
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#667085' }}>
                      You have {userCoins} coins available (1 Coin = ₹1)
                    </div>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useCoins}
                    onChange={(e) => setUseCoins(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#FF3B98' }}
                  />
                </label>
              </div>

              {useCoins && (
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#13B978', fontWeight: 700 }}>
                  ✓ Saving ₹{coinDiscount} with WormUp Coins!
                </div>
              )}
            </div>

            {/* Promo Code Input */}
            <div>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#FAFAFC', border: '1px solid #E6EAF2', borderRadius: '10px', padding: '0 10px' }}>
                  <Tag size={16} color="#7856F6" />
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. WORMUP50)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.8rem', color: '#13B978', fontWeight: 600 }}>
                  <span>✓ Applied: {appliedCoupon} (-₹{couponDiscount})</span>
                  <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem' }}>
                    Remove
                  </button>
                </div>
              )}

              {couponMsg && !appliedCoupon && (
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: couponMsg.error ? '#EF4444' : '#13B978' }}>
                  {couponMsg.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Billing Details */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer" style={{ padding: '16px 20px', background: '#FFFFFF', borderTop: '1px solid #E6EAF2' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#071B52', marginBottom: '14px' }}>
              Bill Details
            </h4>

            {/* Item Total (MRP) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475467', marginBottom: '8px' }}>
              <span>Item Total (MRP)</span>
              <span style={{ fontWeight: 600, color: '#071B52' }}>₹{mrpTotal}</span>
            </div>

            {/* Product Discount */}
            {productDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10B981', marginBottom: '8px', fontWeight: 600 }}>
                <span>Product Discount</span>
                <span>- ₹{productDiscount}</span>
              </div>
            )}

            {/* Delivery Partner Fee */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.88rem', color: '#475467' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 500 }}>Delivery Partner Fee</span>
                    <button
                      type="button"
                      onClick={() => setShowFeeDetails(!showFeeDetails)}
                      style={{
                        background: '#EEF2FF',
                        border: 'none',
                        color: '#4F46E5',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Info size={11} color="#4F46E5" />
                      <span>{showFeeDetails ? 'Hide math' : 'Why this fee?'}</span>
                      {showFeeDetails ? <ChevronUp size={11} color="#4F46E5" /> : <ChevronDown size={11} color="#4F46E5" />}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#667085', marginTop: '2px' }}>
                    {distanceKm} km · ₹{ratePerKm}/km
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#071B52' }}>₹{deliveryFee}</span>
              </div>

              {showFeeDetails && (
                <div style={{ marginTop: '8px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.76rem', color: '#475467', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>• <strong>Route Distance:</strong> {distanceKm} km from dark store to your address</div>
                  <div>• <strong>Base Math:</strong> {distanceKm} km × ₹{ratePerKm}/km = ₹{deliveryFee}</div>
                  <div>• <strong>Fair Rider Guarantee:</strong> 100% of this fee goes directly to your delivery partner</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={12} color="#059669" />
                <span>100% of delivery fee is paid to your delivery partner</span>
              </div>
            </div>

            {/* Handling & Convenience Fee */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475467', marginBottom: '8px' }}>
              <span>Handling & Convenience Fee</span>
              <span style={{ fontWeight: 600, color: '#071B52' }}>₹{platformFee}</span>
            </div>

            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10B981', marginBottom: '8px', fontWeight: 600 }}>
                <span>Coupon Discount ({appliedCoupon})</span>
                <span>- ₹{couponDiscount}</span>
              </div>
            )}

            {coinDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#FF3B98', marginBottom: '8px', fontWeight: 600 }}>
                <span>WormUp Coins Redeemed</span>
                <span>- ₹{coinDiscount}</span>
              </div>
            )}

            {/* Total / To Pay */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#071B52', paddingTop: '12px', borderTop: '1px dashed #E6EAF2', marginTop: '8px' }}>
              <span>To Pay</span>
              <span style={{ color: '#071B52' }}>₹{total}</span>
            </div>

            {/* Savings banner */}
            {totalSavings > 0 && (
              <div style={{
                marginTop: '12px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                padding: '8px 12px',
                color: '#065F46',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>🎉 You are saving ₹{totalSavings} on this order</span>
              </div>
            )}

            {/* Delivery Destination Confirmation */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <MapPin size={16} color="#7856F6" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: '#071B52', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#64748B' }}>Deliver to: </span>
                  <strong>{selectedAreaName || resolvedLocation.areaName || 'Chandlodiya - Tragad'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7856F6',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                Change
              </button>
            </div>

            <button
              id="cart-drawer-checkout-btn"
              className="btn-primary"
              style={{ width: '100%', marginTop: '14px', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.96rem', fontWeight: 700 }}
              onClick={() => {
                if (!isAuthenticated) {
                  openLoginModal();
                  return;
                }
                setIsCartOpen(false);
                navigateTo('checkout');
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
};
