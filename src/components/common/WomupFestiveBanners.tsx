import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface WomupFestiveBannersProps {
  onSelectCategory?: (categoryName: string, categoryId?: string) => void;
  onOpenProduct?: (productName: string) => void;
}

export const WomupFestiveBanners: React.FC<WomupFestiveBannersProps> = ({
  onSelectCategory,
  onOpenProduct,
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

  // 1. DIWALI READY - 8 Featured Cards (with real WOMART products)
  const diwaliCards = [
    {
      id: 'd1',
      title: 'Lights, Diya & Decor',
      categoryName: 'Pooja & Festive',
      categoryId: 'c11',
      image: 'https://images.unsplash.com/photo-1605629921711-2f6b00c6bbf4?w=400&q=80',
    },
    {
      id: 'd2',
      title: 'Furnishing & Dining',
      categoryName: 'Home & Kitchen',
      categoryId: 'c9',
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
    },
    {
      id: 'd3',
      title: 'Home Upgrade',
      categoryName: 'Electronics & Appliances',
      categoryId: 'c10',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
    },
    {
      id: 'd4',
      title: 'Festive Party',
      categoryName: 'Chips & Namkeen',
      categoryId: 'c4',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', // Real Lay's & snacks
    },
    {
      id: 'd5',
      title: 'Dry Fruits & Sweets',
      categoryName: 'Sweets & Chocolates',
      categoryId: 'c5',
      image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80', // Almonds & Cashews
    },
    {
      id: 'd6',
      title: 'Artisanal Gift Boxes',
      categoryName: 'Sweets & Chocolates',
      categoryId: 'c5',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80', // Gift Box Hamper
    },
    {
      id: 'd7',
      title: 'Chocolates & Drinks',
      categoryName: 'Cold Drinks & Juices',
      categoryId: 'c8',
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80', // Real Tropicana / Juices
    },
    {
      id: 'd8',
      title: 'Signature Gifting',
      categoryName: 'Beauty & Personal Care',
      categoryId: 'c7',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80', // Luxury Fragrance / Hamper
    },
  ];

  // 2. FESTIVE SEASON ESSENTIALS - 4 Vertical Royal Blue Cards (with real WOMART products)
  const festiveSeasonCards = [
    {
      id: 'f1',
      title: 'Get Ready',
      sub: 'Grooming & Glow',
      categoryName: 'Beauty & Personal Care',
      categoryId: 'c7',
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
    },
    {
      id: 'f2',
      title: 'Home Cleaning',
      sub: 'Floor & Sparkle',
      categoryName: 'Cleaning Essentials',
      categoryId: 'c6',
      image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    },
    {
      id: 'f3',
      title: 'Cooking Essentials',
      sub: 'Oil, Atta & Ghee',
      categoryName: 'Atta, Rice & Dal',
      categoryId: 'c2',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', // Fortune Oil / Aashirvaad
    },
    {
      id: 'f4',
      title: 'House Party',
      sub: 'Drinks & Munchies',
      categoryName: 'Chips & Namkeen',
      categoryId: 'c4',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', // Lay's & snacks
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
    <View style={styles.outerContainer}>
      {/* =========================================================================
          BANNER 1: DIWALI READY (Royal Magenta / Maroon Palace Arch Theme)
         ========================================================================= */}
      <View style={styles.diwaliContainer}>
        {/* Blinking Fairy Lights String across the top */}
        <View style={styles.fairyLightsRow}>
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

        {/* 2x4 Product Grid with Distinct Arched/Shield Cards */}
        <View style={styles.diwaliGrid}>
          {diwaliCards.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.diwaliCard}
              onPress={() => handleCardPress(item)}
            >
              {/* Arched Top Header (Warm Pale Yellow/Cream) */}
              <View style={styles.diwaliCardHeader}>
                <Text style={styles.diwaliCardHeaderText} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>

              {/* Card Body with Product Image */}
              <View style={styles.diwaliCardBody}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.diwaliCardImage}
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
            <View style={styles.brandBadgeGold}><Text style={styles.brandBadgeText}>Farmley</Text></View>
            <View style={styles.brandBadgeGold}><Text style={styles.brandBadgeText}>Happilo</Text></View>
            <View style={styles.brandBadgeGold}><Text style={styles.brandBadgeText}>Amul</Text></View>
            <View style={styles.brandBadgeGold}><Text style={styles.brandBadgeText}>Prestige</Text></View>
            <View style={styles.brandBadgeGold}><Text style={styles.brandBadgeText}>Borosil</Text></View>
            <View style={styles.brandBadgeGold}><Text style={styles.brandBadgeText}>TATA</Text></View>
          </View>
        </View>

        {/* Bottom Diamond Motif Border */}
        <View style={styles.bottomDiamondRow}>
          {Array.from({ length: 22 }).map((_, i) => (
            <Text key={`dia-${i}`} style={styles.diamondDot}>◆</Text>
          ))}
        </View>
      </View>

      {/* =========================================================================
          BANNER 2: FESTIVE SEASON (Warm Cream & Sapphire Blue Vertical Cards)
         ========================================================================= */}
      <View style={styles.festiveSeasonContainer}>
        {/* Top Header with Blue Diamond Jewels */}
        <View style={styles.festiveHeaderBox}>
          <Text style={styles.festiveSubHeader}>YOUR GO-TO ESSENTIALS FOR THE</Text>
          <View style={styles.festiveTitleWithJewels}>
            <Text style={styles.jewelMotif}>❖❖❖</Text>
            <Text style={styles.festiveMainTitle}>Festive Season</Text>
            <Text style={styles.jewelMotif}>❖❖❖</Text>
          </View>
        </View>

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

              {/* Product Image Stage */}
              <View style={styles.festiveProductStage}>
                <Image
                  source={{ uri: card.image }}
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

        {/* Powered By Brand Strip */}
        <View style={styles.poweredByFestiveRow}>
          <Text style={styles.poweredByFestiveText}>POWERED BY</Text>
          <View style={styles.brandTagsRow}>
            <View style={styles.brandBadgeBlue}><Text style={styles.brandBadgeBlueText}>Fortune</Text></View>
            <View style={styles.brandBadgeBlue}><Text style={styles.brandBadgeBlueText}>Aashirvaad</Text></View>
            <View style={styles.brandBadgeBlue}><Text style={styles.brandBadgeBlueText}>Real</Text></View>
            <View style={styles.brandBadgeBlue}><Text style={styles.brandBadgeBlueText}>Bingo!</Text></View>
            <View style={styles.brandBadgeBlue}><Text style={styles.brandBadgeBlueText}>Tata Salt</Text></View>
          </View>
        </View>
      </View>
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

  // Blinking Fairy Lights
  fairyLightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 14,
    marginBottom: 4,
  },
  fairyBulbWrapper: {
    alignItems: 'center',
  },
  fairyBulbWire: {
    width: 1,
    height: 3,
    backgroundColor: '#CA8A04',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  diwaliCardHeader: {
    backgroundColor: '#FEF3C7', // Pale golden cream
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  diwaliCardHeaderText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 12,
  },
  diwaliCardBody: {
    height: 72,
    backgroundColor: '#FFFDF9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  diwaliCardImage: {
    width: '92%',
    height: '92%',
    borderRadius: 8,
  },

  // Powered By Row
  poweredByDiwaliRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
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
    gap: 4,
  },
  brandBadgeGold: {
    backgroundColor: 'rgba(254, 243, 199, 0.18)',
    borderWidth: 0.75,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeText: {
    color: '#FEF3C7',
    fontSize: 8.5,
    fontWeight: '700',
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
    backgroundColor: '#FFFDF5',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    width: '88%',
    height: 78,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  festiveProductImage: {
    width: '94%',
    height: '94%',
    borderRadius: 8,
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
