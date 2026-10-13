import React, { useState } from 'react';
import {
  ArrowRight,
  Printer,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { ProductCard } from '../components/ProductCard';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { HeroBannerCarousel } from '../components/HeroBannerCarousel';
import { ShopByCategoryGrid } from '../components/ShopByCategoryGrid';
import {
  CategoryMidBanners,
  DocumentPrintingBanner,
  MonthlyBenefitsBanner,
  PreFooterBanners,
} from '../components/MidSectionBanners';
import { PopularBrandsRail } from '../components/PopularBrandsRail';
import type { Product, HomeSection } from '../types';

export const Home: React.FC = () => {
  const {
    navigateTo,
    homeSections,
    isLoadingHome,
    resolvedLocation,
  } = useNavigation();

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  return (
    <div className="homepage-root" style={{ background: '#FBFCFF' }}>
      {/* ====================================================================
          Section 01 — App-Identical Hero Banner Carousel (Full Width)
          ==================================================================== */}
      <section className="w-full" style={{ padding: 0, margin: 0, width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
        <HeroBannerCarousel />
      </section>

        {/* Hyperlocal Dark Store Status & Quick Commerce Quick Strip */}
        <div className="container" style={{ marginTop: '16px', marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
              border: '1px solid #E6EAF2',
              borderRadius: '16px',
              padding: '12px 24px',
              boxShadow: '0 2px 10px rgba(7, 27, 82, 0.03)',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(255, 59, 152, 0.1)',
                  color: '#FF3B98',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                }}
              >
                <Zap size={15} fill="#FF3B98" />
                <span>{resolvedLocation.deliveryMinutes || 9}-MIN INSTANT DELIVERY</span>
              </div>
              <span style={{ color: '#667085', fontSize: '0.9rem' }}>
                Dispatched live from <strong>{resolvedLocation.storeName}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                id="home-printing-pill-btn"
                onClick={() => navigateTo('printing')}
                style={{
                  background: 'linear-gradient(135deg, #7856F6 0%, #5C35E6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(120, 86, 246, 0.25)',
                }}
              >
                <Printer size={15} />
                <span>10-Min Document Printing</span>
              </button>

              <button
                id="home-explore-catalog-btn"
                onClick={() => navigateTo('shop')}
                style={{
                  background: '#FFFFFF',
                  color: '#071B52',
                  border: '1.5px solid #E6EAF2',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Browse All Products</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

      {/* ====================================================================
          Section 02 — Shop by Category Grid (8x2 Tiles, Last is More)
          ==================================================================== */}
      <ShopByCategoryGrid />

      {/* ====================================================================
          Section 03 — Dynamic Home Sections with Mid-Section Banners (SRS Part 3)
          ==================================================================== */}
      {isLoadingHome ? (
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', color: '#667085', fontWeight: 600 }}>
            Loading live products from {resolvedLocation.storeName}...
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px 0 40px' }}>
          {(() => {
            const dairyIndex = homeSections.sections.findIndex(
              (s: HomeSection) =>
                s.id === 'dairy_bread' ||
                (s.title && s.title.toLowerCase().includes('dairy')) ||
                (s.categoryName && s.categoryName.toLowerCase().includes('dairy'))
            );

            const newArrivalsIndex = homeSections.sections.findIndex(
              (s: HomeSection) =>
                s.id === 'new_arrivals' ||
                (s.title && s.title.toLowerCase().includes('new arrival'))
            );

            return homeSections.sections.map((section: HomeSection, index: number) => {
              if (!section.products || section.products.length === 0) return null;

              // Move CategoryMidBanners right before Dairy, Bread & Eggs section
              const showCategoryBannersHere =
                dairyIndex !== -1 ? index === dairyIndex : index === 1;

              // Popular Brands Rail placed right before New Arrivals (matching Mobile App)
              const showPopularBrandsHere =
                newArrivalsIndex !== -1
                  ? index === newArrivalsIndex
                  : dairyIndex !== -1
                  ? index === dairyIndex + 1
                  : index === 3;

              return (
                <React.Fragment key={section.id}>
                  {/* Category Banners (Dairy, Bread & Eggs + Fresh Fruits & Veggies) placed right before Dairy, Bread & Eggs */}
                  {showCategoryBannersHere && <CategoryMidBanners />}

                  {/* Popular Brands Auto-Scrolling Rail (placed right before New Arrivals, matching Mobile App) */}
                  {showPopularBrandsHere && <PopularBrandsRail />}

                  <section style={{ marginBottom: '36px' }}>
                    <div className="container">
                      {/* Section Title Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px' }}>
                        <div>
                          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{section.title}</span>
                          </h2>
                          {section.subtitle && (
                            <p style={{ fontSize: '0.88rem', color: '#667085', marginTop: '2px' }}>
                              {section.subtitle}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => navigateTo('shop')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#FF3B98',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>View All</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Blinkit-Style 6-Card Product Grid */}
                      <div className="blinkit-product-grid">
                        {section.products.slice(0, 6).map((product) => (
                          <ProductCard
                            key={product.id || product._id}
                            product={product}
                            onQuickView={(p) => setQuickViewProduct(p)}
                          />
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Mid-Section: Services & Savings (Document Printing + Bulk Orders) */}
                  {index === 1 && <DocumentPrintingBanner />}
                </React.Fragment>
              );
            });
          })()}

          {/* Fallback rendering of banners if backend returned fewer sections */}
          {homeSections.sections.length === 0 && (
            <>
              <CategoryMidBanners />
              <DocumentPrintingBanner />
              <PopularBrandsRail />
            </>
          )}

          {/* Pre-Footer Guarantees & Features */}
          <PreFooterBanners />

          {/* Section: Up to ₹2,000 Monthly Benefits Banner (Displayed at the very last of the website, above footer) */}
          <MonthlyBenefitsBanner />
        </div>
      )}

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
