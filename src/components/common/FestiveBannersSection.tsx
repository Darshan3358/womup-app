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

  // Blinking Fairy Lights Animation for Native (CSS keyframes used on web)
  const blinkAnim1 = useRef(new Animated.Value(0.4)).current;
  const blinkAnim2 = useRef(new Animated.Value(1)).current;
  const blinkAnim3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim1, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(blinkAnim1, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim2, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(blinkAnim2, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim3, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(blinkAnim3, { toValue: 0.4, duration: 900, useNativeDriver: true }),
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
  const sweetProd = findProd(['paneer', 'sweet', 'mithai', 'dahi']);
  const drinkProd = findProd(['tropicana', 'juice', 'beverage']);
  const saltProd = findProd(['salt', 'tata']);

  // DIWALI READY CARDS (8 Items)
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
      title: 'Furnishing,\nDining & Decor',
      tag: 'Up to 50% OFF',
      category: 'Household Essentials',
      catId: 'c7',
      img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=350&q=80',
      product: null,
    },
    {
      id: 'd3',
      title: 'Home\nUpgrade',
      tag: 'Festive Deals',
      category: 'Electronics',
      catId: 'c11',
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=350&q=80',
      product: null,
    },
    {
      id: 'd4',
      title: 'House Party\n& Snacks',
      tag: 'Flat 20% OFF',
      category: 'Chips & Namkeen',
      catId: 'c2',
      img: snacksProd?.imageUrl || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=350&q=80',
      product: snacksProd,
    },
    {
      id: 'd5',
      title: 'Dry Fruits\n& Sweets',
      tag: 'Pure Ghee',
      category: 'Oil, Ghee & Masala',
      catId: 'c4',
      img: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=350&q=80',
      product: dairyProd,
    },
    {
      id: 'd6',
      title: 'Artisanal\nGift Boxes',
      tag: 'Under ₹499',
      category: 'Bakery & Biscuits',
      catId: 'c5',
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=350&q=80',
      product: fruitProd,
    },
    {
      id: 'd7',
      title: 'Chocolates\n& Hampers',
      tag: 'Min 25% OFF',
      category: 'Snacks & Sweets',
      catId: 'c2',
      img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=350&q=80',
      product: null,
    },
    {
      id: 'd8',
      title: 'Signature\nGifting',
      tag: 'Best Combos',
      category: 'Household Essentials',
      catId: 'c7',
      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=350&q=80',
      product: null,
    },
  ];

  // FESTIVE SEASON CARDS (4 Curated Columns)
  const FESTIVE_CARDS = [
    {
      id: 'f1',
      title: 'Get\nReady',
      sub: 'Fragrance & Grooming',
      tag: 'From ₹49',
      category: 'Personal Care',
      catId: 'c8',
      bgColor: '#1E3A8A',
      img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
      product: null,
    },
    {
      id: 'f2',
      title: 'Home\nCleaning',
      sub: 'Floor & Hygiene Care',
      tag: 'Up to 40% OFF',
      category: 'Household Essentials',
      catId: 'c7',
      bgColor: '#1D4ED8',
      img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
      product: null,
    },
    {
      id: 'f3',
      title: 'Cooking\nEssentials',
      sub: 'Oil, Atta & Basmati',
      tag: 'Starting ₹12',
      category: 'Oil, Ghee & Masala',
      catId: 'c4',
      bgColor: '#2563EB',
      img: oilProd?.imageUrl || attaProd?.imageUrl || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
      product: oilProd || attaProd,
    },
    {
      id: 'f4',
      title: 'House\nParty',
      sub: 'Juices, Sips & Dips',
      tag: 'Flat 20% OFF',
      category: 'Chips & Namkeen',
      catId: 'c2',
      bgColor: '#0284C7',
      img: drinkProd?.imageUrl || snacksProd?.imageUrl || 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
      product: drinkProd || snacksProd,
    },
  ];

  const DIWALI_BRANDS = [
    'Farmley',
    'Happilo',
    'California Almonds',
    'Ferrero Rocher',
    'Lifelong',
    'Prestige',
    'IRIS',
    'myTRIDENT',
    'BOROSIL',
    'Cadbury',
    'Mangaldeep',
  ];

  const FESTIVE_BRANDS = [
    'McCain',
    'Real',
    'Bingo!',
    "L'OREAL",
    'BBLUNT',
    'aer',
    'Harpic',
    'Natureland',
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
          BANNER 1: DIWALI READY (Royal Maroon / Deep Purple Theme with Glowing Diyas)
         ========================================================================= */}
      <View style={[styles.bannerContainer, { width: containerWidth, backgroundColor: '#470024' }]}>
        {/* Background Image Layer */}
        <Image
          source={DIWALI_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Decorative Top Border Garland Fairy Lights (Blinking) */}
        <View style={styles.fairyLightsRow}>
          {[...Array(isWebWide ? 22 : 12)].map((_, i) => {
            const anim = i % 3 === 0 ? blinkAnim1 : i % 3 === 1 ? blinkAnim2 : blinkAnim3;
            const colors = ['#FBBF24', '#F43F5E', '#34D399', '#60A5FA', '#F59E0B'];
            const bulbColor = colors[i % colors.length];
            return (
              <Animated.View
                key={`diwali_bulb_${i}`}
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

        {/* Header Section with Arch, Diyas & Date Pill */}
        <View style={styles.diwaliHeaderBox}>
          <Text style={styles.diwaliPreTitle}>MAKE YOUR HOME</Text>
          <View style={styles.diwaliTitleRow}>
            {/* Glowing Diya Left */}
            <View style={styles.diyaGlowBox}>
              <Text style={styles.diyaEmoji}>🪔</Text>
            </View>

            <Text style={styles.diwaliMainTitle}>Diwali Ready</Text>

            {/* Glowing Diya Right */}
            <View style={styles.diyaGlowBox}>
              <Text style={styles.diyaEmoji}>🪔</Text>
            </View>
          </View>

          {/* Date Badge Pill */}
          <View style={styles.dateBadgePill}>
            <Text style={styles.dateBadgeText}>8TH NOVEMBER, SUNDAY</Text>
          </View>
        </View>

        {/* 2x4 Grid of Products / Festive Categories */}
        <View style={styles.diwaliCardsGrid}>
          {DIWALI_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.88}
              onPress={() => handleCardPress(card)}
              style={styles.diwaliCard}
            >
              <View style={styles.diwaliCardTop}>
                <Text style={styles.diwaliCardTitle} numberOfLines={2}>
                  {card.title}
                </Text>
              </View>

              <View style={styles.diwaliCardImgBox}>
                <Image
                  source={{ uri: card.img }}
                  style={styles.diwaliCardImg}
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

        {/* Decorative Diamond Bottom Trim */}
        <View style={styles.bottomDiamondTrim}>
          <Text style={styles.trimText}>❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖</Text>
        </View>
      </View>

      {/* Spacer between banners */}
      <View style={{ height: 20 }} />

      {/* =========================================================================
          BANNER 2: FESTIVE SEASON (Warm Cream / Soft Gold Light Theme)
         ========================================================================= */}
      <View style={[styles.bannerContainer, { width: containerWidth, backgroundColor: '#FFFBF0' }]}>
        {/* Background Image Layer */}
        <Image
          source={FESTIVE_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Delicate Fairy Lights across top border */}
        <View style={styles.fairyLightsRow}>
          {[...Array(isWebWide ? 22 : 12)].map((_, i) => {
            const anim = i % 2 === 0 ? blinkAnim1 : blinkAnim2;
            return (
              <Animated.View
                key={`festive_bulb_${i}`}
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
            <Text style={styles.festiveMainTitle}>Festive Season</Text>
            <Text style={styles.diamondDecor}>❖❖❖</Text>
          </View>
        </View>

        {/* 4 Vertical Festive Cards (Get Ready, Home Cleaning, Cooking Essentials, House Party) */}
        <View style={styles.festiveCardsRow}>
          {FESTIVE_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.88}
              onPress={() => handleCardPress(card)}
              style={[styles.festiveCard, { backgroundColor: card.bgColor }]}
            >
              <View style={styles.festiveCardHead}>
                <Text style={styles.festiveCardTitle} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={styles.festiveCardSub} numberOfLines={1}>
                  {card.sub}
                </Text>
              </View>

              <View style={styles.festiveCardImgContainer}>
                <Image
                  source={{ uri: card.img }}
                  style={styles.festiveCardImg}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.festiveCardBottom}>
                {card.product ? (
                  <View style={styles.festiveProductBadge}>
                    <Text style={styles.festiveProductPrice}>₹{card.product.sellingPrice}</Text>
                    <Text style={styles.festiveAddBtnText}>+ ADD</Text>
                  </View>
                ) : (
                  <View style={styles.festiveTagBadge}>
                    <Text style={styles.festiveTagText}>{card.tag}</Text>
                  </View>
                )}
              </View>
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
    paddingBottom: 12,
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
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  lightBulb: {
    width: 8,
    height: 12,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  // Diwali Header
  diwaliHeaderBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
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

  // 2x4 Cards Grid
  diwaliCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
  },
  diwaliCard: {
    width: '23%',
    minWidth: 74,
    backgroundColor: '#FEF9C3',
    borderRadius: 14,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE047',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 4,
  },
  diwaliCardTop: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diwaliCardTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#450A0A',
    textAlign: 'center',
    lineHeight: 12,
  },
  diwaliCardImgBox: {
    width: 54,
    height: 54,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diwaliCardImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pricePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mrpCrossText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
  },
  tagPill: {
    backgroundColor: 'rgba(120, 53, 15, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tagPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#92400E',
  },

  // Brands Footer
  diwaliBrandsFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    gap: 6,
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
  bottomDiamondTrim: {
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.4,
  },
  trimText: {
    fontSize: 8,
    color: '#FDE047',
    letterSpacing: 6,
  },

  // Festive Season Light Banner Styles
  festiveHeaderBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
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
  festiveCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
  },
  festiveCard: {
    flex: 1,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    minHeight: 150,
  },
  festiveCardHead: {
    alignItems: 'center',
  },
  festiveCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14,
  },
  festiveCardSub: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  festiveCardImgContainer: {
    width: 60,
    height: 60,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  festiveCardImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  festiveCardBottom: {
    width: '100%',
    alignItems: 'center',
  },
  festiveProductBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  festiveProductPrice: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
  },
  festiveAddBtnText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#16A34A',
  },
  festiveTagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  festiveTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
