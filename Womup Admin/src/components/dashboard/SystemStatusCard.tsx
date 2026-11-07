import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import Svg, { Rect, Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface SystemStatusCardProps {
  statusText?: string;
  clusterLabel?: string;
  isOnline?: boolean;
  onViewDetails?: () => void;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  statusText = 'Live WebSocket & DB Active',
  clusterLabel = 'Cluster0',
  isOnline = true,
  onViewDetails,
}) => {
  return (
    <LinearGradient
      colors={['#4F46E5', '#7C3AED', '#9333EA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Top right Online pill */}
      <View style={styles.onlinePill}>
        <View style={styles.onlineDot} />
        <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
      </View>

      <View style={styles.innerContent}>
        {/* Left column: logo + title + status subtitle + button */}
        <View style={styles.leftCol}>
          <View style={styles.headerRow}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../../assets/womup_logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardGreeting}>Good Morning, Admin</Text>
          </View>

          <Text style={styles.statusSubtitle} numberOfLines={2}>
            {statusText} ({clusterLabel})
          </Text>

          {onViewDetails && (
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={onViewDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsBtnText}>View Details</Text>
              <ArrowRight size={13} color="#111044" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right column: 3D Storefront quick-commerce artwork */}
        <View style={styles.storeArtworkWrapper} pointerEvents="none">
          <Svg width={110} height={90} viewBox="0 0 110 90">
            <Defs>
              <SvgLinearGradient id="awningGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#EC4899" />
                <Stop offset="0.25" stopColor="#FFFFFF" />
                <Stop offset="0.5" stopColor="#EC4899" />
                <Stop offset="0.75" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor="#EC4899" />
              </SvgLinearGradient>
            </Defs>

            {/* Shop back building */}
            <Rect x="20" y="30" width="70" height="55" rx="6" fill="#312E81" opacity={0.7} />

            {/* Shop front window / door */}
            <Rect x="30" y="44" width="24" height="40" rx="3" fill="#6366F1" opacity={0.5} />
            <Rect x="60" y="48" width="22" height="36" rx="3" fill="#E0E7FF" opacity={0.85} />

            {/* Striped Awning (Canopy) */}
            <Path
              d="M 12 28 Q 55 18 98 28 L 94 40 Q 55 32 16 40 Z"
              fill="url(#awningGrad)"
            />
            {/* Awning Scallops */}
            <Circle cx="20" cy="40" r="4" fill="#EC4899" />
            <Circle cx="32" cy="38" r="4" fill="#FFFFFF" />
            <Circle cx="44" cy="37" r="4" fill="#EC4899" />
            <Circle cx="56" cy="36" r="4" fill="#FFFFFF" />
            <Circle cx="68" cy="37" r="4" fill="#EC4899" />
            <Circle cx="80" cy="38" r="4" fill="#FFFFFF" />
            <Circle cx="90" cy="40" r="4" fill="#EC4899" />

            {/* Mini Shopping Bag Orange */}
            <Rect x="86" y="62" width="16" height="22" rx="3" fill="#F97316" />
            <Path d="M 90 62 C 90 56, 98 56, 98 62" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Mini Potted Plant on left */}
            <Rect x="14" y="68" width="10" height="14" rx="2" fill="#D97706" />
            <Circle cx="19" cy="62" r="6" fill="#10B981" />
          </Svg>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  onlinePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    zIndex: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    paddingRight: 6,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#05062A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: 18,
    height: 18,
  },
  cardGreeting: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 15,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsBtnText: {
    color: '#111044',
    fontSize: 11.5,
    fontWeight: '700',
  },
  storeArtworkWrapper: {
    width: 110,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

