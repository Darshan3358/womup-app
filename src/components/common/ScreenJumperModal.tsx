import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { ScreenId } from '../../types';
import { useApp } from '../../context/AppContext';

interface ScreenItem {
  id: ScreenId;
  label: string;
  badge: string;
}

interface ScreenGroup {
  title: string;
  badgeColor: string;
  screens: ScreenItem[];
}

const SCREEN_GROUPS: ScreenGroup[] = [
  {
    title: '⚡ Blinkit Quick Commerce Screens',
    badgeColor: '#238823',
    screens: [
      { id: 'Blinkit_Home', label: 'Blinkit 01 — Home Screen (9-min Delivery)', badge: 'B1' },
      { id: 'Blinkit_Categories', label: 'Blinkit 02 — Full Categories Grid', badge: 'B2' },
      { id: 'Blinkit_OrderAgain', label: 'Blinkit 03 — Order Again & Bestsellers', badge: 'B3' },
      { id: 'Blinkit_Money', label: 'Blinkit 04 — Blinkit Money Wallet', badge: 'B4' },
      { id: 'Blinkit_ProductDetail', label: 'Blinkit 06 — Product Details (PDP)', badge: 'B6' },
      { id: 'Blinkit_Cart', label: 'Blinkit 07 — Cart & Savings Bill', badge: 'B7' },
      { id: 'Blinkit_Checkout', label: 'Blinkit 08 — Checkout & Addresses', badge: 'B8' },
      { id: 'Blinkit_Profile', label: 'Blinkit 09 — Profile & Settings', badge: 'B9' },
      { id: 'Blinkit_Wishlist', label: 'Blinkit 10 — My Wishlist (Saved Items)', badge: 'B10' },
    ],
  },
  {
    title: '1. Onboarding & Auth Flow',
    badgeColor: COLORS.hotPink,
    screens: [
      { id: 'C01_Splash', label: 'Screen 01 — Splash Screen (Smart Shopping)', badge: '1' },
      { id: 'C02_Onboarding1', label: 'Screen 02 — Onboarding 1 (Everyday Essentials)', badge: '2' },
      { id: 'C03_Onboarding2', label: 'Screen 03 — Onboarding 2 (Save on Every Purchase)', badge: '3' },
      { id: 'C04_Onboarding3', label: 'Screen 04 — Onboarding 3 (Coins & Rewards)', badge: '4' },
      { id: 'C05_Onboarding4', label: 'Screen 05 — Onboarding 4 (Fast Delivery Doorstep)', badge: '5' },
      { id: 'C06_MobileNumber', label: 'Screen 06 — Mobile Number', badge: '6' },
      { id: 'C07_OtpVerification', label: 'Screen 07 — OTP Verification', badge: '7' },
      { id: 'C08_CreateAccount', label: 'Screen 08 — Create Account', badge: '8' },
      { id: 'C09_ReferralCode', label: 'Screen 09 — Referral Code', badge: '9' },
      { id: 'C10_LocationPermission', label: 'Screen 10 — Location Access', badge: '10' },
    ],
  },
  {
    title: '2. Main App Flow',
    badgeColor: COLORS.purple,
    screens: [
      { id: 'C11_AddAddress', label: 'Screen 11 — Add Address', badge: '11' },
      { id: 'C12_Home', label: 'Screen 12 — Home Screen', badge: '12' },
      { id: 'C13_Category', label: 'Screen 13 — Category Screen', badge: '13' },
      { id: 'C14_SubCategory', label: 'Screen 14 — Sub Category', badge: '14' },
      { id: 'C15_ProductListing', label: 'Screen 15 — Product Listing', badge: '15' },
      { id: 'C16_ProductDetails', label: 'Screen 16 — Product Details', badge: '16' },
      { id: 'C17_Search', label: 'Screen 17 — Search Screen', badge: '17' },
      { id: 'C18_FilterSort', label: 'Screen 18 — Filter & Sort', badge: '18' },
    ],
  },
  {
    title: '3. Cart to Order Flow',
    badgeColor: COLORS.blue,
    screens: [
      { id: 'C19_Cart', label: 'Screen 19 — Cart Screen', badge: '19' },
      { id: 'C20_Checkout', label: 'Screen 20 — Checkout Screen', badge: '20' },
      { id: 'C21_ApplyShoppingCoin', label: 'Screen 21 — Apply Shopping Coin', badge: '21' },
      { id: 'C22_Payment', label: 'Screen 22 — Payment Screen', badge: '22' },
      { id: 'C23_OrderPlaced', label: 'Screen 23 — Order Placed', badge: '23' },
      { id: 'C24_OrderTracking', label: 'Screen 24 — Order Tracking', badge: '24' },
      { id: 'C25_OrderHistory', label: 'Screen 25 — Order History', badge: '25' },
      { id: 'C26_Account', label: 'Screen 26 — Account / Wallet', badge: '26' },
    ],
  },
];

export const ScreenJumperModal: React.FC = () => {
  const { activeScreen, setActiveScreen, isJumperVisible, setJumperVisible } = useApp();

  const handleSelectScreen = (screenId: ScreenId) => {
    setActiveScreen(screenId);
    setJumperVisible(false);
  };

  if (!isJumperVisible) return null;

  return (
    <>
      {/* Full Modal */}
      <Modal
        visible={isJumperVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setJumperVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Womup Screen Jumper</Text>
              <Text style={styles.modalSubtitle}>Select any of the 26 wireframe screens</Text>
            </View>
            <TouchableOpacity
              onPress={() => setJumperVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {SCREEN_GROUPS.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.groupContainer}>
                <View style={styles.groupHeaderRow}>
                  <View
                    style={[styles.groupIndicator, { backgroundColor: group.badgeColor }]}
                  />
                  <Text style={styles.groupTitle}>{group.title}</Text>
                </View>

                {group.screens.map((screen) => {
                  const isCurrent = activeScreen === screen.id;
                  return (
                    <TouchableOpacity
                      key={screen.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectScreen(screen.id)}
                      style={[
                        styles.screenRow,
                        isCurrent && styles.activeScreenRow,
                      ]}
                    >
                      <View
                        style={[
                          styles.screenBadge,
                          {
                            backgroundColor: isCurrent
                              ? group.badgeColor
                              : COLORS.lightPink,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.screenBadgeText,
                            {
                              color: isCurrent ? COLORS.white : group.badgeColor,
                            },
                          ]}
                        >
                          {screen.badge}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.screenLabel,
                          isCurrent && styles.activeScreenLabel,
                        ]}
                      >
                        {screen.label}
                      </Text>

                      {isCurrent ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={COLORS.success}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={COLORS.border}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingTrigger: {
    position: 'absolute',
    top: 50,
    right: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  floatingTriggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.hotPink,
  },
  floatingTriggerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  groupContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  groupIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBackground,
  },
  activeScreenRow: {
    backgroundColor: '#F8F5FF',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
  },
  screenBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  screenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  screenLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  activeScreenLabel: {
    color: COLORS.purple,
    fontWeight: '700',
  },
});
