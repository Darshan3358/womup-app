import React, { useState } from 'react';
import { X, Star, ShieldCheck, Clock, Plus, Minus, ShoppingBag, Heart } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { navigateTo } = useNavigation();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [activeImage, setActiveImage] = useState<string>('');

  if (!product) return null;

  const prodId = (product.id || product._id) as string;
  const quantity = getItemQuantity(prodId);
  const currentImage = activeImage || product.image;
  const gallery = product.gallery || [product.image];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 22, 63, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '820px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#F8F2FF',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#071B52',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* Gallery Column */}
        <div style={{ background: '#FAFAFC', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '280px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
            <img
              src={currentImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: '100%' }}>
            {gallery.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="thumb"
                onClick={() => setActiveImage(img)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: currentImage === img ? '2px solid #FF3B98' : '1px solid #E6EAF2',
                }}
              />
            ))}
          </div>
        </div>

        {/* Info Column */}
        <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.8rem', color: '#667085', fontWeight: 600, textTransform: 'uppercase' }}>
            {product.category} • {product.brand}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#071B52', margin: '4px 0 10px' }}>
            {product.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#13B978', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              <Star size={13} fill="currentColor" />
              <span>{product.rating}</span>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#667085' }}>
              ({product.reviewCount} verified reviews)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#071B52' }}>
              ₹{product.price}
            </span>
            {product.oldPrice && (
              <span style={{ fontSize: '1rem', color: '#667085', textDecoration: 'line-through' }}>
                ₹{product.oldPrice}
              </span>
            )}
            {product.discount && (
              <span style={{ fontSize: '0.85rem', color: '#FF3B98', fontWeight: 700, background: '#FFF1F8', padding: '2px 8px', borderRadius: '4px' }}>
                {product.discount}% OFF
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.88rem', color: '#667085', lineHeight: 1.5, marginBottom: '20px' }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', gap: '16px', background: '#F8F2FF', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#7856F6', fontWeight: 600 }}>
              <Clock size={16} />
              <span>10 Min Delivery</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#13B978', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>100% Quality Guaranteed</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            {quantity === 0 ? (
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (!isAuthenticated) {
                    onClose();
                    openLoginModal({ product });
                    return;
                  }
                  addToCart(product);
                }}
              >
                <ShoppingBag size={18} />
                <span>Add to Cart (₹{product.price})</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div className="stepper-ctrl" style={{ padding: '8px 16px', flex: 1, justifyContent: 'space-between' }}>
                  <button className="stepper-btn" onClick={() => updateQuantity(prodId, quantity - 1)}>
                    <Minus size={16} />
                  </button>
                  <span className="stepper-val" style={{ fontSize: '1rem' }}>{quantity} in Cart</span>
                  <button className="stepper-btn" onClick={() => updateQuantity(prodId, quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => toggleWishlist(product)}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                border: isInWishlist(prodId) ? '1.5px solid #FECDD3' : '1.5px solid #E2E8F0',
                background: isInWishlist(prodId) ? '#FFF1F2' : '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isInWishlist(prodId) ? '#E11D48' : '#64748B',
                transition: 'all 0.15s ease',
              }}
              title={isInWishlist(prodId) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label={isInWishlist(prodId) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart
                size={20}
                fill={isInWishlist(prodId) ? '#E11D48' : 'none'}
                color={isInWishlist(prodId) ? '#E11D48' : '#64748B'}
              />
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                onClose();
                navigateTo('product', { product });
              }}
            >
              Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
