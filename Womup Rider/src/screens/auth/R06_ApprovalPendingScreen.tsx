import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';

export const R06_ApprovalPendingScreen: React.FC = () => {
  const { profile, checkSession, logout } = useRider();
  const [checking, setChecking] = useState<boolean>(false);

  const handleRefreshStatus = async () => {
    setChecking(true);
    try {
      const { isApproved } = await RiderApiService.checkApprovalStatus();
      if (isApproved) {
        Alert.alert('Congratulations!', 'Your partner account has been approved by Womup Admin.');
        await checkSession();
      } else {
        Alert.alert('Under Review', 'Your documents are still being reviewed by the operations team.');
      }
    } catch {
      Alert.alert('Network Issue', 'Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <LinearGradient colors={GRADIENTS.navyHeader} style={styles.topHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>STATUS: UNDER REVIEW</Text>
        </View>
        <Text style={styles.heading}>Application Submitted</Text>
        <Text style={styles.subHeading}>
          Our compliance team is verifying your documents and vehicle details.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.clockIconBox}>
          <Ionicons name="hourglass-outline" size={32} color="#D97706" />
        </View>

        <Text style={styles.cardTitle}>Review in Progress</Text>
        <Text style={styles.cardDesc}>
          Approvals typically take 2-4 business hours. You will receive an SMS and notification once your account is ready for deliveries.
        </Text>

        {/* Verification Checklist */}
        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <View style={{ width: 28, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkTitle}>Profile Registration</Text>
              <Text style={styles.checkSub}>Name, phone, and vehicle type registered</Text>
            </View>
          </View>

          <View style={styles.checkItem}>
            <View style={{ width: 28, alignItems: 'center' }}>
              <Ionicons name="search" size={20} color="#D97706" />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkTitle}>KYC & Legal Verification</Text>
              <Text style={styles.checkSub}>Driving license & identity verification underway</Text>
            </View>
          </View>

          <View style={styles.checkItem}>
            <View style={{ width: 28, alignItems: 'center' }}>
              <Ionicons name="time-outline" size={20} color="#94A3B8" />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkTitle}>Super Admin Activation</Text>
              <Text style={styles.checkSub}>Fleet allocation & geofence activation</Text>
            </View>
          </View>
        </View>

        {/* Refresh Status CTA */}
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefreshStatus}
          disabled={checking}
          activeOpacity={0.85}
        >
          {checking ? (
            <ActivityIndicator color={COLORS.hotPink} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="refresh" size={15} color={COLORS.hotPink} />
              <Text style={styles.refreshBtnText}>CHECK STATUS NOW</Text>
            </View>
          )}
        </TouchableOpacity>



        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out / Change Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 40,
  },
  topHeader: {
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 10,
  },
  statusBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  subHeading: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  clockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  clockIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  checklist: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    fontSize: 18,
  },
  checkContent: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  refreshBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.hotPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: COLORS.hotPink,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  devBox: {
    width: '100%',
    marginTop: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  devApproveBtn: {
    backgroundColor: COLORS.onlineGreenDark,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  devApproveBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  devNote: {
    fontSize: 10,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 6,
  },
  logoutBtn: {
    marginTop: 20,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
