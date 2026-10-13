import React, { useEffect, useRef } from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export interface BrandItem {
  id: 'amul' | 'tata' | 'nestle' | 'maggi' | 'fortune' | 'cocacola' | 'dove' | 'haldirams';
  name: string;
}

export const POPULAR_BRANDS: BrandItem[] = [
  { id: 'amul', name: 'Amul' },
  { id: 'tata', name: 'Tata' },
  { id: 'nestle', name: 'Nestlé' },
  { id: 'maggi', name: 'Maggi' },
  { id: 'fortune', name: 'Fortune' },
  { id: 'cocacola', name: 'Coca-Cola' },
  { id: 'dove', name: 'Dove' },
  { id: 'haldirams', name: "Haldiram's" },
];

// Multiplied to ensure seamless infinite continuous auto-scroll as in the mobile app
const MULTIPLIED_BRANDS = [
  ...POPULAR_BRANDS,
  ...POPULAR_BRANDS,
  ...POPULAR_BRANDS,
  ...POPULAR_BRANDS,
];

/**
 * High-fidelity brand logo components matching mobile app BrandLogos.tsx
 */
const WebBrandLogo: React.FC<{ brandKey: BrandItem['id'] }> = ({ brandKey }) => {
  switch (brandKey) {
    case 'amul':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              color: '#D8232A',
              fontSize: '18px',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
            }}
          >
            Amul
          </span>
          <span
            style={{
              color: '#101A4D',
              fontSize: '7px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              marginTop: '1px',
              textTransform: 'uppercase',
            }}
          >
            The Taste of India
          </span>
        </div>
      );

    case 'tata':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="18" viewBox="0 0 24 20" fill="none">
            <path
              d="M12 2C6.48 2 2 5.58 2 10C2 14.42 6.48 18 12 18C17.52 18 22 14.42 22 10C22 5.58 17.52 2 12 2ZM9 7H15V9H13V15H11V9H9V7Z"
              fill="#0F4C9C"
            />
          </svg>
          <span
            style={{
              color: '#0F4C9C',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '1.5px',
              marginTop: '2px',
            }}
          >
            TATA
          </span>
        </div>
      );

    case 'nestle':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="16" viewBox="0 0 32 20" fill="none">
            <path
              d="M6 14C8 16 14 17 22 16M4 11C6 11 10 9 12 7M14 7C16 8 20 8 24 6M10 17C14 18 20 18 26 15"
              stroke="#5C381E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="5" r="2" fill="#5C381E" />
            <circle cx="16" cy="4" r="1.5" fill="#5C381E" />
          </svg>
          <span
            style={{
              color: '#3B2314',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.2px',
              marginTop: '1px',
            }}
          >
            Nestlé
          </span>
        </div>
      );

    case 'maggi':
      return (
        <div
          style={{
            backgroundColor: '#FFE500',
            border: '2px solid #D8232A',
            borderRadius: '8px',
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(216, 35, 42, 0.2)',
          }}
        >
          <span
            style={{
              color: '#D8232A',
              fontSize: '13px',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.2,
            }}
          >
            Maggi
          </span>
        </div>
      );

    case 'fortune':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              color: '#D8232A',
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
            }}
          >
            fortune
          </span>
          <div
            style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1FA463',
              borderRadius: '1px',
              marginTop: '2px',
            }}
          />
        </div>
      );

    case 'cocacola':
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              color: '#F40000',
              fontSize: '15px',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '-0.3px',
              fontFamily: 'serif',
            }}
          >
            Coca-Cola
          </span>
        </div>
      );

    case 'dove':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="13" viewBox="0 0 24 16" fill="none">
            <path
              d="M2 12C6 10 12 5 18 2C15 6 12 9 8 11M18 2C20 4 22 8 22 12C18 10 12 12 6 14"
              fill="#C59B27"
            />
          </svg>
          <span
            style={{
              color: '#0F2042',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              marginTop: '1px',
            }}
          >
            Dove
          </span>
        </div>
      );

    case 'haldirams':
      return (
        <div
          style={{
            backgroundColor: '#D8232A',
            borderRadius: '16px',
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(216, 35, 42, 0.25)',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.2px',
            }}
          >
            Haldiram's
          </span>
        </div>
      );

    default:
      return null;
  }
};

interface PopularBrandsRailProps {
  onSelectBrand?: (brand: string) => void;
  onViewAll?: () => void;
}

export const PopularBrandsRail: React.FC<PopularBrandsRailProps> = ({
  onSelectBrand,
  onViewAll,
}) => {
  const { navigateTo, setSearchQuery } = useNavigation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollOffsetRef = useRef(0);
  const isHoveredRef = useRef(false);

  // Card width 118px + gap 14px = 132px per card. 8 cards = 1056px per single set
  const CARD_WIDTH = 118;
  const GAP = 14;
  const singleSetWidth = (CARD_WIDTH + GAP) * POPULAR_BRANDS.length;

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isHoveredRef.current && scrollContainerRef.current) {
        scrollOffsetRef.current += 38 * dt; // Smooth ~38px per second, matching mobile app speed
        if (scrollOffsetRef.current >= singleSetWidth) {
          scrollOffsetRef.current -= singleSetWidth;
        }
        scrollContainerRef.current.scrollLeft = scrollOffsetRef.current;
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [singleSetWidth]);

  const handleBrandClick = (brandName: string) => {
    if (onSelectBrand) {
      onSelectBrand(brandName);
    } else {
      setSearchQuery(brandName);
      navigateTo('shop');
    }
  };

  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigateTo('shop');
    }
  };

  return (
    <section style={{ marginBottom: '36px', overflow: 'hidden' }}>
      <div className="container">
        {/* Header Row: Matching Mobile App with Pink Brand Accent & Award Badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(236, 72, 153, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={19} color="#EC4899" strokeWidth={2.4} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#101A4D',
                  letterSpacing: '-0.4px',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Popular <span style={{ color: '#F23D9B' }}>Brands</span>
              </h2>
            </div>
          </div>

          <button
            onClick={handleViewAllClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#F23D9B',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(242, 61, 155, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>View All</span>
            <ChevronRight size={15} color="#EC4A9D" strokeWidth={2.4} />
          </button>
        </div>

        {/* Brand Scroll Rail (Continuous Infinite Auto-Scroll) with Smooth Edge Mask */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '16px',
          }}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
          onTouchStart={() => {
            isHoveredRef.current = true;
          }}
          onTouchEnd={() => {
            isHoveredRef.current = false;
          }}
        >
          {/* Subtle Left Fade Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '36px',
              height: '100%',
              background: 'linear-gradient(to right, #FBFCFF, rgba(251, 252, 255, 0))',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Subtle Right Fade Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '36px',
              height: '100%',
              background: 'linear-gradient(to left, #FBFCFF, rgba(251, 252, 255, 0))',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          <div
            ref={scrollContainerRef}
            onScroll={() => {
              if (isHoveredRef.current && scrollContainerRef.current) {
                scrollOffsetRef.current = scrollContainerRef.current.scrollLeft;
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${GAP}px`,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '6px 4px 10px',
              cursor: isHoveredRef.current ? 'grab' : 'default',
              userSelect: 'none',
            }}
          >
            {MULTIPLIED_BRANDS.map((b, idx) => (
              <div
                key={`${b.id}_${idx}`}
                onClick={() => handleBrandClick(b.name)}
                title={`Shop ${b.name}`}
                style={{
                  flexShrink: 0,
                  width: `${CARD_WIDTH}px`,
                  height: '72px',
                  backgroundColor: '#FDF2F8',
                  border: '1.5px solid #FCE7F3',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  boxShadow: '0 2px 6px rgba(242, 61, 155, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(242, 61, 155, 0.2)';
                  e.currentTarget.style.borderColor = '#F472B6';
                  e.currentTarget.style.backgroundColor = '#FFF1F8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(242, 61, 155, 0.08)';
                  e.currentTarget.style.borderColor = '#FCE7F3';
                  e.currentTarget.style.backgroundColor = '#FDF2F8';
                }}
              >
                <WebBrandLogo brandKey={b.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
