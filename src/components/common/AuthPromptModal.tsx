import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export const AuthPromptModal: React.FC = () => {
  const {
    isAuthPromptVisible,
    closeAuthPrompt,
    authPromptMessage,
    authPromptActionName,
    setActiveScreen,
  } = useApp();

  if (!isAuthPromptVisible) return null;

  const handleLoginPress = () => {
    closeAuthPrompt();
    setActiveScreen('C06_MobileNumber');
  };

  return (
    <Modal
      visible={isAuthPromptVisible}
      transparent
      animationType="fade"
      onRequestClose={closeAuthPrompt}
    >
      <TouchableWithoutFeedback onPress={closeAuthPrompt}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Close Button Top Right */}
              <TouchableOpacity
                onPress={closeAuthPrompt}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              {/* Icon / Brand Avatar */}
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {authPromptActionName === 'Local Store App' ? (
                    <Ionicons name="storefront" size={28} color="#FFFFFF" />
                  ) : (
                    <Feather name="shopping-bag" size={28} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </View>

              {/* Title & Description */}
              <Text style={styles.title}>
                {authPromptActionName || 'Login or Register'}
              </Text>
              <Text style={styles.message}>
                {authPromptMessage ||
                  'Please sign in or create an account to add items to your cart, unlock discounts, and order.'}
              </Text>

              {/* Feature Perks */}
              <View style={styles.perksList}>
                <View style={styles.perkItem}>
                  <Ionicons name="flash" size={16} color={COLORS.hotPink} style={styles.perkIcon} />
                  <Text style={styles.perkText}>Lightning fast 9-minute instant delivery</Text>
                </View>
                <View style={styles.perkItem}>
                  <Ionicons name="gift" size={16} color={COLORS.hotPink} style={styles.perkIcon} />
                  <Text style={styles.perkText}>Earn Shopping Coins & referral cashback</Text>
                </View>
                <View style={styles.perkItem}>
                  <Ionicons name="location" size={16} color={COLORS.hotPink} style={styles.perkIcon} />
                  <Text style={styles.perkText}>Live order tracking to your doorstep</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLoginPress}
                style={styles.loginBtnWrapper}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginBtnText}>Continue to Register / Login</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeAuthPrompt}
                style={styles.continueBrowsingBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.continueBrowsingText}>Continue Browsing</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 14,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  perksList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  perkIcon: {
    marginRight: 10,
  },
  perkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loginBtnWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  loginGradient: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  continueBrowsingBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  continueBrowsingText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
