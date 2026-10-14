import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface UserCoinHeroProps {
  userName?: string;
  userId?: string;
  coinBalance?: number;
  userAvatar?: string;
  onPressProfile?: () => void;
  onPressCoins?: () => void;
}

export const UserCoinHero: React.FC<UserCoinHeroProps> = ({
  userName = 'Manish Shah',
  userId = 'WM100258',
  coinBalance = 2000,
  userAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  onPressProfile,
  onPressCoins,
}) => {
  return (
    <View style={styles.outerWrapper}>
      <LinearGradient
        colors={['#1D4ED8', '#7C3AED', '#DB2777']}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={styles.gradientCard}
      >
        {/* Left Side: User Info */}
        <TouchableOpacity
          style={styles.userInfoCol}
          activeOpacity={0.8}
          onPress={onPressProfile}
        >
          <View style={styles.avatarBorder}>
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.welcomeLabel}>Welcome,</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userNameText} numberOfLines={1}>
                {userName}
              </Text>
              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.userIdText}>Sponsor ID : {userId}</Text>
          </View>
        </TouchableOpacity>

        {/* Right Side: My Shopping Coin Card */}
        <TouchableOpacity
          style={styles.coinCard}
          activeOpacity={0.85}
          onPress={onPressCoins}
        >
          {/* Gold Coin Icon */}
          <View style={styles.coinIconWrapper}>
            <View style={styles.outerGoldRing}>
              <View style={styles.innerGoldCoin}>
                <Text style={styles.coinRupeeSymbol}>₹</Text>
              </View>
            </View>
          </View>

          {/* Coin Texts */}
          <View style={styles.coinDetails}>
            <Text style={styles.coinCardLabel}>My</Text>
            <Text style={styles.coinCardSubLabel}>Shopping Coin</Text>
            <View style={styles.coinAmountRow}>
              <Text style={styles.coinAmountText}>
                {coinBalance.toLocaleString('en-IN')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#DB2777" />
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  gradientCard: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  userInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  welcomeLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chevronCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIdText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  coinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 130,
  },
  coinIconWrapper: {
    marginRight: 8,
  },
  outerGoldRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  innerGoldCoin: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#FBBF24',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinRupeeSymbol: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E',
  },
  coinDetails: {
    flexDirection: 'column',
  },
  coinCardLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 11,
  },
  coinCardSubLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 12,
  },
  coinAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  coinAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E11D48',
    letterSpacing: -0.2,
  },
});
