import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { BlinkitProduct, Product } from '../../types';

interface FestiveBannersSectionProps {
  products?: (BlinkitProduct | Product)[];
  onSelectCategory?: (categoryName: string, categoryId?: string) => void;
  onOpenProduct?: (product: any) => void;
}

const DIWALI_BG = require('../../../assets/banners/diwali_ready_bg.jpg');
const FESTIVE_BG = require('../../../assets/banners/festive_season_bg.jpg');

export const FestiveBannersSection: React.FC<FestiveBannersSectionProps> = ({
  products = [],
  onSelectCategory,
  onOpenProduct,
}) => {
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width > 768;
  const containerWidth = Math.min(width - (isWebWide ? 48 : 20), 1360);

  // 1. Inject CSS for Web Blinking Lights
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'womup-festive-blink-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes blinkLightGold {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px #FBBF24); transform: scale(1.1); }
            50% { opacity: 0.3; filter: drop-shadow(0 0 2px #FBBF24); transform: scale(0.9); }
          }
          @keyframes blinkLightPink {
            0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 2px #F43F5E); transform: scale(0.9); }
            50% { opacity: 1; filter: drop-shadow(0 0 12px #F43F5E); transform: scale(1.15); }
          }
          @keyframes blinkLightGreen {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px #34D399); transform: scale(1.05); }
            50% { opacity: 0.35; filter: drop-shadow(0 0 1px #34D399); transform: scale(0.92); }
          }
          .blinking-light {
            animation: blinkLightGold 1.5s infinite ease-in-out !important;
          }
          .blinking-light-delay {
            animation: blinkLightPink 1.5s infinite ease-in-out 0.75s !important;
          }
          .blinking-light-alternate {
            animation: blinkLightGreen 1.3s infinite ease-in-out 0.4s !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // 2. Animated values for Native Mobile
  const blinkAnim1 = useRef(new Animated.Value(0.4)).current;
  const blinkAnim2 = useRef(new Animated.Value(1)).current;
  const blinkAnim3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim1, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(blinkAnim1, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim2, { toValue: 0.35, duration: 750, useNativeDriver: true }),
        Animated.timing(blinkAnim2, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim3, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(blinkAnim3, { toValue: 0.4, duration: 850, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, []);

  // Helper to find real WOMART product by keyword
  const findProd = (keywords: string[]) => {
    return products.find((p) => {
      const title = (p.name || '').toLowerCase();
      const cat = ((p as any).category || (p as any).categoryName || '').toLowerCase();
      return keywords.some((k) => title.includes(k.toLowerCase()) || cat.includes(k.toLowerCase()));
    });
  };

  const oilProd = findProd(['sunflower oil', 'fortune', 'oil']);
  const attaProd = findProd(['aashirvaad', 'atta', 'flour']);
  const riceProd = findProd(['basmati', 'rice']);
  const dairyProd = findProd(['paneer', 'milk', 'taza', 'dahi']);
  const snacksProd = findProd(['chips', 'lay', 'snack']);
  const fruitProd = findProd(['apple', 'mango', 'banana', 'fruit']);
  const drinkProd = findProd(['tropicana', 'juice', 'beverage']);
  const saltProd = findProd(['salt', 'tata']);

  // SECTION 1: DIWALI READY (WOMART Deep Magenta & Navy Blue Theme)
  const DIWALI_CARDS = [
    {
      id: 'd1',
      title: 'Lights, Diya\n& Decor',
      tag: 'From ₹19',
      category: 'Household Essentials',
      catId: 'c7',
      img: 'https://images.unsplash.com/photo-1605335198089-86641b656208?w=350&q=80',
      product: null,
    },
    {
      id: 'd2',
      title: 'Chocolates\n& Hampers',
      tag: 'Min 25% OFF',
      category: 'Snacks & Sweets',
      catId: 'c2',
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=350&q=80',
      product: snacksProd,
    },
    {
      id: 'd3',
      title: 'Dry Fruits\n& Sweets',
      tag: 'Pure Ghee',
      category: 'Oil, Ghee & Masala',
      catId: 'c4',
      img: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=350&q=80',
      product: dairyProd,
    },
    {
      id: 'd4',
      title: 'Festive\nGift Packs',
      tag: 'Under ₹499',
      category: 'Bakery & Biscuits',
      catId: 'c5',
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=350&q=80',
      product: fruitProd,
    },
  ];

  // SECTION 2: FESTIVE SEASON ESSENTIALS (Warm Cream / Off-White Theme)
  const FESTIVE_CARDS = [
    {
      id: 'f1',
      title: 'Home\nCleaning',
      sub: 'Harpic & Hygiene',
      tag: 'Up to 40% OFF',
      category: 'Household Essentials',
      catId: 'c7',
      bgColor: '#1D4ED8',
      img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
      product: null,
    },
    {
      id: 'f2',
      title: 'Cooking\nEssentials',
      sub: 'Fortune Oil & Atta',
      tag: 'Starting ₹12',
      category: 'Cooking Essentials',
      catId: 'c4',
      bgColor: '#2563EB',
      img: oilProd?.imageUrl || attaProd?.imageUrl || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
      product: oilProd || attaProd,
    },
    {
      id: 'f3',
      title: 'Party\nDrinks',
      sub: 'Juices & Sips',
      tag: 'Flat 20% OFF',
      category: 'Beverages',
      catId: 'c6',
      bgColor: '#0284C7',
      img: drinkProd?.imageUrl || 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
      product: drinkProd,
    },
    {
      id: 'f4',
      title: 'Personal\nCare',
      sub: 'Soaps & Grooming',
      tag: 'From ₹49',
      category: 'Personal Care',
      catId: 'c8',
      bgColor: '#1E3A8A',
      img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
      product: null,
    },
  ];

  const DIWALI_BRANDS = [
    'Farmley',
    'Happilo',
    'California Almonds',
    'Ferrero Rocher',
    'Lifelong',
    'Prestige',
    'Cadbury',
    'Mangaldeep',
  ];

  const FESTIVE_BRANDS = [
    'Fortune',
    'Aashirvaad',
    'Real',
    'Bingo!',
    'Harpic',
    'Amul',
    'Dettol',
    'Tropicana',
  ];

  const handleCardPress = (card: any) => {
    if (card.product && onOpenProduct) {
      onOpenProduct(card.product);
    } else if (onSelectCategory) {
      onSelectCategory(card.category, card.catId);
    }
  };

  return (
    <View style={[styles.wrapper, { width: '100%', alignItems: 'center' }]}>
      {/* =========================================================================
          SECTION 1: "DIWALI READY" (WOMART Magenta & Navy Blue Theme with Blinking Lights)
         ========================================================================= */}
      <View style={[styles.bannerContainer, { width: containerWidth, backgroundColor: '#0F172A' }]}>
        {/* Background Image Layer */}
        <Image
          source={DIWALI_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Top Edge Blinking Fairy Lights */}
        <View style={styles.fairyLightsRow}>
          {[...Array(isWebWide ? 20 : 12)].map((_, i) => {
            const anim = i % 3 === 0 ? blinkAnim1 : i % 3 === 1 ? blinkAnim2 : blinkAnim3;
            const bulbClass =
              i % 3 === 0 ? 'blinking-light' : i % 3 === 1 ? 'blinking-light-delay' : 'blinking-light-alternate';
            const colors = ['#FBBF24', '#F43F5E', '#34D399', '#60A5FA', '#F59E0B'];
            const bulbColor = colors[i % colors.length];
            return (
              <Animated.View
                key={`diwali_bulb_${i}`}
                // @ts-ignore
                className={bulbClass}
                style={[
                  styles.lightBulb,
                  {
                    backgroundColor: bulbColor,
                    shadowColor: bulbColor,
                    opacity: anim,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Header: MAKE YOUR HOME • Diwali Ready */}
        <View style={styles.diwaliHeaderBox}>
          <Text style={styles.diwaliPreTitle}>MAKE YOUR HOME</Text>
          <View style={styles.diwaliTitleRow}>
            <View style={styles.diyaGlowBox}>
              <Text style={styles.diyaEmoji}>🪔</Text>
            </View>
            <Text style={styles.diwaliMainTitle}>Diwali Ready</Text>
            <View style={styles.diyaGlowBox}>
              <Text style={styles.diyaEmoji}>🪔</Text>
            </View>
          </View>
          <View style={styles.dateBadgePill}>
            <Text style={styles.dateBadgeText}>WOMART FESTIVE SPECIAL</Text>
          </View>
        </View>

        {/* 4-Column Product Grid (Clean Cutouts & Real Store Products) */}
        <View style={styles.gridRow}>
          {DIWALI_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.88}
              onPress={() => handleCardPress(card)}
              style={styles.gridCard}
            >
              <View style={styles.cardHeaderBox}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {card.title}
                </Text>
              </View>

              <View style={styles.cardImgWrapper}>
                <Image
                  source={{ uri: card.img }}
                  style={styles.cardProductImg}
                  resizeMode="contain"
                />
              </View>

              {card.product ? (
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>₹{card.product.sellingPrice}</Text>
                  {card.product.mrp > card.product.sellingPrice && (
                    <Text style={styles.mrpCrossText}>₹{card.product.mrp}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{card.tag}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Powered By Brand Footer */}
        <View style={styles.diwaliBrandsFooter}>
          <Text style={styles.poweredByText}>POWERED BY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScroll}
          >
            {DIWALI_BRANDS.map((brand, idx) => (
              <View key={`dbrand_${idx}`} style={styles.brandChip}>
                <Text style={styles.brandChipText}>{brand}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Spacer between sections */}
      <View style={{ height: 20 }} />

      {/* =========================================================================
          SECTION 2: "FESTIVE SEASON ESSENTIALS" (Warm Cream / Off-White Theme)
         ========================================================================= */}
      <View style={[styles.bannerContainer, { width: containerWidth, backgroundColor: '#FFF8F3' }]}>
        {/* Background Image Layer */}
        <Image
          source={FESTIVE_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Delicate Golden Fairy Lights across top border */}
        <View style={styles.fairyLightsRow}>
          {[...Array(isWebWide ? 20 : 12)].map((_, i) => {
            const anim = i % 2 === 0 ? blinkAnim1 : blinkAnim2;
            const bulbClass = i % 2 === 0 ? 'blinking-light' : 'blinking-light-delay';
            return (
              <Animated.View
                key={`festive_bulb_${i}`}
                // @ts-ignore
                className={bulbClass}
                style={[
                  styles.lightBulb,
                  {
                    backgroundColor: '#F59E0B',
                    shadowColor: '#F59E0B',
                    opacity: anim,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Header: YOUR GO-TO ESSENTIALS FOR THE Festive Season */}
        <View style={styles.festiveHeaderBox}>
          <Text style={styles.festivePreTitle}>YOUR GO-TO ESSENTIALS FOR THE</Text>
          <View style={styles.festiveTitleRow}>
            <Text style={styles.diamondDecor}>❖❖❖</Text>
            <Text style={styles.festiveMainTitle}>Festive Season Essentials</Text>
            <Text style={styles.diamondDecor}>❖❖❖</Text>
          </View>
        </View>

        {/* 4-Column Festive Cards (Home Cleaning, Cooking Essentials, Party Drinks, Personal Care) */}
        <View style={styles.gridRow}>
          {FESTIVE_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.88}
              onPress={() => handleCardPress(card)}
              style={[styles.gridCard, { backgroundColor: '#FFFFFF', borderColor: '#FDE68A' }]}
            >
              <View style={styles.cardHeaderBox}>
                <Text style={[styles.cardTitle, { color: '#1E293B' }]} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {card.sub}
                </Text>
              </View>

              <View style={styles.cardImgWrapper}>
                <Image
                  source={{ uri: card.img }}
                  style={styles.cardProductImg}
                  resizeMode="contain"
                />
              </View>

              {card.product ? (
                <View style={[styles.pricePill, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.pricePillText}>₹{card.product.sellingPrice}</Text>
                  <Text style={styles.addBtnLabel}>+ ADD</Text>
                </View>
              ) : (
                <View style={[styles.tagPill, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.tagPillText, { color: '#0F172A' }]}>{card.tag}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Powered By Brand Footer */}
        <View style={[styles.diwaliBrandsFooter, { borderTopColor: 'rgba(0,0,0,0.06)' }]}>
          <Text style={[styles.poweredByText, { color: '#64748B' }]}>POWERED BY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScroll}
          >
            {FESTIVE_BRANDS.map((brand, idx) => (
              <View key={`fbrand_${idx}`} style={[styles.brandChip, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.brandChipText, { color: '#1E293B' }]}>{brand}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 14,
  },
  bannerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  fairyLightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lightBulb: {
    width: 9,
    height: 13,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
    elevation: 3,
  },

  // Diwali Header
  diwaliHeaderBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  diwaliPreTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: '#FDE047',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  diwaliTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diwaliMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(251, 191, 36, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  diyaGlowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diyaEmoji: {
    fontSize: 20,
  },
  dateBadgePill: {
    backgroundColor: 'rgba(30, 0, 15, 0.7)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 6,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 1.5,
  },

  // 4-Column Grid
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE047',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    minHeight: 145,
  },
  cardHeaderBox: {
    alignItems: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#450A0A',
    textAlign: 'center',
    lineHeight: 14,
  },
  cardSubtitle: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  cardImgWrapper: {
    width: 64,
    height: 64,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardProductImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    width: '100%',
  },
  pricePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mrpCrossText: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
  },
  addBtnLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tagPill: {
    backgroundColor: 'rgba(120, 53, 15, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: '100%',
    alignItems: 'center',
  },
  tagPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },

  // Brands Footer
  diwaliBrandsFooter: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  poweredByText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FDE047',
    letterSpacing: 1,
    marginRight: 10,
  },
  brandsScroll: {
    alignItems: 'center',
    gap: 8,
  },
  brandChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  brandChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Festive Season Light Banner Styles
  festiveHeaderBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  festivePreTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1E3A8A',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  festiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  festiveMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  diamondDecor: {
    fontSize: 10,
    color: '#3B82F6',
    letterSpacing: 2,
  },
});
