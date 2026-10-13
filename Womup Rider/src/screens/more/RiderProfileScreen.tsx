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
  const { profile, updateProfile, setSubScreen, detectedHubName, isOnline } = useRider();

  const [name, setName] = useState(profile?.name || 'Darshan Parmar');
  const [phone, setPhone] = useState(profile?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(profile?.email || 'darshan@wormup.in');
  const [city, setCity] = useState(profile?.city || 'Ahmedabad (Satellite Hub)');
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
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen('None')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#071B52" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>My Profile</Text>
          <Text style={styles.screenSubtitle}>Delivering Smiles • Fast · Safe · Together</Text>
        </View>
      </View>

      {/* 1. Hero Profile Card (Wireframe Screen 14) */}
      <View style={styles.heroProfileCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color="#071B52" />
          </View>
          <TouchableOpacity style={styles.cameraIconBtn} activeOpacity={0.8}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.profileName}>{profile?.name || name}</Text>
        <Text style={styles.profileRiderId}>Rider ID: #WU0123</Text>

        <View style={styles.badgesRow}>
          <View style={styles.onlineStatusPill}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#13B978' : '#94A3B8' }]} />
            <Text style={[styles.onlineStatusText, { color: isOnline ? '#13B978' : '#64748B' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.ratingBadgePill}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingBadgeText}>{profile?.rating ?? 4.9}</Text>
          </View>
        </View>
      </View>

      {/* 2. Quick Navigation Sections (Wireframe Screen 14) */}
      <View style={styles.quickNavCard}>
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => setSubScreen('VehicleDetails')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={[styles.navIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bicycle" size={18} color="#D97706" />
            </View>
            <View>
              <Text style={styles.navTitle}>Vehicle Details</Text>
              <Text style={styles.navSubtitle}>Hero Electric • GJ-01-AB-1234</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.navDivider} />

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => setSubScreen('Documents')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={[styles.navIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text" size={18} color="#059669" />
            </View>
            <View>
              <Text style={styles.navTitle}>Documents</Text>
              <Text style={styles.navSubtitle}>Aadhaar, DL, PAN & RC Verified</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.verifiedSmallBadge}>
              <Text style={styles.verifiedSmallText}>VERIFIED</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </View>
        </TouchableOpacity>

        <View style={styles.navDivider} />

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => setSubScreen('BankSettlement')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={[styles.navIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="card" size={18} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.navTitle}>Bank Details</Text>
              <Text style={styles.navSubtitle}>Direct IMPS Payout Account</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {/* 3. Personal Information Form */}
      <View style={styles.formCard}>
        <Text style={styles.formSectionTitle}>Personal Information</Text>

        <Text style={styles.fieldLabel}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />

        <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="rider@wormup.in"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>OPERATIONAL CITY / HUB</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Ahmedabad (Satellite Hub)"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.fieldLabel}>CURRENT DISPATCH GPS HUB</Text>
        <View style={styles.hubStatusBox}>
          <Ionicons name="location-sharp" size={16} color="#FF3B98" style={{ marginRight: 6 }} />
          <Text style={styles.hubStatusText}>
            {detectedHubName ? detectedHubName.split('(')[0].trim() : 'Ahmedabad Central Dark Store'}
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
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  heroProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF3B98',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#071B52',
  },
  profileRiderId: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  onlineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  quickNavCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  navSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  navDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  verifiedSmallBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#13B978',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#071B52',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hubStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 152, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  hubStatusText: {
    fontSize: 13,
    color: '#071B52',
    fontWeight: '700',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#FF3B98',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 36,
  },
});
