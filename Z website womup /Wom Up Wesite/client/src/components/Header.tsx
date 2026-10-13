import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  User as UserIcon,
  ChevronDown,
  X,
  Navigation,
  Check,
  Package,
  Wallet,
  Menu,
  LogOut,
  PhoneCall,
  FileText,
  Heart
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types';
import { LocationPickerModal } from './LocationPickerModal';

export const Header: React.FC = () => {
  const {
    navigateTo,
    searchQuery,
    setSearchQuery,
    selectedAreaName,
    setSelectedAreaName,
    resolvedLocation,
    availableAreas,
    detectUserLocation,
    isDetectingLocation,
    locationError,
    liveCategories,
    dbProducts,
  } = useNavigation();

  const { totalItems, total, setIsCartOpen, addToCart, getItemQuantity } = useCart();
  const { user, isAuthenticated, openLoginModal, logout } = useAuth();
  const { totalWishlistItems } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Smooth scroll listener to auto-hide top announcement strip
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 35);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setShowCategoriesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions: Product[] =
    searchQuery.trim() === ''
      ? []
      : dbProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 6);

  return (
    <header className="site-header-two-tier" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* ====================================================================
          HEADER BAR 1: Informational Top Strip (Smooth Slide-Hide on Scroll)
          ==================================================================== */}
      <div
        style={{
          background: '#071B52',
          color: '#FFFFFF',
          fontSize: '0.8rem',
          maxHeight: isScrolled ? '0px' : '45px',
          opacity: isScrolled ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
          borderBottom: isScrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '7px',
          }}
        >
          {/* Left: 9-Min Delivery Badge + Free Delivery note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#FF3B98',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                padding: '2px 9px',
                borderRadius: '12px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 6px rgba(255, 59, 152, 0.4)',
              }}
            >
              ⚡ 9-MIN DELIVERY
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.92)', fontWeight: 500 }}>
              Order grocery & essentials in Ahmedabad | Free delivery on orders above ₹199
            </span>
          </div>

          {/* Right: Quick Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <span
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.15s' }}
              onClick={() => navigateTo('printing')}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B98')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              <FileText size={13} color="#FF3B98" />
              <span>Document Printing (10 mins)</span>
            </span>

            <span
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.15s' }}
              onClick={() => navigateTo('features')}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B98')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              <span>💡 Benefits</span>
            </span>

            <span
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.15s' }}
              onClick={() => alert('WormUp 24/7 Helpline: 1800-200-9676 | Email: care@wormup.in')}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B98')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              <PhoneCall size={12} color="#10B981" />
              <span>Help Center</span>
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          HEADER BAR 2: Main Navigation (White Background, Sticky on Scroll)
          ==================================================================== */}
      <div
        style={{
          background: isScrolled ? 'rgba(255, 255, 255, 0.88)' : '#FFFFFF',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E6EAF2',
          boxShadow: isScrolled ? '0 8px 30px rgba(7, 27, 82, 0.08)' : '0 4px 20px rgba(7, 27, 82, 0.05)',
          padding: '12px 0',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* 1. Left: WormUp Brand Logo */}
          <div
            onClick={() => navigateTo('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="/Wormup.png"
              alt="WormUp"
              style={{
                width: '42px',
                height: '42px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(7, 27, 82, 0.18))',
              }}
            />
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#071B52', letterSpacing: '-0.03em' }}>
                Worm
              </span>
              <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FF3B98', letterSpacing: '-0.03em' }}>
                Up
              </span>
            </div>
          </div>

          {/* 2. Center-Left: Hyperlocal Location Picker */}
          <div style={{ position: 'relative', flexShrink: 0 }} ref={locationRef}>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '14px',
                padding: '8px 14px',
                color: '#071B52',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255, 59, 152, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF3B98',
                  flexShrink: 0,
                }}
              >
                <MapPin size={17} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontSize: '0.72rem', color: '#FF3B98', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Delivery in {resolvedLocation.deliveryMinutes || 9} Mins
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{resolvedLocation.areaName || selectedAreaName}, Ahmedabad</span>
                  <ChevronDown size={14} color="#64748B" />
                </div>
              </div>
            </button>

            {/* Location Selector Dropdown */}
            {showLocationDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '340px',
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  boxShadow: '0 16px 45px rgba(7, 27, 82, 0.18)',
                  border: '1px solid #E6EAF2',
                  padding: '16px',
                  zIndex: 1100,
                  color: '#071B52',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#071B52' }}>
                    Select Delivery Location
                  </div>
                  <button
                    onClick={() => setShowLocationDropdown(false)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* GPS Detect Button */}
                <button
                  onClick={async () => {
                    await detectUserLocation();
                    setShowLocationDropdown(false);
                  }}
                  disabled={isDetectingLocation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px',
                    background: '#F8F2FF',
                    border: '1px solid #EEE6FF',
                    borderRadius: '12px',
                    color: '#7856F6',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  <Navigation size={16} />
                  <span>{isDetectingLocation ? 'Detecting GPS...' : 'Detect Current GPS Location'}</span>
                </button>

                {locationError && (
                  <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '8px', padding: '6px', background: '#FEF2F2', borderRadius: '6px' }}>
                    {locationError}
                  </div>
                )}

                <div style={{ fontSize: '0.76rem', color: '#13B978', background: '#ECFDF5', padding: '8px 10px', borderRadius: '8px', marginBottom: '12px', fontWeight: 600 }}>
                  ✓ Fulfilled live by: <strong>{resolvedLocation.storeName}</strong>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Quick Hubs in Ahmedabad
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {availableAreas.map((area) => {
                    const isSelected = selectedAreaName.toLowerCase() === area.name.toLowerCase();
                    return (
                      <button
                        key={area.name}
                        onClick={() => {
                          setSelectedAreaName(area.name);
                          setShowLocationDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: isSelected ? '#FFF5FA' : 'transparent',
                          color: isSelected ? '#FF3B98' : '#071B52',
                          fontWeight: isSelected ? 800 : 500,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div>
                          <div>{area.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{area.storeName}</div>
                        </div>
                        {isSelected && <Check size={16} color="#FF3B98" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Center: Large, Rounded Search Bar */}
          <div style={{ flex: 1, maxWidth: '520px', position: 'relative' }} ref={searchRef}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F1F5F9',
                borderRadius: '50px',
                padding: '0 18px',
                height: '46px',
                border: '1.5px solid transparent',
                transition: 'all 0.2s ease',
              }}
              onFocus={() => setIsSearchOpen(true)}
            >
              <Search size={19} color="#64748B" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search 'milk', 'atta', 'maggi', 'tomato'..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.92rem',
                  color: '#071B52',
                  background: 'transparent',
                  fontWeight: 500,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Live Search Autocomplete */}
            {isSearchOpen && searchSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 16px 45px rgba(7, 27, 82, 0.16)',
                  border: '1px solid #E6EAF2',
                  overflow: 'hidden',
                  zIndex: 1100,
                }}
              >
                <div style={{ padding: '8px 16px', background: '#F8FAFC', fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Matching Live Products
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {searchSuggestions.map((prod) => {
                    const pId = (prod.id || prod._id) as string;
                    const qty = getItemQuantity(pId);
                    return (
                      <div
                        key={pId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          navigateTo('product', { product: prod });
                          setIsSearchOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={prod.image}
                            alt={prod.name}
                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#F8FAFC' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              {prod.unit} • ₹{prod.price}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              openLoginModal({ product: prod });
                              return;
                            }
                            addToCart(prod);
                          }}
                          style={{
                            background: '#FF3B98',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {qty > 0 ? `Added (${qty})` : '+ ADD'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Right: Action Buttons (Categories Dropdown, Login / Account Button, Green Cart Button) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            {/* Categories Dropdown (Hamburger Icon + Categories) */}
            <div style={{ position: 'relative' }} ref={categoriesRef}>
              <button
                onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#071B52',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#071B52')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <Menu size={18} color="#071B52" />
                <span>Categories</span>
                <ChevronDown size={14} color="#64748B" />
              </button>

              {showCategoriesDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '260px',
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 16px 45px rgba(7, 27, 82, 0.16)',
                    padding: '12px',
                    border: '1px solid #E6EAF2',
                    zIndex: 1100,
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', padding: '6px 10px', textTransform: 'uppercase' }}>
                    All Categories
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {liveCategories.map((c) => (
                      <button
                        key={c.id || c._id}
                        onClick={() => {
                          navigateTo('shop', { categorySlug: c.slug });
                          setShowCategoriesDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#071B52',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>{c.icon || '🛍️'}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CRITICAL FIX: Login / Sign Up Button or Authenticated Profile Avatar */}
            {!isAuthenticated ? (
              <button
                id="header-login-btn"
                onClick={openLoginModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 59, 152, 0.35)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <UserIcon size={17} />
                <span>Login</span>
              </button>
            ) : (
              <div style={{ position: 'relative' }} ref={userRef}>
                <button
                  id="header-user-profile-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#071B52',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7856F6 0%, #FF3B98 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span>Hi, {user?.name ? user.name.split(' ')[0] : 'User'}</span>
                  <ChevronDown size={14} color="#64748B" />
                </button>

                {showUserDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '240px',
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      boxShadow: '0 16px 45px rgba(7, 27, 82, 0.18)',
                      padding: '12px',
                      border: '1px solid #E6EAF2',
                      zIndex: 1100,
                      color: '#071B52',
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.95rem' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {user?.phone ? (user.phone.startsWith('+91') ? `+91 ${user.phone.slice(3)}` : `+91 ${user.phone}`) : ''}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigateTo('account', { accountTab: 'orders' });
                        setShowUserDropdown(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}
                    >
                      <Package size={16} color="#7856F6" />
                      <span>My Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        navigateTo('wishlist');
                        setShowUserDropdown(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Heart size={16} color="#E11D48" />
                        <span>My Wishlist</span>
                      </div>
                      {totalWishlistItems > 0 && (
                        <span style={{ background: '#FFE4E6', color: '#E11D48', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {totalWishlistItems}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        navigateTo('account', { accountTab: 'wallet' });
                        setShowUserDropdown(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}
                    >
                      <Wallet size={16} color="#FF3B98" />
                      <span>Shopping Coins ({user?.shoppingCoins || 0})</span>
                    </button>

                    <button
                      onClick={() => {
                        navigateTo('account', { accountTab: 'addresses' });
                        setShowUserDropdown(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}
                    >
                      <MapPin size={16} color="#13B978" />
                      <span>Saved Addresses</span>
                    </button>

                    <div style={{ borderTop: '1px solid #F1F5F9', margin: '6px 0' }} />

                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#EF4444' }}
                    >
                      <LogOut size={16} color="#EF4444" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Header Action Button */}
            <button
              id="header-wishlist-btn"
              onClick={() => {
                if (!isAuthenticated) {
                  openLoginModal();
                  return;
                }
                navigateTo('wishlist');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: totalWishlistItems > 0 ? '#FFF1F2' : '#F8FAFC',
                border: totalWishlistItems > 0 ? '1.5px solid #FECDD3' : '1.5px solid #E2E8F0',
                borderRadius: '12px',
                padding: '10px 15px',
                color: totalWishlistItems > 0 ? '#E11D48' : '#64748B',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
                boxShadow: totalWishlistItems > 0 ? '0 4px 12px rgba(225, 29, 72, 0.12)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              title="My Wishlist"
            >
              <Heart
                size={18}
                fill={totalWishlistItems > 0 ? '#E11D48' : 'none'}
                color={totalWishlistItems > 0 ? '#E11D48' : '#64748B'}
              />
              <span className="hidden-mobile">Wishlist</span>
              {totalWishlistItems > 0 && (
                <span
                  style={{
                    background: '#E11D48',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                  }}
                >
                  {totalWishlistItems}
                </span>
              )}
            </button>

            {/* Green Cart Action Button: 🛒 1 items • ₹95 */}
            <button
              id="header-cart-btn"
              onClick={() => setIsCartOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <ShoppingBag size={18} />
              <span>
                {totalItems > 0 ? `${totalItems} items • ₹${total.toLocaleString('en-IN')}` : 'Cart (0)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Choose Delivery Location Modal (100% Customer App Match) */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </header>
  );
};
