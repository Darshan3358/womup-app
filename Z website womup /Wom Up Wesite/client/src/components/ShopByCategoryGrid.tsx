import React, { useState } from 'react';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';

export interface CategoryTile {
  id: string;
  name: string;
  slug: string;
  image?: string;
  isMore?: boolean;
}

export const CATEGORY_TILES: CategoryTile[] = [
  // --- ROW 1 (8 Categories - Transparent 3D Renders, No Background Box) ---
  {
    id: 'c1_veg',
    name: 'Vegetables &\nFruits',
    slug: 'vegetables',
    image: '/categories/nobg/nobg_veg_fruits.png',
  },
  {
    id: 'c2_dairy',
    name: 'Dairy, Bread\n& Eggs',
    slug: 'dairy',
    image: '/categories/nobg/nobg_dairy_bread.png',
  },
  {
    id: 'c3_chips',
    name: 'Chips &\nNamkeen',
    slug: 'snacks',
    image: '/categories/nobg/nobg_chips_namkeen.png',
  },
  {
    id: 'c4_drinks',
    name: 'Cold Drinks\n& Juices',
    slug: 'beverages',
    image: '/categories/nobg/nobg_cold_drinks.png',
  },
  {
    id: 'c5_breakfast',
    name: 'Breakfast &\nInstant Food',
    slug: 'breakfast',
    image: '/categories/nobg/nobg_breakfast.png',
  },
  {
    id: 'c6_tea',
    name: 'Tea, Coffee &\nMilk Drinks',
    slug: 'tea-coffee',
    image: '/categories/nobg/nobg_tea_coffee.png',
  },
  {
    id: 'c7_bakery',
    name: 'Bakery &\nBiscuits',
    slug: 'bakery',
    image: '/categories/nobg/nobg_bakery_biscuits.png',
  },
  {
    id: 'c8_sweets',
    name: 'Sweet\nTooth',
    slug: 'sweets',
    image: '/categories/nobg/nobg_sweet_tooth.png',
  },

  // --- ROW 2 (8 Categories - 8th is MORE) ---
  {
    id: 'c9_atta',
    name: 'Atta, Rice\n& Dal',
    slug: 'cooking-essentials',
    image: '/categories/nobg/nobg_atta_rice_dal.png',
  },
  {
    id: 'c10_masala',
    name: 'Masala, Oil\n& More',
    slug: 'cooking-essentials',
    image: '/categories/nobg/nobg_masala_oil.png',
  },
  {
    id: 'c11_sauces',
    name: 'Sauces &\nSpreads',
    slug: 'sauces',
    image: '/categories/nobg/nobg_sauces_spreads.png',
  },
  {
    id: 'c12_meat',
    name: 'Chicken, Meat\n& Fish',
    slug: 'meat',
    image: '/categories/nobg/nobg_meat_fish.png',
  },
  {
    id: 'c13_organic',
    name: 'Organic &\nHealthy Living',
    slug: 'organic',
    image: '/categories/nobg/nobg_organic.png',
  },
  {
    id: 'c14_baby',
    name: 'Baby\nCare',
    slug: 'baby-care',
    image: '/categories/nobg/nobg_baby_care.png',
  },
  {
    id: 'c15_pharma',
    name: 'Pharma &\nWellness',
    slug: 'pharma',
    image: '/categories/nobg/nobg_pharma_wellness.png',
  },
  {
    id: 'c16_more',
    name: 'More',
    slug: 'all',
    isMore: true,
  },
];

export const ShopByCategoryGrid: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section
      style={{
        padding: '36px 0 30px',
        background: '#FFFFFF',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      <div className="container">
        {/* Section Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '26px',
          }}
        >
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#071B52',
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            Shop by Category
          </h2>

          <button
            onClick={() => navigateTo('shop')}
            style={{
              background: 'none',
              border: 'none',
              color: '#E91E63',
              fontWeight: 800,
              fontSize: '0.96rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <span>View All</span>
            <ArrowRight size={18} strokeWidth={2.8} />
          </button>
        </div>

        {/* Minimalist Floating Category Grid (8 Columns x 2 Rows = Exactly 16 Items) */}
        <div className="shop-category-grid-8x8">
          {CATEGORY_TILES.map((cat, idx) => {
            const isHovered = hoveredId === cat.id;
            return (
              <motion.div
                key={cat.id}
                onClick={() => {
                  if (cat.isMore) {
                    navigateTo('shop');
                  } else {
                    navigateTo('shop', { categorySlug: cat.slug });
                  }
                }}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="category-floating-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  outline: 'none',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                {/* Floating Image Container (No Background Box, High Detail, Hover Zoom) */}
                <div
                  style={{
                    width: '100%',
                    height: '96px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
                    transform: isHovered ? 'scale(1.10)' : 'scale(1)',
                  }}
                >
                  {cat.isMore ? (
                    <motion.div
                      whileHover={{ rotate: 90, scale: 1.12 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 16 }}
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFF0F6 0%, #F5F3FF 100%)',
                        border: '1.5px solid #FCE4EC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(233, 30, 99, 0.12)',
                        color: '#E91E63',
                      }}
                    >
                      <LayoutGrid size={28} strokeWidth={2.4} />
                    </motion.div>
                  ) : (
                    <img
                      src={cat.image}
                      alt={cat.name.replace('\n', ' ')}
                      style={{
                        maxHeight: '92px',
                        maxWidth: '92%',
                        objectFit: 'contain',
                        filter: isHovered
                          ? 'drop-shadow(0 10px 20px rgba(7, 27, 82, 0.15))'
                          : 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.06))',
                        transition: 'filter 0.3s ease',
                      }}
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Typography: Centered, clean, turns pink on hover */}
                <span
                  style={{
                    marginTop: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: isHovered ? '#E91E63' : '#1F2937',
                    textAlign: 'center',
                    transition: 'color 0.2s ease',
                    whiteSpace: 'pre-line',
                    maxWidth: '105px',
                  }}
                >
                  {cat.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
