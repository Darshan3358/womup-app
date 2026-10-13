import React, { useState, useMemo } from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { ProductCard } from '../components/ProductCard';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import type { Product } from '../types';

export const Shop: React.FC = () => {
  const {
    selectedCategorySlug,
    navigateTo,
    searchQuery,
    dbProducts,
    liveCategories,
    selectedAreaName,
    resolvedLocation,
  } = useNavigation();

  const [activeCategory, setActiveCategory] = useState<string>(selectedCategorySlug || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync category if navigation changes
  React.useEffect(() => {
    if (selectedCategorySlug) {
      setActiveCategory(selectedCategorySlug);
    }
  }, [selectedCategorySlug]);

  const activeCategoryObj = liveCategories.find((c) => c.slug === activeCategory);

  // Distinct brands from real database products
  const allBrands = useMemo(() => {
    return Array.from(new Set(dbProducts.map((p) => p.brand))).filter(Boolean);
  }, [dbProducts]);

  // Filtered products with hyper-local area pricing
  const filteredProducts = useMemo(() => {
    let result = dbProducts.filter((p) => {
      // Category filter
      if (activeCategory !== 'all' && p.categorySlug !== activeCategory) {
        return false;
      }
      // Search query filter
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Price filter
      if (p.price > maxPrice) return false;
      // Rating filter
      if (p.rating < minRating) return false;
      // In stock
      if (onlyInStock && !p.inStock) return false;
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) {
        return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    return result;
  }, [activeCategory, searchQuery, maxPrice, minRating, onlyInStock, selectedBrands, sortBy, dbProducts]);

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setSelectedBrands([]);
    setMaxPrice(1000);
    setMinRating(0);
    setOnlyInStock(true);
  };

  return (
    <div className="shop-page-root" style={{ padding: '24px 0 60px', background: '#FBFCFF' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#667085', marginBottom: '20px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('home')}>Home</span>
          <ChevronRight size={14} />
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveCategory('all')}>Shop All</span>
          {activeCategoryObj && (
            <>
              <ChevronRight size={14} />
              <span style={{ color: '#071B52', fontWeight: 700 }}>{activeCategoryObj.name}</span>
            </>
          )}
        </div>

        {/* Category Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F8F2FF 0%, #EEE6FF 60%, #FFF0EB 100%)',
            border: '1px solid #E6EAF2',
            borderRadius: '20px',
            padding: '32px 40px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ background: '#FF3B98', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
              ⚡ 9-Minute Dark Store Catalog
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#071B52', margin: '8px 0 4px' }}>
              {activeCategoryObj ? `${activeCategoryObj.icon || ''} ${activeCategoryObj.name}` : 'All Products & Daily Essentials'}
            </h1>
            <p style={{ color: '#667085', fontSize: '0.96rem' }}>
              In stock at <strong>{resolvedLocation.storeName}</strong>. Dispatched to {selectedAreaName} in {resolvedLocation.deliveryMinutes || 9} minutes.
            </p>
          </div>
        </div>

        {/* Desktop Layout: Sidebar + Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
          {/* ==============================================================
              Filter Sidebar
              ============================================================== */}
          <aside
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6EAF2',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(7,27,82,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700, color: '#071B52' }}>
                <Filter size={18} color="#FF3B98" />
                <span>Filters</span>
              </div>
              <button
                onClick={resetFilters}
                style={{ background: 'none', border: 'none', color: '#7856F6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Reset All
              </button>
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52', marginBottom: '10px' }}>
                Categories
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  onClick={() => setActiveCategory('all')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: activeCategory === 'all' ? 700 : 500,
                    color: activeCategory === 'all' ? '#FF3B98' : '#14224A',
                    backgroundColor: activeCategory === 'all' ? '#FFF1F8' : 'transparent',
                  }}
                >
                  All Items ({dbProducts.length})
                </div>

                {liveCategories.map((c) => (
                  <div
                    key={c.id || c._id}
                    onClick={() => setActiveCategory(c.slug)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: activeCategory === c.slug ? 700 : 500,
                      color: activeCategory === c.slug ? '#FF3B98' : '#14224A',
                      backgroundColor: activeCategory === c.slug ? '#FFF1F8' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{c.icon || '🛍️'}</span>
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, color: '#071B52', marginBottom: '8px' }}>
                <span>Max Price</span>
                <span style={{ color: '#FF3B98' }}>₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FF3B98' }}
              />
            </div>

            {/* In Stock Only */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer', color: '#14224A' }}>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Brands Filter */}
            {allBrands.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52', marginBottom: '10px' }}>
                  Popular Brands
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {allBrands.map((b) => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#475569' }}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => toggleBrand(b)}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ==============================================================
              Product Grid
              ============================================================== */}
          <div>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.92rem', color: '#667085' }}>
                Showing <strong style={{ color: '#071B52' }}>{filteredProducts.length}</strong> live products
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: '#667085' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#071B52',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {filteredProducts.length === 0 ? (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E6EAF2', padding: '60px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#071B52', fontWeight: 800 }}>No products matched your filters</h3>
                <p style={{ color: '#667085', marginTop: '6px' }}>Try resetting your filters or search term.</p>
                <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '18px',
                }}
              >
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id || p._id}
                    product={p}
                    onQuickView={(prod) => setQuickViewProduct(prod)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
