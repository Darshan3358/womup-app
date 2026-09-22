import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';

interface HelpCategory {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  title: string;
  desc: string;
}

const HELP_CATEGORIES: HelpCategory[] = [
  { id: '1', icon: 'cube-outline', iconColor: '#4F46E5', bgColor: '#EEF2FF', title: 'Order & Packaging Problem', desc: 'Missing item, leaky milk bag or damaged box' },
  { id: '2', icon: 'location-outline', iconColor: '#E11D48', bgColor: '#FFE4E6', title: 'Wrong Customer Address', desc: 'GPS pin mismatch or society gate security denied entry' },
  { id: '3', icon: 'bicycle-outline', iconColor: '#D97706', bgColor: '#FEF3C7', title: 'Vehicle Breakdown', desc: 'Flat tyre, EV battery drained or accident' },
  { id: '4', icon: 'cash-outline', iconColor: '#059669', bgColor: '#ECFDF5', title: 'Cash on Delivery (COD) Dispute', desc: 'Customer refused to pay or exact change unavailable' },
  { id: '5', icon: 'phone-portrait-outline', iconColor: '#2563EB', bgColor: '#EFF6FF', title: 'App or GPS Malfunction', desc: 'App lagging, location not syncing or OTP error' },
];

export const SupportScreen: React.FC = () => {
  const { setShowEmergencyModal, activeDelivery } = useRider();
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [issueNote, setIssueNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmitTicket = async () => {
    if (!selectedIssue) {
      Alert.alert('Select an issue category', 'Please choose the problem you are experiencing.');
      return;
    }
    const cat = HELP_CATEGORIES.find((c) => c.id === selectedIssue);
    setSubmitting(true);
    try {
      const res = await RiderApiService.submitSupportTicket({
        category: cat?.title || 'Operational Issue',
        description: issueNote || 'Assistance requested by rider on duty',
        orderId: activeDelivery?.id,
      });
      Alert.alert(
        `Support Ticket Dispatched (${res.id})`,
        'The Satellite Hub manager and safety team have received your request. You will receive a priority callback within 60 seconds.'
      );
      setSelectedIssue(null);
      setIssueNote('');
    } catch {
      Alert.alert('Error', 'Failed to submit support ticket. Please call the hub directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallManager = async () => {
    const url = 'tel:+917940008899';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Call Satellite Hub', 'Dialing +91 79 4000 8899...');
      }
    } catch {
      Alert.alert('Call Satellite Hub', 'Dialing +91 79 4000 8899...');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* SOS Emergency Banner */}
      <TouchableOpacity
        style={styles.sosBanner}
        onPress={() => setShowEmergencyModal(true)}
        activeOpacity={0.85}
      >
        <View style={styles.sosLeft}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Ionicons name="warning" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.sosTitle}>EMERGENCY / ACCIDENT HELPLINE</Text>
            <Text style={styles.sosSub}>Tap here for Police, Ambulance or Immediate SOS</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>

      {/* Direct Hub Manager Call */}
      <View style={styles.hubCallCard}>
        <View style={styles.hubCallInfo}>
          <Text style={styles.hubCallTitle}>Satellite Hub Operations Dispatch</Text>
          <Text style={styles.hubCallSub}>Available 24x7 for active delivery issues</Text>
        </View>
        <TouchableOpacity
          style={[styles.callBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
          onPress={handleCallManager}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={14} color="#FFF" />
          <Text style={styles.callBtnText}>Call Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Issue Categories */}
      <Text style={styles.sectionTitle}>Report an Issue</Text>
      <View style={styles.categoriesList}>
        {HELP_CATEGORIES.map((cat) => {
          const isSelected = selectedIssue === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, isSelected && styles.catCardSelected]}
              onPress={() => setSelectedIssue(cat.id)}
              activeOpacity={0.7}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: cat.bgColor, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={cat.icon} size={20} color={cat.iconColor} />
              </View>
              <View style={styles.catInfo}>
                <Text style={[styles.catTitle, isSelected && styles.catTitleSelected]}>
                  {cat.title}
                </Text>
                <Text style={styles.catDesc}>{cat.desc}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.hotPink} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedIssue && (
        <View style={styles.ticketForm}>
          <Text style={styles.formLabel}>Describe the situation (Optional):</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any extra detail (e.g. customer phone unreachable, tyre punctured at SG Highway)..."
            placeholderTextColor={COLORS.secondaryText}
            multiline
            numberOfLines={3}
            value={issueNote}
            onChangeText={setIssueNote}
          />
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.disabledBtn]}
            onPress={handleSubmitTicket}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Text style={styles.submitBtnText}>
                {submitting ? 'DISPATCHING TICKET...' : 'SUBMIT PRIORITY TICKET'}
              </Text>
              {!submitting && <Ionicons name="arrow-forward" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>
        </View>
      )}

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
  sosBanner: {
    backgroundColor: COLORS.error,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    elevation: 3,
  },
  sosLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sosEmoji: {
    fontSize: 26,
  },
  sosTitle: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sosSub: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
  sosArrow: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  hubCallCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  hubCallInfo: {
    flex: 1,
    marginRight: 12,
  },
  hubCallTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  hubCallSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 12,
  },
  categoriesList: {
    gap: 10,
    marginBottom: 16,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  catCardSelected: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFF5FA',
  },
  catEmoji: {
    fontSize: 22,
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catTitleSelected: {
    color: COLORS.hotPink,
  },
  catDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkmark: {
    color: COLORS.hotPink,
    fontWeight: '900',
    fontSize: 16,
  },
  ticketForm: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  textArea: {
    height: 70,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
    marginBottom: 14,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 30,
  },
});
