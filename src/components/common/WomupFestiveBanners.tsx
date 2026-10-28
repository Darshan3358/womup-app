import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

export interface WomupFestiveBannersProps {
  onSelectCategory?: (categoryName: string, categoryId?: string) => void;
  onOpenProduct?: (productName: string) => void;
  variant?: 'both' | 'diwali' | 'festive';
}

export const WomupFestiveBanners: React.FC<WomupFestiveBannersProps> = ({
  onSelectCategory,
  onOpenProduct,
  variant = 'both',
}) => {
  const { width } = useWindowDimensions();

  // Blinking Fairy Lights Animation
  const blinkAnim1 = useRef(new Animated.Value(1)).current;
  const blinkAnim2 = useRef(new Animated.Value(0.4)).current;
  const blinkAnim3 = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim1, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(blinkAnim1, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim2, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim2, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ])
    );
    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim3, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(blinkAnim3, { toValue: 1.0, duration: 800, useNativeDriver: true }),
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

  // 1. DIWALI READY - 8 Featured Cards (Peaked Arch Shape with real WOMART project products - Clean Transparent Cutouts)
  const diwaliCards = [
    {
      id: 'd1',
      title: 'Fresh Veggies',
      categoryName: 'Vegetables & Fruits',
      categoryId: 'c1',
      localImage: require('../../../assets/festive_products/veggies_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229302/festive_veggies_trans.png',
    },
    {
      id: 'd2',
      title: 'Fresh Fruits',
      categoryName: 'Vegetables & Fruits',
      categoryId: 'c1',
      localImage: require('../../../assets/festive_products/fruits_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229293/festive_fruits_trans.png',
    },
    {
      id: 'd3',
      title: 'Milk & Dairy',
      categoryName: 'Dairy, Bread & Eggs',
      categoryId: 'c3',
      localImage: require('../../../assets/festive_products/milk_combo_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229295/festive_milk_combo_trans.png',
    },
    {
      id: 'd4',
      title: 'Fortune Oil & Ghee',
      categoryName: 'Atta, Rice & Dal',
      categoryId: 'c2',
      localImage: require('../../../assets/festive_products/oil_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229298/festive_oil_trans.png',
    },
    {
      id: 'd5',
      title: 'Lights & Diya',
      categoryName: 'Pooja & Festive',
      categoryId: 'c11',
      localImage: require('../../../assets/festive_products/diya_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229291/festive_diya_trans.png',
    },
    {
      id: 'd6',
      title: 'Dry Fruits & Sweets',
      categoryName: 'Sweets & Chocolates',
      categoryId: 'c5',
      localImage: require('../../../assets/festive_products/sweets_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229301/festive_sweets_trans.png',
    },
    {
      id: 'd7',
      title: 'Atta & Rice',
      categoryName: 'Atta, Rice & Dal',
      categoryId: 'c2',
      localImage: require('../../../assets/festive_products/atta_combo_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229287/festive_atta_combo_trans.png',
    },
    {
      id: 'd8',
      title: 'Snacks & Juices',
      categoryName: 'Chips & Namkeen',
      categoryId: 'c4',
      localImage: require('../../../assets/festive_products/snacks_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229300/festive_snacks_trans.png',
    },
  ];

  // 2. FESTIVE SEASON ESSENTIALS - 4 Vertical Royal Blue Cards (with real WOMART products - Clean Transparent Cutouts)
  const festiveSeasonCards = [
    {
      id: 'f1',
      title: 'Get Ready',
      sub: 'Grooming & Glow',
      categoryName: 'Beauty & Personal Care',
      categoryId: 'c7',
      localImage: require('../../../assets/festive_products/get_ready_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229294/festive_get_ready_trans.png',
    },
    {
      id: 'f2',
      title: 'Home Cleaning',
      sub: 'Floor & Sparkle',
      categoryName: 'Cleaning Essentials',
      categoryId: 'c6',
      localImage: require('../../../assets/festive_products/cleaning_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229290/festive_cleaning_trans.png',
    },
    {
      id: 'f3',
      title: 'Cooking Essentials',
      sub: 'Oil, Atta & Ghee',
      categoryName: 'Atta, Rice & Dal',
      categoryId: 'c2',
      localImage: require('../../../assets/festive_products/cooking_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229290/festive_cooking_trans.png',
    },
    {
      id: 'f4',
      title: 'House Party',
      sub: 'Drinks & Munchies',
      categoryName: 'Chips & Namkeen',
      categoryId: 'c4',
      localImage: require('../../../assets/festive_products/snacks_trans.png'),
      image: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793229300/festive_snacks_trans.png',
    },
  ];

  const handleCardPress = (card: { categoryName: string; categoryId?: string; title: string }) => {
    if (onSelectCategory) {
      onSelectCategory(card.categoryName, card.categoryId);
    } else if (onOpenProduct) {
      onOpenProduct(card.title);
    }
  };

  // Render Fairy Light Bulbs at the top of Diwali Banner
  const fairyLights = [
    blinkAnim1, blinkAnim2, blinkAnim3, blinkAnim1, blinkAnim2,
    blinkAnim3, blinkAnim1, blinkAnim2, blinkAnim3, blinkAnim1,
    blinkAnim2, blinkAnim3, blinkAnim1, blinkAnim2, blinkAnim3,
  ];

  return (
    <View style={[styles.outerContainer, variant !== 'both' && { marginVertical: 4, gap: 0 }]}>
      {/* =========================================================================
          BANNER 1: DIWALI READY (Royal Magenta / Maroon Palace Arch Theme)
         ========================================================================= */}
      {(variant === 'both' || variant === 'diwali') && (
        <View style={styles.diwaliContainer}>
          {/* Blinking Fairy Lights String across the top with Curved Light-Black Connecting Wire */}
          <View style={styles.fairyLightsRow}>
            {/* Curved connecting wire in light black */}
            <View style={styles.wireContainer} pointerEvents="none">
              <Svg width="100%" height={18} viewBox="0 0 1000 18" preserveAspectRatio="none">
                <Path
                  d="M 0 4 Q 35.7 10, 71.4 4 Q 107.1 10, 142.9 4 Q 178.6 10, 214.3 4 Q 250.0 10, 285.7 4 Q 321.4 10, 357.1 4 Q 392.9 10, 428.6 4 Q 464.3 10, 500.0 4 Q 535.7 10, 571.4 4 Q 607.1 10, 642.9 4 Q 678.6 10, 714.3 4 Q 750.0 10, 785.7 4 Q 821.4 10, 857.1 4 Q 892.9 10, 928.6 4 Q 964.3 10, 1000.0 4"
                  stroke="#2B2B2B"
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeOpacity={0.85}
                />
              </Svg>
            </View>

            {fairyLights.map((anim, idx) => (
              <View key={`bulb-${idx}`} style={styles.fairyBulbWrapper}>
                <View style={styles.fairyBulbWire} />
                <Animated.View
                  style={[
                    styles.fairyBulb,
                    {
                      opacity: anim,
                      backgroundColor: idx % 3 === 0 ? '#FDE047' : idx % 3 === 1 ? '#F97316' : '#FFFFFF',
                      shadowColor: idx % 3 === 0 ? '#FDE047' : '#FB923C',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Decorative Golden Arch & Diyas Header */}
          <View style={styles.diwaliHeaderBox}>
            {/* Left Diya Ornament */}
            <View style={styles.diyaOrnament}>
              <Text style={styles.diyaGlowText}>✦</Text>
              <Svg width={36} height={28} viewBox="0 0 36 28">
                <Defs>
                  <SvgLinearGradient id="goldGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FDE047" />
                    <Stop offset="50%" stopColor="#EAB308" />
                    <Stop offset="100%" stopColor="#CA8A04" />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M18 2 C18 2, 22 8, 22 12 C22 14.5, 20.2 16.5, 18 16.5 C15.8 16.5, 14 14.5, 14 12 C14 8, 18 2, 18 2 Z"
                  fill="#FEF08A"
                />
                <Path
                  d="M4 16 C6 24, 30 24, 32 16 C30 20, 6 20, 4 16 Z"
                  fill="url(#goldGrad1)"
                />
              </Svg>
            </View>

            {/* Center Titles */}
            <View style={styles.diwaliTitleCenter}>
              <Text style={styles.diwaliSubTitle}>MAKE YOUR HOME</Text>
              <Text style={styles.diwaliMainTitle}>Diwali Ready</Text>
              <View style={styles.diwaliDatePill}>
                <Text style={styles.diwaliDateText}>WOMART FESTIVE SPECIAL</Text>
              </View>
            </View>

            {/* Right Diya Ornament */}
            <View style={styles.diyaOrnament}>
              <Text style={styles.diyaGlowText}>✦</Text>
              <Svg width={36} height={28} viewBox="0 0 36 28">
                <Defs>
                  <SvgLinearGradient id="goldGrad2" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FDE047" />
                    <Stop offset="50%" stopColor="#EAB308" />
                    <Stop offset="100%" stopColor="#CA8A04" />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M18 2 C18 2, 22 8, 22 12 C22 14.5, 20.2 16.5, 18 16.5 C15.8 16.5, 14 14.5, 14 12 C14 8, 18 2, 18 2 Z"
                  fill="#FEF08A"
                />
                <Path
                  d="M4 16 C6 24, 30 24, 32 16 C30 20, 6 20, 4 16 Z"
                  fill="url(#goldGrad2)"
                />
              </Svg>
            </View>
          </View>

          {/* 2x4 Product Grid with Distinct Peaked Arch Cards (matching exact shape) */}
          <View style={styles.diwaliGrid}>
            {diwaliCards.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.diwaliCard}
                onPress={() => handleCardPress(item)}
              >
                {/* Peaked Temple Arch SVG Background (exact match to user screenshot) */}
                <View style={StyleSheet.absoluteFill}>
                  <Svg width="100%" height="100%" viewBox="0 0 100 135" preserveAspectRatio="none">
                    <Path
                      d="M 10 16 L 44 2.5 Q 50 0 56 2.5 L 90 16 Q 100 21 100 32 L 100 118 Q 100 135 84 135 L 16 135 Q 0 135 0 118 L 0 32 Q 0 21 10 16 Z"
                      fill="#FDF3DA"
                      stroke="#FDE68A"
                      strokeWidth={1}
                    />
                  </Svg>
                </View>

                {/* Title Section (Upper center under the peak) */}
                <View style={styles.diwaliCardHeader}>
                  <Text style={styles.diwaliCardHeaderText} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>

                {/* 3D Product Image (Bottom half with clean transparent float) */}
                <View style={styles.diwaliCardBody}>
                  <Image
                    source={item.localImage || { uri: item.image }}
                    style={[
                      styles.diwaliCardImage,
                      item.id === 'd1' && styles.tomatoCardImage,
                    ]}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Powered By Brand Strip */}
          <View style={styles.poweredByDiwaliRow}>
            <Text style={styles.poweredByText}>POWERED BY</Text>
            <View style={styles.brandTagsRow}>
              <View style={styles.brandBadgePill}><Text style={styles.brandBadgeText}>Amul</Text></View>
              <View style={styles.brandBadgePill}><Text style={styles.brandBadgeText}>Fortune Oil</Text></View>
              <View style={styles.brandBadgePill}><Text style={styles.brandBadgeText}>TATA</Text></View>
              <View style={styles.brandBadgePill}><Text style={styles.brandBadgeText}>Aashirvaad</Text></View>
              <View style={styles.brandBadgePill}><Text style={styles.brandBadgeText}>Farmley</Text></View>
              <View style={styles.brandBadgePill}><Text style={styles.brandBadgeText}>Happilo</Text></View>
            </View>
          </View>

          {/* Bottom Diamond Motif Border */}
          <View style={styles.bottomDiamondRow}>
            {Array.from({ length: 22 }).map((_, i) => (
              <Text key={`dia-${i}`} style={styles.diamondDot}>◆</Text>
            ))}
          </View>
        </View>
      )}

      {/* =========================================================================
          BANNER 2: FESTIVE SEASON (Warm Cream & Sapphire Blue Vertical Cards with Custom Background)
         ========================================================================= */}
      {(variant === 'both' || variant === 'festive') && (
        <ImageBackground
          source={require('../../../assets/banners/festive_banner_bg.png')}
          style={styles.festiveSeasonContainer}
          imageStyle={styles.festiveSeasonBgImage}
          resizeMode="cover"
        >
          {/* 4 Vertical Royal Blue Cards */}
          <View style={styles.festiveCardsRow}>
            {festiveSeasonCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                activeOpacity={0.88}
                style={styles.festiveCard}
                onPress={() => handleCardPress(card)}
              >
                {/* Card Top Title in White */}
                <View style={styles.festiveCardTitleBox}>
                  <Text style={styles.festiveCardTitle} numberOfLines={2}>
                    {card.title}
                  </Text>
                </View>

                {/* Product Image Stage (Clean transparent cutout floating directly on sapphire card) */}
                <View style={styles.festiveProductStage}>
                  <Image
                    source={card.localImage || { uri: card.image }}
                    style={styles.festiveProductImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.festiveCardSubPill}>
                  <Text style={styles.festiveCardSubText}>{card.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ImageBackground>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 10,
    gap: 16,
  },

  // ── DIWALI READY BANNER STYLES ─────────────────────────────────────────────
  diwaliContainer: {
    backgroundColor: '#7A0938',
    borderRadius: 24,
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#7A0938',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  // Blinking Fairy Lights with Curved Connecting Wire
  fairyLightsRow: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 18,
    marginBottom: 6,
  },
  wireContainer: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 18,
  },
  fairyBulbWrapper: {
    alignItems: 'center',
    top: 3,
    zIndex: 2,
  },
  fairyBulbWire: {
    width: 1.5,
    height: 3,
    backgroundColor: '#2B2B2B',
  },
  fairyBulb: {
    width: 6,
    height: 8,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  // Header
  diwaliHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  diyaOrnament: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  diyaGlowText: {
    color: '#FDE047',
    fontSize: 16,
    marginBottom: -4,
  },
  diwaliTitleCenter: {
    alignItems: 'center',
    flex: 1,
  },
  diwaliSubTitle: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  diwaliMainTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(253, 224, 71, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    marginBottom: 6,
  },
  diwaliDatePill: {
    backgroundColor: '#520626',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  diwaliDateText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // 2x4 Product Grid
  diwaliGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 8,
  },
  diwaliCard: {
    width: '23%', // 4 columns
    height: 118,
    position: 'relative',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  diwaliCardHeader: {
    paddingTop: 12,
    paddingHorizontal: 3,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  diwaliCardHeaderText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2E3A45',
    textAlign: 'center',
    lineHeight: 12,
  },
  diwaliCardBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
    zIndex: 2,
  },
  diwaliCardImage: {
    width: '92%',
    height: '92%',
  },
  tomatoCardImage: {
    width: '70%',
    height: '70%',
  },

  // Powered By Row
  poweredByDiwaliRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  poweredByText: {
    color: '#FDE047',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 4,
  },
  brandTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  brandBadgePill: {
    backgroundColor: 'rgba(82, 6, 38, 0.75)',
    borderWidth: 1,
    borderColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  brandBadgeText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Bottom Diamond Border
  bottomDiamondRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    marginTop: 8,
    opacity: 0.6,
  },
  diamondDot: {
    color: '#FDE047',
    fontSize: 7,
  },

  // ── FESTIVE SEASON ESSENTIALS STYLES ───────────────────────────────────────
  festiveSeasonContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingTop: 52,
    paddingBottom: 40,
    paddingHorizontal: 10,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  festiveSeasonBgImage: {
    borderRadius: 22,
  },
  festiveHeaderBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  festiveSubHeader: {
    color: '#1E3A8A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  festiveTitleWithJewels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jewelMotif: {
    color: '#2563EB',
    fontSize: 13,
    letterSpacing: 2,
  },
  festiveMainTitle: {
    color: '#1E3A8A',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // 4 Vertical Royal Blue Cards
  festiveCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  festiveCard: {
    flex: 1,
    backgroundColor: '#1E40AF',
    borderRadius: 18,
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  festiveCardTitleBox: {
    paddingHorizontal: 4,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  festiveCardTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 13,
  },
  festiveProductStage: {
    width: '92%',
    height: 78,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  festiveProductImage: {
    width: '100%',
    height: '100%',
  },
  festiveCardSubPill: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
  },
  festiveCardSubText: {
    color: '#DBEAFE',
    fontSize: 8,
    fontWeight: '700',
  },

  // Powered By Row (Festive)
  poweredByFestiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  poweredByFestiveText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 4,
  },
  brandBadgeBlue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 0.75,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeBlueText: {
    color: '#1D4ED8',
    fontSize: 8.5,
    fontWeight: '700',
  },
});

