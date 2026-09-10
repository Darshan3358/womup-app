import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from './AppIcon';
import { useApp } from '../../context/AppContext';

export const DistrictModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDistrictModalVisible, setDistrictModalVisible } = useApp();

  const districtSections = [
    { title: 'Dining Out', emoji: '🍽️', desc: 'Book tables & unlock flat 25% OFF at top restaurants' },
    { title: 'Events & Concerts', emoji: '🎟️', desc: 'Live music, standup comedy & festival passes' },
    { title: 'Nightlife & Lounges', emoji: '🍸', desc: 'Exclusive guestlist access and rooftop drinks' },
    { title: 'Movies & Plays', emoji: '🍿', desc: 'Pre-book premier seats with snack combos' },
  ];

  return (
    <Modal
      visible={isDistrictModalVisible}
      animationType="slide"
      onRequestClose={() => setDistrictModalVisible(false)}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* District Mini-App Header */}
        <LinearGradient
          colors={GRADIENTS.logo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.topRow}>
            <Text style={styles.districtWordmark}>district</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDistrictModalVisible(false)}
              style={styles.closeCircle}
              accessibilityLabel="Close District"
            >
              <AppIcon name="x" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.districtTagline}>
            Going out experiences curated by Blinkit
          </Text>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {districtSections.map((sec) => (
            <TouchableOpacity
              key={sec.title}
              activeOpacity={0.85}
              style={styles.sectionCard}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.sectionEmoji}>{sec.emoji}</Text>
                <View style={styles.textCol}>
                  <Text style={[TYPOGRAPHY.headingMd, styles.cardTitle]}>{sec.title}</Text>
                  <Text style={[TYPOGRAPHY.bodySm, styles.cardDesc]}>{sec.desc}</Text>
                </View>
              </View>
              <AppIcon name="chevron-right" size={20} color={COLORS.secondaryText} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  districtWordmark: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  districtTagline: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  sectionEmoji: {
    fontSize: 36,
  },
  textCol: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
