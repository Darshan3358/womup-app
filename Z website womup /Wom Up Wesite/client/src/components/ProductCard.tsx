import React, { useState, useEffect, useRef } from 'react';
import { Heart, Plus, Minus, Eye, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { navigateTo } = useNavigation();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Variant selection support
  const defaultVar =
    (product.variants && product.variants.find((v) => v.isDefault)) ||
    (product.variants && product.variants[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVar);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selectedVariant when area prices or variants update
  useEffect(() => {
    const def =
      (product.variants && product.variants.find((v) => v.isDefault)) ||
      (product.variants && product.variants[0]);
    setSelectedVariant((prev) => {
      if (prev && product.variants) {
        const match = product.variants.find(
          (v) => (v.id && prev.id && v.id === prev.id) || v.label === prev.label
        );
        if (match) return match;
      }
      return def;
    });
  }, [product.variants, product.price, product.sellingPrice]);

  const prodId = (product.id || product._id) as string;
  const quantity = getItemQuantity(prodId);

  const effectivePrice = selectedVariant
    ? selectedVariant.price
    : product.price || product.sellingPrice || 0;
  const effectiveMrp = selectedVariant
    ? selectedVariant.mrp || effectivePrice
    : product.oldPrice || product.mrp || effectivePrice;
  const effectiveDiscount = selectedVariant
    ? selectedVariant.discountPercent || 0
    : product.discount || product.discountPercent || 0;
  const effectiveLabel = selectedVariant
    ? selectedVariant.label
    : product.unit || product.quantityLabel || '1 unit';

  // Image sanitization & fallback handling
  const getSanitizedProductImage = (p: Product): string => {
    const url = p.image || p.imageUrl || '';
    if (!url || url.includes('photo-1518977676405')) {
      if (p.name?.toLowerCase().includes('potato')) {
        return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80';
      }
    }
    return url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getSanitizedProductImage(product));

  useEffect(() => {
    setImgSrc(getSanitizedProductImage(product));
  }, [product.image, product.imageUrl, product.name]);

  // Close variant dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <motion.div
      className="product-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        background: 'transparent',
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Top Image area: Standardized Aspect-Ratio 1:1, Clean Background */}
      <div
        className="product-image-container"
        onClick={() => navigateTo('product', { product })}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#F8FAFC',
          borderRadius: '16px',
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
          border: '1px solid #F1F5F9',
        }}
      >
        <img
          src={imgSrc}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
          onError={() => {
            if (product.name?.toLowerCase().includes('potato')) {
              setImgSrc(
                'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80'
              );
            } else if (product.name?.toLowerCase().includes('tomato')) {
              setImgSrc(
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
              );
            } else {
              setImgSrc(
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
              );
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.35s ease',
          }}
        />

        {/* Discount Badge */}
        {effectiveDiscount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: '#FF3B98',
              color: '#FFFFFF',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '5px',
              boxShadow: '0 2px 6px rgba(255, 59, 152, 0.3)',
            }}
          >
            {effectiveDiscount}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 1.3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              openLoginModal();
              return;
            }
            toggleWishlist(product);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: isInWishlist(prodId) ? '#FFF1F2' : 'rgba(255, 255, 255, 0.92)',
            border: isInWishlist(prodId) ? '1px solid #FECDD3' : '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            color: isInWishlist(prodId) ? '#E11D48' : '#94A3B8',
            zIndex: 3,
          }}
          aria-label={isInWishlist(prodId) ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart
            size={14}
            fill={isInWishlist(prodId) ? '#E11D48' : 'none'}
            color={isInWishlist(prodId) ? '#E11D48' : '#64748B'}
          />
        </motion.button>

        {/* Quick View Button on Hover */}
        <button
          className="product-quickview-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickView) onQuickView(product);
            else navigateTo('product', { product });
          }}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#071B52',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
          }}
        >
          <Eye size={11} />
          <span>View</span>
        </button>
      </div>

      {/* Product Content - Compact Blinkit Style */}
      <div
        style={{
          padding: '10px 4px 4px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Brand & Stock */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '3px',
            }}
          >
            <span style={{ fontSize: '0.70rem', color: '#64748B', fontWeight: 600 }}>
              {product.brand}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: '#16A34A',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Check size={10} strokeWidth={3} /> In Stock
            </span>
          </div>

          {/* Title - Max 2 Lines Clamped */}
          <h3
            onClick={() => navigateTo('product', { product })}
            title={product.name}
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#071B52',
              marginBottom: '6px',
              cursor: 'pointer',
              lineHeight: 1.25,
              height: '2.5em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.name}
          </h3>

          {/* Variant Selector: Compact Dropdown vs. Plain Text */}
          {product.variants && product.variants.length > 1 ? (
            <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <span>{selectedVariant?.label || effectiveLabel}</span>
                <ChevronDown size={11} color="#64748B" />
              </button>

              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '3px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 40,
                    minWidth: '120px',
                    overflow: 'hidden',
                  }}
                >
                  {product.variants.map((v) => (
                    <div
                      key={v.id || v.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariant(v);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.76rem',
                        fontWeight: selectedVariant?.label === v.label ? 700 : 500,
                        background: selectedVariant?.label === v.label ? '#F0FDF4' : '#FFFFFF',
                        color: selectedVariant?.label === v.label ? '#16A34A' : '#1F2937',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{v.label}</span>
                      <span style={{ color: '#64748B' }}>₹{v.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.74rem',
                color: '#64748B',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              {effectiveLabel}
            </div>
          )}

        </div>

        {/* Pricing & Add to Cart Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '6px',
            borderTop: 'none',
          }}
        >
          <div>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#071B52' }}>
              ₹{effectivePrice}
            </div>
            {effectiveMrp > effectivePrice && (
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                ₹{effectiveMrp}
              </div>
            )}
          </div>

          {/* Add to Cart / Quantity Stepper */}
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                whileHover={{
                  scale: 1.04,
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    openLoginModal({ product, variant: selectedVariant });
                    return;
                  }
                  addToCart(product, selectedVariant);
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#16A34A',
                  border: '1.5px solid #16A34A',
                  borderRadius: '8px',
                  padding: '5px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                ADD
              </motion.button>
            ) : (
              <motion.div
                key="qty-stepper"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '3px 6px',
                  gap: '6px',
                  boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)',
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => updateQuantity(prodId, quantity - 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                >
                  <Minus size={13} strokeWidth={3} />
                </motion.button>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '14px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => updateQuantity(prodId, quantity + 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                >
                  <Plus size={13} strokeWidth={3} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
