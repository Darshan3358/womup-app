import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocalVendor } from '../types/localShop.types';

interface ShopCardProps {
  vendor: LocalVendor;
  onPressShop: (vendor: LocalVendor) => void;
  onPressPayQR?: (vendor: LocalVendor) => void;
}

export const formatDistance = (dist?: number) => {
  if (dist === undefined || dist === null || isNaN(dist)) return 'Nearby';
  if (dist < 1.0) {
    const meters = Math.round(dist * 1000);
    return meters <= 0 ? '50 m' : `${meters} m`;
  }
  return `${dist.toFixed(1)} km`;
};

export const ShopCard: React.FC<ShopCardProps> = ({
  vendor,
  onPressShop,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Left: Thumbnail with Floating Percentage Coin Badge */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: vendor.image }} style={styles.thumbnail} />

        {/* Floating Shopping Coin Badge */}
        <View style={[styles.coinBadge, { backgroundColor: vendor.badgeColor }]}>
          <Text style={styles.coinBadgePercent}>{vendor.coinPercentage}%</Text>
          <Text style={styles.coinBadgeLabel}>Shopping Coin</Text>
        </View>
      </View>

      {/* Right: Vendor Details & Actions */}
      <View style={styles.contentCol}>
        {/* Top Row: Name + Verified Tick, and Distance Pill */}
        <View style={styles.titleRow}>
          <View style={styles.nameAndTick}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {vendor.name}
            </Text>
            {vendor.verified && (
              <Ionicons name="checkmark-circle" size={17} color="#10B981" style={{ marginLeft: 4 }} />
            )}
          </View>

          {/* Distance Pill */}
          <View style={styles.distancePill}>
            <Ionicons name="location-sharp" size={12} color="#E11D48" />
            <Text style={styles.distanceText}>{formatDistance(vendor.distanceKm)}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <Ionicons name="location-sharp" size={13} color="#0F172A" style={styles.infoIcon} />
          <Text style={styles.infoText} numberOfLines={1}>
            {vendor.address}
          </Text>
        </View>

        {/* Phone */}
        <View style={styles.infoRow}>
          <Ionicons name="call" size={12} color="#0F172A" style={styles.infoIcon} />
          <Text style={styles.infoText}>{vendor.phone}</Text>
        </View>

        {/* Timings & Shop Now Button Row */}
        <View style={styles.bottomActionRow}>
          <View style={styles.timingCol}>
            <Ionicons name="time-outline" size={13} color="#0F172A" style={styles.infoIcon} />
            <Text style={styles.timingText}>{vendor.timings}</Text>
          </View>

          {/* Shop Now Button */}
          <TouchableOpacity
            style={[styles.shopNowBtn, { backgroundColor: vendor.buttonColor }]}
            activeOpacity={0.85}
            onPress={() => onPressShop(vendor)}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    width: 105,
    height: 98,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  coinBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  coinBadgePercent: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  coinBadgeLabel: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '700',
    lineHeight: 9,
    letterSpacing: -0.1,
  },
  contentCol: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameAndTick: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  vendorName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    gap: 3,
    borderWidth: 0.8,
    borderColor: '#FFE4E6',
  },
  distanceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  infoIcon: {
    marginRight: 5,
  },
  infoText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  timingText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
  },
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
