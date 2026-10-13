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
  { id: '1', icon: 'cube-outline', iconColor: '#4F46E5', bgColor: '#EEF2FF', title: 'Order & Packaging Problem', desc: 'Missing item, leaky bag or damaged product' },
  { id: '2', icon: 'location-outline', iconColor: '#E11D48', bgColor: '#FFE4E6', title: 'Customer Address Issue', desc: 'GPS pin mismatch or society security denied entry' },
  { id: '3', icon: 'bicycle-outline', iconColor: '#D97706', bgColor: '#FEF3C7', title: 'Vehicle Breakdown', desc: 'Flat tyre, EV battery drained or puncture' },
  { id: '4', icon: 'cash-outline', iconColor: '#059669', bgColor: '#ECFDF5', title: 'Cash on Delivery (COD) Dispute', desc: 'Customer refused to pay or exact change problem' },
  { id: '5', icon: 'phone-portrait-outline', iconColor: '#2563EB', bgColor: '#EFF6FF', title: 'App or GPS Malfunction', desc: 'App lagging, location not syncing or OTP error' },
];

export const SupportScreen: React.FC = () => {
  const { setShowEmergencyModal, activeDelivery, setSubScreen } = useRider();
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

  const handleOpenWhatsApp = () => {
    const url = 'https://wa.me/917940008899?text=Hello%20WormUp%20Support,%20I%20am%20a%20Rider%20needing%20assistance.';
    Linking.openURL(url).catch(() => {
      Alert.alert('Support Chat', 'WhatsApp support helpline: +91 79 4000 8899');
    });
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
          <Text style={styles.screenTitle}>Help & Support</Text>
          <Text style={styles.screenSubtitle}>Delivering Smiles • Fast · Safe · Together</Text>
        </View>
      </View>

      {/* 1. Hero Support Card (Wireframe Screen 16) */}
      <View style={styles.heroSupportCard}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="headset" size={28} color="#FF3B98" />
        </View>
        <Text style={styles.heroTitle}>24x7 Fleet Assistance</Text>
        <Text style={styles.heroSubtitle}>
          Dedicated rider support helpline & dark store dispatch team
        </Text>
      </View>

      {/* 2. 3 Action Buttons (Wireframe Screen 16: Call / Chat / SOS) */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#13B978' }]}
          onPress={handleCallManager}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" />
          <Text style={styles.quickActionBtnText}>Call Hub</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
          <Text style={styles.quickActionBtnText}>Chat Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => setShowEmergencyModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="warning" size={18} color="#FFFFFF" />
          <Text style={styles.quickActionBtnText}>SOS Alert</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Issue Categories (Wireframe Screen 16) */}
      <Text style={styles.sectionHeading}>Select Issue Category</Text>
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
              <View style={[styles.catIconWrap, { backgroundColor: cat.bgColor }]}>
                <Ionicons name={cat.icon} size={20} color={cat.iconColor} />
              </View>
              <View style={styles.catInfo}>
                <Text style={[styles.catTitle, isSelected && styles.catTitleSelected]}>
                  {cat.title}
                </Text>
                <Text style={styles.catDesc}>{cat.desc}</Text>
              </View>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={20} color="#FF3B98" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Ticket Form (If Category Selected) */}
      {selectedIssue && (
        <View style={styles.ticketForm}>
          <Text style={styles.formLabel}>Describe Situation (Optional):</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add extra details (e.g. flat tyre on SG Highway, customer unreachable)..."
            placeholderTextColor="#94A3B8"
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
            <Text style={styles.submitBtnText}>
              {submitting ? 'DISPATCHING TICKET...' : 'SUBMIT PRIORITY TICKET'}
            </Text>
            {!submitting && <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />}
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
  heroSupportCard: {
    backgroundColor: '#071B52',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 59, 152, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 152, 0.3)',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 12,
  },
  categoriesList: {
    gap: 10,
    marginBottom: 16,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  catCardSelected: {
    borderColor: '#FF3B98',
    backgroundColor: '#FDF2F8',
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  catTitleSelected: {
    color: '#FF3B98',
  },
  catDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  ticketForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#071B52',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B98',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 36,
  },
});
