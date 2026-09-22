import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const RiderProfileScreen: React.FC = () => {
  const { profile, updateProfile, setSubScreen, detectedHubName } = useRider();

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [city, setCity] = useState(profile?.city || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, phone, email, city });
      Alert.alert('Success', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Rider Partner Profile</Text>
      <Text style={styles.screenSubtitle}>
        Manage your contact details and operational hub assignment.
      </Text>

      {/* Hero Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.avatarPill}>
          <Ionicons name="person" size={26} color={COLORS.navy} />
        </View>
        <View style={styles.statsInfo}>
          <Text style={styles.statsName}>{profile?.name}</Text>
          <Text style={styles.statsId}>Partner ID: #{profile?.id}</Text>
          <View style={styles.pillRow}>
            <View style={[styles.badgeSuccess, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.badgeSuccessText}>{profile?.status || 'APPROVED'}</Text>
            </View>
            <View style={[styles.badgeRating, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
              <Ionicons name="star" size={11} color="#D97706" />
              <Text style={styles.badgeRatingText}>{profile?.rating ?? 5.0}</Text>
            </View>
            <View style={[styles.badgeDrops, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
              <Ionicons name="cube-outline" size={11} color="#2563EB" />
              <Text style={styles.badgeDropsText}>{profile?.completedDeliveries ?? 0} drops</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Form */}
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.fieldLabel}>REGISTERED MOBILE NUMBER</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="rider@wormup.in"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>ASSIGNED OPERATIONAL HUB / CITY</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Ahmedabad (Satellite Hub)"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.fieldLabel}>CURRENT OPERATING HUB (GPS / DISPATCH)</Text>
        <View style={[styles.hubStatusBox, !detectedHubName && styles.hubStatusBoxWarning]}>
          <Ionicons
            name={detectedHubName ? "location-sharp" : "alert-circle-outline"}
            size={16}
            color={detectedHubName ? COLORS.primary : "#D97706"}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.hubStatusText, !detectedHubName && styles.hubStatusTextWarning]}>
            {detectedHubName ? detectedHubName.split('(')[0].trim() : 'No Hub Selected (Please detect GPS or select hub)'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE PROFILE CHANGES'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  avatarPill: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E2260',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  statsInfo: {
    flex: 1,
  },
  statsName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  statsId: {
    color: COLORS.secondaryText,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeSuccessText: {
    color: COLORS.onlineGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  badgeRating: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRatingText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeDrops: {
    backgroundColor: 'rgba(245, 98, 175, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDropsText: {
    color: COLORS.hotPink,
    fontSize: 10,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hubStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  hubStatusBoxWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  hubStatusText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
    flex: 1,
  },
  hubStatusTextWarning: {
    color: '#92400E',
  },
  saveBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 30,
  },
});
