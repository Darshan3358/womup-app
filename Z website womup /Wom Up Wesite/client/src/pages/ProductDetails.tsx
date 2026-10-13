import React, { useState, useEffect } from 'react';
import { ChevronRight, Star, Heart, ShoppingBag, ArrowRight, Zap, Check } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { fetchProductById } from '../services/api';
import type { Product, ProductVariant } from '../types';

export const ProductDetails: React.FC = () => {
  const { selectedProduct, navigateTo, dbProducts, selectedAreaName, resolvedLocation } = useNavigation();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [liveProduct, setLiveProduct] = useState<Product | null>(null);

  const savedProdId = typeof window !== 'undefined' ? localStorage.getItem('wormup_selected_product_id') || '' : '';
  const baseProduct = selectedProduct || (savedProdId ? dbProducts.find((p) => String(p.id || p._id) === savedProdId) : null) || dbProducts[0];
  const prodId = (baseProduct ? String(baseProduct.id || baseProduct._id) : savedProdId);

  // Fetch fresh area-specific pricing for this product on load and whenever area changes
  useEffect(() => {
    if (!prodId) return;
    let isMounted = true;
    fetchProductById(prodId, {
      areaId: resolvedLocation?.areaId,
      storeId: resolvedLocation?.storeId,
    })
      .then((data) => {
        if (isMounted && data) {
          setLiveProduct(data);
          try {
            localStorage.setItem('wormup_selected_product_id', String(data.id || data._id));
          } catch {}
        }
      })
      .catch((e) => console.warn('[ProductDetails] Error fetching area pricing for product:', e));

    return () => {
      isMounted = false;
    };
  }, [prodId, resolvedLocation?.areaId, resolvedLocation?.storeId]);

  const product = liveProduct || baseProduct;

  // Variant support & state - declared before any conditional return
  const defaultVar = (product?.variants && product.variants.find((v) => v.isDefault)) || (product?.variants && product.variants[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVar);

  const mainImage = product?.image || product?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
  const [activeImg, setActiveImg] = useState<string>(mainImage);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  useEffect(() => {
    if (!product) return;
    const img = product.image || product.imageUrl || mainImage;
    if (img) setActiveImg(img);
    const def = (product.variants && product.variants.find((v) => v.isDefault)) || (product.variants && product.variants[0]);
    setSelectedVariant((prev) => {
      if (prev && product.variants) {
        const match = product.variants.find((v) => (v.id && prev.id && v.id === prev.id) || v.label === prev.label);
        if (match) return match;
      }
      return def;
    });
  }, [product, mainImage]);

  if (!product) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#071B52', fontWeight: 800 }}>Loading product details...</h2>
        <p style={{ color: '#667085', marginTop: '8px' }}>Fetching live information from {resolvedLocation?.storeName || 'store'}</p>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => navigateTo('shop')}>
          Browse Catalog
        </button>
      </div>
    );
  }

  const quantity = getItemQuantity(prodId);

  const effectivePrice = selectedVariant ? selectedVariant.price : (product.price || product.sellingPrice || 0);
  const effectiveMrp = selectedVariant ? (selectedVariant.mrp || effectivePrice) : (product.oldPrice || product.mrp || effectivePrice);
  const effectiveDiscount = selectedVariant ? (selectedVariant.discountPercent || 0) : (product.discount || product.discountPercent || 0);
  const effectiveLabel = selectedVariant ? selectedVariant.label : (product.unit || product.quantityLabel || '1 unit');
  const isWishlisted = isInWishlist(prodId);

  const gallery = (product.gallery && product.gallery.length > 0) ? product.gallery : (product.images || [mainImage]);
  const similarProducts = dbProducts.filter((p) => p.categorySlug === product.categorySlug && (p.id || p._id) !== prodId).slice(0, 4);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      openLoginModal({ product, variant: selectedVariant });
      return;
    }
    addToCart(product, selectedVariant);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      openLoginModal({ product, variant: selectedVariant });
      return;
    }
    if (quantity === 0) {
      addToCart(product, selectedVariant);
    }
    navigateTo('cart');
  };

  return (
    <div className="product-details-root" style={{ padding: '24px 0 60px' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#667085', marginBottom: '24px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('home')}>Home</span>
          <ChevronRight size={14} />
          <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('shop')}>Shop</span>
          <ChevronRight size={14} />
          <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('shop', { categorySlug: product.categorySlug })}>
            {product.category}
          </span>
          <ChevronRight size={14} />
          <span style={{ color: '#071B52', fontWeight: 700 }}>{product.name}</span>
        </div>

        {/* Top Product Section: 2 Columns */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E6EAF2',
            padding: '36px',
            boxShadow: '0 4px 20px rgba(7, 27, 82, 0.05)',
            display: 'grid',
            gridTemplateColumns: '1fr 1.1fr',
            gap: '48px',
            marginBottom: '40px',
          }}
        >
          {/* Left: Gallery */}
          <div>
            <div
              style={{
                width: '100%',
                height: '400px',
                borderRadius: '20px',
                background: '#FAFAFC',
                border: '1px solid #E6EAF2',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={activeImg}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }}
              />

              {effectiveDiscount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '18px',
                    left: '18px',
                    background: '#FF3B98',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '6px',
                  }}
                >
                  {effectiveDiscount}% OFF
                </span>
              )}

              <button
                onClick={() => toggleWishlist(product)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: isWishlisted ? '#FFF1F2' : '#FFFFFF',
                  border: isWishlisted ? '1.5px solid #FECDD3' : '1.5px solid #F1F5F9',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  color: isWishlisted ? '#E11D48' : '#64748B',
                  transition: 'all 0.2s ease',
                }}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart size={20} fill={isWishlisted ? '#E11D48' : 'none'} color={isWishlisted ? '#E11D48' : '#64748B'} />
              </button>
            </div>

            {/* Thumbnails row */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImg === img ? '2.5px solid #FF3B98' : '1px solid #E6EAF2',
                    transition: 'border 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FAFAFC',
                  }}
                >
                  <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#7856F6', background: '#F8F2FF', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                {product.brand}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#667085' }}>• {effectiveLabel}</span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#071B52', lineHeight: 1.25, marginBottom: '12px' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#13B978', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 800 }}>
                <Star size={14} fill="currentColor" />
                <span>{product.rating}</span>
              </div>
              <span style={{ fontSize: '0.88rem', color: '#667085', fontWeight: 500 }}>
                {product.reviewCount} customer ratings • Verified Freshness
              </span>
            </div>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', padding: '16px 20px', background: '#F8F2FF', borderRadius: '14px', marginBottom: '12px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#071B52' }}>
                ₹{effectivePrice}
              </span>
              {effectiveMrp > effectivePrice && (
                <span style={{ fontSize: '1.2rem', color: '#667085', textDecoration: 'line-through' }}>
                  ₹{effectiveMrp}
                </span>
              )}
              {effectiveDiscount > 0 && (
                <span style={{ fontSize: '0.92rem', color: '#FF3B98', fontWeight: 800, marginLeft: 'auto' }}>
                  Save ₹{effectiveMrp - effectivePrice} ({effectiveDiscount}% OFF)
                </span>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 1 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#071B52', marginBottom: '8px' }}>
                  Select Quantity Pack:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: selectedVariant?.id === v.id ? '2px solid #7856F6' : '1px solid #CBD5E1',
                        background: selectedVariant?.id === v.id ? '#F8F2FF' : '#FFFFFF',
                        color: selectedVariant?.id === v.id ? '#7856F6' : '#14224A',
                        fontWeight: selectedVariant?.id === v.id ? 800 : 600,
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                      }}
                    >
                      <span>{v.label}</span>
                      <span style={{ marginLeft: '6px', color: '#13B978', fontWeight: 800 }}>₹{v.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#7856F6', fontWeight: 600, marginBottom: '20px' }}>
              <span>📍 Stocked at <strong>{resolvedLocation.storeName}</strong> ({resolvedLocation.deliveryMinutes || 9} min delivery to {selectedAreaName})</span>
            </div>

            {/* Quality Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', background: '#EEF9F3', color: '#1FA463', padding: '6px 12px', borderRadius: '8px', fontWeight: 600 }}>
                <Check size={14} /> 100% Farm Fresh
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', background: '#FFF8E1', color: '#B45309', padding: '6px 12px', borderRadius: '8px', fontWeight: 600 }}>
                <Zap size={14} /> Earn {product.shoppingCoins || 10} WormUp Coins
              </span>
            </div>

            {/* Description */}
            <p style={{ color: '#667085', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {product.description || 'Premium quality grocery essential, sourced directly from verified manufacturers and farms.'}
            </p>

            {/* Quantity and Actions */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: 'auto' }}>
              {quantity === 0 ? (
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '14px 28px', fontSize: '1rem' }}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag size={20} />
                  <span>Add to Cart • ₹{effectivePrice}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div className="stepper-ctrl" style={{ padding: '8px 18px', flex: 1, justifyContent: 'space-between', background: '#13B978', color: '#fff', borderRadius: '12px' }}>
                    <button className="stepper-btn" style={{ color: '#fff' }} onClick={() => updateQuantity(prodId, quantity - 1)}>
                      -
                    </button>
                    <span className="stepper-val" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{quantity} in Cart</span>
                    <button className="stepper-btn" style={{ color: '#fff' }} onClick={() => updateQuantity(prodId, quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                className="btn-secondary"
                style={{ flex: 0.8, padding: '14px 24px', fontSize: '1rem', borderColor: '#071B52' }}
                onClick={handleBuyNow}
              >
                <span>Checkout Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabbed Content: Description, Specifications, Reviews */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E6EAF2',
            padding: '32px',
            marginBottom: '48px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #E6EAF2', paddingBottom: '14px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('desc')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: activeTab === 'desc' ? '#FF3B98' : '#667085',
                borderBottom: activeTab === 'desc' ? '3px solid #FF3B98' : 'none',
                paddingBottom: '8px',
                cursor: 'pointer',
              }}
            >
              Description & Sourcing
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: activeTab === 'specs' ? '#FF3B98' : '#667085',
                borderBottom: activeTab === 'specs' ? '3px solid #FF3B98' : 'none',
                paddingBottom: '8px',
                cursor: 'pointer',
              }}
            >
              Specifications & FSSAI
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: activeTab === 'reviews' ? '#FF3B98' : '#667085',
                borderBottom: activeTab === 'reviews' ? '3px solid #FF3B98' : 'none',
                paddingBottom: '8px',
                cursor: 'pointer',
              }}
            >
              Customer Ratings ({product.reviewCount})
            </button>
          </div>

          {activeTab === 'desc' && (
            <div style={{ color: '#14224A', lineHeight: 1.7, fontSize: '0.95rem' }}>
              <p style={{ marginBottom: '12px' }}>{product.description || 'Pure quality groceries stored in dark store temperature-controlled chambers.'}</p>
              <p>
                Every morning, fresh items are received and audited before entering the dark store racks. Packed immediately upon order receipt and delivered in tamper-evident sealed bags.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{key}</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#071B52', marginTop: '2px' }}>{val}</div>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>SHELF LIFE</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#071B52', marginTop: '2px' }}>7 - 14 Days</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ORIGIN / SOURCING</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#071B52', marginTop: '2px' }}>Gujarat Direct Farms</div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#071B52' }}>{product.rating}</div>
                <div>
                  <div style={{ display: 'flex', gap: '4px', color: '#FFB800' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#667085', marginTop: '4px' }}>
                    Based on {product.reviewCount} verified purchases in Ahmedabad
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#071B52', marginBottom: '18px' }}>
              Similar in {product.category}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
              {similarProducts.map((p) => (
                <ProductCard key={p.id || p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
