import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

interface GaneshCardItem {
  id: string;
  title: string;
  image: any;
}

const GANESH_CARDS: GaneshCardItem[] = [
  {
    id: 'pooja_needs',
    title: 'Pooja Needs\n& Idols',
    image: require('../../../assets/ganesh_pooja_needs.jpg'),
  },
  {
    id: 'modak_snacks',
    title: 'Modak\n& Snacks',
    image: require('../../../assets/ganesh_modak_snacks.jpg'),
  },
  {
    id: 'festive_ready',
    title: 'Festive\nReady',
    image: require('../../../assets/ganesh_festive_ready.jpg'),
  },
  {
    id: 'decor_flowers',
    title: 'Decor\n& Flowers',
    image: require('../../../assets/ganesh_pooja_needs.jpg'),
  },
];

interface GaneshChaturthiSectionProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const GaneshChaturthiSection: React.FC<GaneshChaturthiSectionProps> = ({
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      {/* Ornate Festive Background */}
      <ImageBackground
        source={require('../../../assets/ganesh_chaturthi_festive_bg.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        {/* Dark warm gradient overlay to ensure text & cards pop */}
        <View style={styles.overlay}>
          {/* Header Area */}
          <View style={styles.headerArea}>
            <View style={styles.tilakBadge}>
              <Text style={styles.omSymbol}>𑁍</Text>
            </View>
            <Text style={styles.celebrateText}>C E L E B R A T E</Text>
            <Text style={styles.ganeshChaturthiTitle}>Ganesh Chaturthi</Text>
          </View>

          {/* Festive Category Cards Rail */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRail}
          >
            {GANESH_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                activeOpacity={0.88}
                onPress={() => onSelectCategory?.(card.id)}
                style={styles.card}
              >
                {/* Card Title Header */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                </View>

                {/* Card Photo */}
                <View style={styles.cardImageContainer}>
                  <Image
                    source={card.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Powered by sponsors row */}
          <View style={styles.poweredByRow}>
            <Text style={styles.poweredByLabel}>POWERED BY</Text>
            <View style={styles.sponsorPill}>
              <Text style={styles.sponsorText}>Haldiram's</Text>
            </View>
            <View style={styles.sponsorPill}>
              <Text style={styles.sponsorText}>California Almonds</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    width: '100%',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    minHeight: 310,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(56, 17, 12, 0.45)',
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  tilakBadge: {
    marginBottom: 4,
  },
  omSymbol: {
    color: COLORS.hotPink,
    fontSize: 20,
  },
  celebrateText: {
    color: COLORS.lightPink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 2,
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  ganeshChaturthiTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  cardsRail: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  card: {
    width: 114,
    height: 154,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 44,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  cardImageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.white,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  poweredByLabel: {
    color: COLORS.lightPink,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  sponsorPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.4)',
  },
  sponsorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
