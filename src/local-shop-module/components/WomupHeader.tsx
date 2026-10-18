import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WomupHeaderProps {
  location?: string;
  onOpenMenu?: () => void;
  onSelectLocation?: () => void;
  onOpenNotifications?: () => void;
  onBackToQuickCommerce?: () => void;
}

export const WomupHeader: React.FC<WomupHeaderProps> = ({
  location = 'Ahmedabad',
  onOpenMenu,
  onSelectLocation,
  onOpenNotifications,
  onBackToQuickCommerce,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Quick Commerce Switcher Banner */}
      {onBackToQuickCommerce && (
        <TouchableOpacity
          style={styles.quickCommerceSwitch}
          activeOpacity={0.8}
          onPress={onBackToQuickCommerce}
          accessibilityLabel="Back to WOMUP Express 9-Min Delivery"
        >
          <View style={styles.switchFlashBadge}>
            <Ionicons name="flash" size={13} color="#FFFFFF" />
          </View>
          <Text style={styles.quickCommerceText}>
            Back to <Text style={{ fontWeight: '800', color: '#92400E' }}>WOMUP Express 9-Min Delivery</Text>
          </Text>
          <View style={styles.switchActionPill}>
            <Text style={styles.switchActionText}>GO BACK</Text>
            <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.headerRow}>
        {/* Left: Hamburger Menu */}
        <View style={styles.leftActionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={onOpenMenu}
            accessibilityLabel="Menu"
          >
            <Ionicons name="menu-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Center: WOMUP Brand Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWRow}>
            {/* 3D Stylized W with Arrow */}
            <View style={styles.wIconBadge}>
              <Text style={styles.wIconLetter}>W</Text>
              <View style={styles.wArrow}>
                <Ionicons name="arrow-up" size={11} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.womupText}>WOMUP</Text>
          </View>
          <Text style={styles.taglineText}>Empowerment • Shopping • Revolutions</Text>
        </View>

        {/* Right: Location & Notifications */}
        <View style={styles.rightActionsRow}>
          {/* Location Selector */}
          <TouchableOpacity
            style={styles.locationSelector}
            activeOpacity={0.7}
            onPress={onSelectLocation}
          >
            <Ionicons name="location-sharp" size={15} color="#E11D48" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
            <Ionicons name="chevron-down" size={13} color="#E11D48" />
          </TouchableOpacity>

          {/* Notifications with badge "3" */}
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={onOpenNotifications}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickCommerceSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  switchFlashBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  quickCommerceText: {
    fontSize: 11.5,
    color: '#78350F',
    fontWeight: '600',
    flex: 1,
  },
  switchActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B45309',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  switchActionText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 2,
  },
  backButtonText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wIconBadge: {
    position: 'relative',
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wIconLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  wArrow: {
    position: 'absolute',
    top: -5,
    right: -4,
    backgroundColor: '#9333EA',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  womupText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#1E1B4B',
  },
  taglineText: {
    fontSize: 8,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FECDD3',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
    maxWidth: 110,
  },
  bellButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 3,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
