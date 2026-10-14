import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  RefreshCw,
  LogOut,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const VendorStatusScreen: React.FC<{ onResubmit?: () => void }> = ({ onResubmit }) => {
  const { vendor, logout, refreshData } = useVendor();

  const isBlocked = vendor?.isBlocked === 1;
  const isSuspended = vendor?.isSuspended === 1;
  const isRejected = vendor?.vendorStatus === 3;
  const isPending = vendor?.vendorStatus === 1 || (!vendor?.isVerified && !isRejected && !isBlocked);

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Icon & Header */}
        <View style={styles.statusCard}>
          {isBlocked ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <AlertOctagon size={44} color="#EF4444" />
            </View>
          ) : isSuspended ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <ShieldAlert size={44} color="#F59E0B" />
            </View>
          ) : isRejected ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <XCircle size={44} color="#EF4444" />
            </View>
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Clock size={44} color="#3B82F6" />
            </View>
          )}

          <Text style={styles.storeTitle}>
            {vendor?.vendorFirmName || vendor?.storeName || 'Vendor Partner'}
          </Text>
          <Text style={styles.vendorCode}>ID: {vendor?.vendorCode || 'VND...'}</Text>

          {/* Status Message */}
          {isBlocked ? (
            <View style={styles.badgeBox}>
              <Text style={[styles.badgeTitle, { color: '#EF4444' }]}>ACCOUNT BLOCKED</Text>
              <Text style={styles.badgeDesc}>
                {vendor?.blockReason || 'Your vendor account has been blocked by WormUp Administration for policy violation.'}
              </Text>
            </View>
          ) : isSuspended ? (
            <View style={styles.badgeBox}>
              <Text style={[styles.badgeTitle, { color: '#F59E0B' }]}>ACCOUNT SUSPENDED</Text>
              <Text style={styles.badgeDesc}>
                {vendor?.blockReason || 'Your merchant terminal is temporarily suspended. You cannot accept customer payments.'}
              </Text>
            </View>
          ) : isRejected ? (
            <View style={styles.badgeBox}>
              <Text style={[styles.badgeTitle, { color: '#EF4444' }]}>APPLICATION REJECTED</Text>
              <Text style={styles.badgeDesc}>
                Reason: {vendor?.vendorRejectReason || 'Submitted documentation was incomplete or could not be verified.'}
              </Text>
            </View>
          ) : (
            <View style={styles.badgeBox}>
              <Text style={[styles.badgeTitle, { color: '#3B82F6' }]}>APPLICATION UNDER REVIEW</Text>
              <Text style={styles.badgeDesc}>
                Your KYC documents and shop details are currently being verified by WormUp Admin. Approval usually takes 24-48 business hours.
              </Text>
            </View>
          )}

          {/* Document Checklist */}
          {isPending && (
            <View style={styles.checklist}>
              <Text style={styles.checklistTitle}>VERIFICATION CHECKLIST</Text>
              <View style={styles.checkItem}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={styles.checkText}>Basic Info & Firm Registration</Text>
              </View>
              <View style={styles.checkItem}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={styles.checkText}>Location & GPS Coordinates</Text>
              </View>
              <View style={styles.checkItem}>
                <Clock size={16} color="#F59E0B" />
                <Text style={[styles.checkText, { color: '#F59E0B' }]}>Aadhaar & PAN Document Verification (In Progress)</Text>
              </View>
              <View style={styles.checkItem}>
                <Clock size={16} color="#94A3B8" />
                <Text style={[styles.checkText, { color: '#94A3B8' }]}>Counter QR Code Standee Activation (Pending Approval)</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {isRejected && onResubmit && (
              <TouchableOpacity style={styles.primaryBtn} onPress={onResubmit}>
                <RefreshCw size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Resubmit Documents</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => refreshData()}>
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.secondaryBtnText}>Check Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => logout()}>
              <LogOut size={18} color="#94A3B8" />
              <Text style={styles.outlineBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, justifyContent: 'center', minHeight: '100%' },
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  vendorCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
    letterSpacing: 1,
  },
  badgeBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    width: '100%',
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  badgeDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
  },
  checklist: {
    marginTop: 24,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14,
    padding: 16,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    flex: 1,
  },
  btnRow: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.rose,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  outlineBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
});
