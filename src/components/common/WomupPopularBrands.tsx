import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { BrandLogo } from './BrandLogos';
import { Award, ChevronRight } from 'lucide-react-native';

interface WomupPopularBrandsProps {
  onSelectBrand?: (brand: string) => void;
  onViewAll?: () => void;
}

export const POPULAR_BRANDS = [
  { id: 'amul', name: 'Amul' },
  { id: 'tata', name: 'Tata' },
  { id: 'nestle', name: 'Nestlé' },
  { id: 'maggi', name: 'Maggi' },
  { id: 'fortune', name: 'Fortune' },
  { id: 'cocacola', name: 'Coca-Cola' },
  { id: 'dove', name: 'Dove' },
  { id: 'haldirams', name: "Haldiram's" },
] as const;

// Multiplied to ensure seamless infinite continuous auto-scroll
const MULTIPLIED_BRANDS = [
  ...POPULAR_BRANDS,
  ...POPULAR_BRANDS,
  ...POPULAR_BRANDS,
  ...POPULAR_BRANDS,
];

const WomupPopularBrandsComponent: React.FC<WomupPopularBrandsProps> = ({
  onSelectBrand,
  onViewAll,
}) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const isHovered = useRef(false);

  // Card width 110 + gap 12 = 122 per card. 8 cards = 976px
  const singleSetWidth = (110 + 12) * POPULAR_BRANDS.length;

  useEffect(() => {
    let animId: any;
    let lastTime = Date.now();

    const step = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isHovered.current && scrollRef.current) {
        scrollOffset.current += 38 * dt;
        if (scrollOffset.current >= singleSetWidth) {
          scrollOffset.current -= singleSetWidth;
        }
        scrollRef.current.scrollTo({ x: scrollOffset.current, animated: false });
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [singleSetWidth]);

  return (
    <View style={styles.sectionContainer}>
      {/* Header with Pink Brand Accent & Professional Award Badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <View style={styles.iconBadge}>
            <Award size={19} color="#EC4899" strokeWidth={2.4} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.sectionTitle}>Popular </Text>
            <Text style={styles.sectionTitlePink}>Brands</Text>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={onViewAll} style={styles.viewAllRow}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={15} color="#EC4A9D" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* Brand Scroll Rail (Continuous Infinite Auto-Scroll) */}
      <View
        // @ts-ignore
        onMouseEnter={() => { isHovered.current = true; }}
        // @ts-ignore
        onMouseLeave={() => { isHovered.current = false; }}
        onTouchStart={() => { isHovered.current = true; }}
        onTouchEnd={() => { isHovered.current = false; }}
        style={styles.railWrapper}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            if (isHovered.current) {
              scrollOffset.current = e.nativeEvent.contentOffset.x;
            }
          }}
          contentContainerStyle={styles.scrollRail}
          style={{ width: '100%', maxWidth: '100%' }}
        >
          {MULTIPLIED_BRANDS.map((b, idx) => (
            <TouchableOpacity
              key={`${b.id}_${idx}`}
              activeOpacity={0.82}
              onPress={() => onSelectBrand && onSelectBrand(b.name)}
              style={styles.brandCard}
              accessibilityLabel={b.name}
            >
              <BrandLogo brandKey={b.id} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginVertical: 18,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101A4D',
    letterSpacing: -0.4,
  },
  sectionTitlePink: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F23D9B',
    letterSpacing: -0.4,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F23D9B',
  },
  railWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  scrollRail: {
    paddingRight: 20,
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  brandCard: {
    width: 110,
    height: 72,
    backgroundColor: '#FDF2F8',
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#F23D9B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
});

export const WomupPopularBrands = React.memo(WomupPopularBrandsComponent);
