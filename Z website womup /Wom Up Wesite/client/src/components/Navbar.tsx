import React from 'react';
import { ShoppingBag, Search, MapPin, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchQuery, onSearchChange }) => {
  const { totalItems, subtotal, setIsCartOpen } = useCart();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <a href="/" className="brand-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="brand-icon">
            <Zap size={22} fill="white" strokeWidth={2.5} />
          </div>
          <span>Wom<span style={{ color: 'var(--color-primary)' }}>Up</span></span>
          <span className="brand-badge">Express</span>
        </a>

        {/* Location selector */}
        <div className="nav-location" title="Change delivery location">
          <MapPin size={16} color="var(--color-primary)" />
          <span>Deliver to: <strong>Sunrise Valley, Sector 4</strong></span>
        </div>

        {/* Search */}
        <div className="nav-search">
          <Search size={18} className="search-icon" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search stores, veggies, dairy, snacks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button
            id="open-cart-btn"
            className="cart-button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={19} />
            <span>Cart</span>
            {totalItems > 0 && (
              <>
                <span className="cart-badge">{totalItems}</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>• ₹{subtotal}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
