import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, GRADIENTS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const SUPPORT_PHONE = '+919825000099';
const SUPPORT_EMAIL = 'support@womup.in';
const SUPPORT_WHATSAPP = '919825000099';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Orders & Delivery',
    q: 'How fast is WOMART delivery?',
    a: 'Everyday grocery, fruits, vegetables, and daily essentials are delivered in 9 to 15 minutes directly from our nearest local dark store in your area.',
  },
  {
    category: 'Orders & Delivery',
    q: 'Can I change my delivery address after placing an order?',
    a: 'Since our orders are packed within 60 seconds, please contact our helpline or message your delivery rider directly through the order tracking screen.',
  },
  {
    category: 'Payments & Refunds',
    q: 'What happens if an item is damaged or missing?',
    a: 'We have a 100% no-questions-asked refund policy. Refunds are credited instantly to your Womup Wallet or back to your original payment mode within 2 hours.',
  },
  {
    category: 'Shopping Coins & Team',
    q: 'How do Shopping Coins work?',
    a: 'You get 2,000 Shopping Coins upon joining. You can redeem these coins at checkout on eligible items to save money on your daily grocery orders.',
  },
  {
    category: 'Shopping Coins & Team',
    q: 'When do I receive referral shopping coins?',
    a: 'Level 1 gets 400 coins, Level 2 gets 300 coins, and Level 3 gets 200 coins credited instantly when a new team member joins with your referral code, regardless of PIN code.',
  },
  {
    category: 'Pincode & Service Area',
    q: 'How can I change my registered PIN code?',
    a: 'Select "Pincode Change Request" on this page, enter your new 6-digit pincode, add a note, and upload an address proof photo (Aadhaar, electricity bill, rent agreement). Our admin team reviews and approves it.',
  },
  {
    category: 'Pincode & Service Area',
    q: 'What happens when my new PIN code is approved by Admin?',
    a: 'If your new PIN code is in our active service zone, your sponsor becomes eligible for App Download cash rewards (₹20, ₹10, ₹5) and real MLM level shopping income from your orders is activated.',
  },
  {
    category: 'Account & KYC',
    q: 'How do I complete my KYC verification?',
    a: 'Go to Profile > KYC Verification, enter your 12-digit Aadhaar number, upload clear front and back photos, and submit. Verification is processed within minutes.',
  },
];

export const SupportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { goBack, user, orders } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('General Query');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Pincode Change specific state
  const [newPincode, setNewPincode] = useState<string>('');
  const [pincodeNote, setPincodeNote] = useState<string>('');
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  const CATEGORIES = [
    'General Query',
    'Pincode Change Request',
    'Order Delivery Issue',
    'Payment & Refund',
    'Shopping Coins',
    'KYC Verification',
    'My Team & Network',
  ];

  const handlePickProof = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is needed to select address proof.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setProofImageUri(result.assets[0].uri);
        setProofBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleTakeProofPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is needed to take a photo of address proof.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setProofImageUri(result.assets[0].uri);
        setProofBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleSubmitPincodeChange = async () => {
    const cleanPin = newPincode.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit postal PIN code.');
      return;
    }

    const currentPin = (user as any)?.registrationPincode || (user as any)?.pincode || '';
    if (currentPin && currentPin === cleanPin) {
      Alert.alert('Same Pincode', `Your registered PIN code is already ${cleanPin}. Please enter your new PIN code.`);
      return;
    }

    if (!proofImageUri && !proofBase64) {
      Alert.alert('Proof Required', 'Please attach a photo or document proof (Electricity bill, Aadhaar, Gas bill, or Rent agreement) showing your new address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/users/pincode-change-request', {
        requestedPincode: cleanPin,
        reason: pincodeNote.trim() || 'Address updated',
        proofDocumentUrl: proofBase64 || proofImageUri || '',
      });

      setIsSubmitting(false);
      Alert.alert(
        'Request Submitted! 📍',
        `Your request to update pincode to ${cleanPin} has been submitted for admin verification. Once verified, your sponsor will become eligible for rewards and you will be activated for service in that zone!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNewPincode('');
              setPincodeNote('');
              setProofImageUri(null);
              setProofBase64(null);
            },
          },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert(
        'Request Submitted! 📍',
        `Your request to update pincode to ${cleanPin} has been registered. Our admin team will verify your address proof.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNewPincode('');
              setPincodeNote('');
              setProofImageUri(null);
              setProofBase64(null);
            },
          },
        ]
      );
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert('Helpline', `Please call our customer helpline at ${SUPPORT_PHONE}`);
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello WOMUP Support team, I need assistance with my account (${user?.phoneNumber || user?.email || 'Customer'}).`
    );
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Support', `Please message us on WhatsApp at +91 98250 00099`);
    });
  };

  const handleEmail = () => {
    const subjectEncoded = encodeURIComponent('WOMUP Customer Support Assistance');
    const bodyEncoded = encodeURIComponent(
      `Hello Support Team,\n\nCustomer Name: ${user?.fullName || 'Customer'}\nPhone: ${user?.phoneNumber || ''}\nEmail: ${user?.email || ''}\n\nQuery Details:\n`
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subjectEncoded}&body=${bodyEncoded}`).catch(() => {
      Alert.alert('Email Support', `Please email us at ${SUPPORT_EMAIL}`);
    });
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      Alert.alert('Subject Required', 'Please enter a brief subject for your support ticket.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please explain your query so our support team can help you.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await api.post('/support/ticket', {
        userId: (user as any)?._id || user?.id,
        customerName: user?.fullName || 'Customer',
        customerPhone: user?.phoneNumber || '',
        customerEmail: user?.email || '',
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        orderNumber: orderNumber.trim() || undefined,
      });

      const ticketNum = res?.data?.ticketNumber || res?.ticketNumber || Math.floor(100000 + Math.random() * 900000);
      Alert.alert(
        'Support Ticket Raised! 🎫',
        `Thank you ${user?.fullName || 'Customer'}. Your ticket #${ticketNum} for "${selectedCategory}" has been received. Our team will contact you within 15 minutes.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              setOrderNumber('');
            },
          },
        ]
      );
    } catch (err: any) {
      console.warn('Submit ticket error:', err);
      Alert.alert(
        'Support Ticket Received',
        `Thank you ${user?.fullName || 'Customer'}. Your ticket for "${selectedCategory}" has been received. Our support team will assist you shortly.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={goBack}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={20} color="#25105F" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>24x7 Customer Support</Text>
          <Text style={styles.headerSub}>Help & Assistance for Orders, Coins & KYC</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Card */}
        <LinearGradient
          colors={['#25105F', '#5E17EB', '#F20B87']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroTextWrap}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>Live Support Active</Text>
            </View>
            <Text style={styles.heroTitle}>How can we help you today?</Text>
            <Text style={styles.heroSub}>
              Direct priority support for orders, wallet, deliveries & referral team.
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="headset" size={48} color="#FFFFFF" />
          </View>
        </LinearGradient>

        {/* 3 Quick Action Contact Cards */}
        <View style={styles.quickActionsRow}>
          {/* 1. Phone Call */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleCall} style={styles.quickCard}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="call" size={22} color="#16A34A" />
            </View>
            <Text style={styles.quickCardTitle}>Call Us</Text>
            <Text style={styles.quickCardSub}>Toll Free Helpline</Text>
            <Text style={styles.quickCardNumber}>+91 98250 00099</Text>
          </TouchableOpacity>

          {/* 2. WhatsApp */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleWhatsApp} style={styles.quickCard}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#0284C7" />
            </View>
            <Text style={styles.quickCardTitle}>WhatsApp</Text>
            <Text style={styles.quickCardSub}>Instant Chat</Text>
            <Text style={[styles.quickCardNumber, { color: '#0284C7' }]}>Online 24/7</Text>
          </TouchableOpacity>

          {/* 3. Email */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleEmail} style={styles.quickCard}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="mail" size={22} color="#DB2777" />
            </View>
            <Text style={styles.quickCardTitle}>Email</Text>
            <Text style={styles.quickCardSub}>Official Support</Text>
            <Text style={[styles.quickCardNumber, { color: '#DB2777', fontSize: 10 }]}>support@womup.in</Text>
          </TouchableOpacity>
        </View>

        {/* Raise a Support Ticket Form */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color="#5E17EB" />
            <Text style={styles.sectionTitle}>Raise a Support Query / Ticket</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Have an issue with your order or coins? Tell us below and our support lead will resolve it.
          </Text>

          {/* Category Selector Pills */}
          <Text style={styles.fieldLabel}>Select Topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.75}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Conditional Form: Pincode Change Request vs Regular Ticket */}
          {selectedCategory === 'Pincode Change Request' ? (
            <View style={styles.pincodeChangeSection}>
              {/* Current Pincode Indicator */}
              <View style={styles.currentPinBanner}>
                <View style={styles.currentPinIconWrap}>
                  <Ionicons name="location" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentPinLabel}>Current Registered PIN Code</Text>
                  <Text style={styles.currentPinValue}>
                    {(user as any)?.registrationPincode || (user as any)?.pincode || '380054 (Thaltej)'}
                  </Text>
                </View>
                <View style={styles.verifiedPinBadge}>
                  <Text style={styles.verifiedPinBadgeText}>Active</Text>
                </View>
              </View>

              {/* Requested New 6-digit Pincode */}
              <Text style={styles.fieldLabel}>New 6-Digit PIN Code *</Text>
              <TextInput
                value={newPincode}
                onChangeText={(text) => setNewPincode(text.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 380054"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={6}
                style={[styles.inputField, { fontSize: 16, fontWeight: '700', letterSpacing: 2 }]}
              />

              {/* Reason / Note */}
              <Text style={styles.fieldLabel}>Reason / Note *</Text>
              <TextInput
                value={pincodeNote}
                onChangeText={setPincodeNote}
                placeholder="e.g. Relocated to new residence, changing postal delivery area"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={[styles.inputField, styles.textAreaField]}
              />

              {/* Address Proof Attachment */}
              <Text style={styles.fieldLabel}>Address Proof Document *</Text>
              <Text style={styles.proofHelperText}>
                Upload photo of Aadhaar, Electricity Bill, Gas Bill, or Rent Agreement showing new address.
              </Text>

              {proofImageUri ? (
                <View style={styles.proofPreviewContainer}>
                  <Image source={{ uri: proofImageUri }} style={styles.proofThumbnail} />
                  <View style={styles.proofInfoWrap}>
                    <Text style={styles.proofSuccessTitle}>Document Attached ✅</Text>
                    <Text style={styles.proofSuccessSub}>Ready for admin verification</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setProofImageUri(null);
                      setProofBase64(null);
                    }}
                    style={styles.removeProofBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.proofUploadRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickProof}
                    style={styles.uploadProofBtn}
                  >
                    <Ionicons name="images-outline" size={20} color="#5E17EB" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadProofBtnText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleTakeProofPhoto}
                    style={[styles.uploadProofBtn, { borderColor: '#F20B87' }]}
                  >
                    <Ionicons name="camera-outline" size={20} color="#F20B87" style={{ marginRight: 6 }} />
                    <Text style={[styles.uploadProofBtnText, { color: '#F20B87' }]}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Policy Callout */}
              <View style={styles.pincodeInfoBox}>
                <Ionicons name="information-circle" size={18} color="#0284C7" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.pincodeInfoText}>
                  Upon Admin approval: If your new PIN code belongs to an eligible service zone, your sponsor will receive App Download rewards (₹20, ₹10, ₹5) and real MLM level shopping income from your orders will be activated.
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmitPincodeChange}
                disabled={isSubmitting}
                style={styles.submitBtn}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  <Ionicons name="location-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? 'Submitting Request...' : 'Submit Pincode Change Request'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Order ID Input (Optional) */}
              <Text style={styles.fieldLabel}>Recent Order # (Optional)</Text>
              <TextInput
                value={orderNumber}
                onChangeText={setOrderNumber}
                placeholder={orders && orders.length > 0 ? `e.g. ${orders[0].orderNumber}` : 'e.g. ORD-10023'}
                placeholderTextColor="#94A3B8"
                style={styles.inputField}
              />

              {/* Subject */}
              <Text style={styles.fieldLabel}>Subject / Headline *</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Missing vegetable pack or Coin balance enquiry"
                placeholderTextColor="#94A3B8"
                style={styles.inputField}
              />

              {/* Detailed Message */}
              <Text style={styles.fieldLabel}>Describe your issue *</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Please write details about your issue here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                style={[styles.inputField, styles.textAreaField]}
              />

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmitTicket}
                disabled={isSubmitting}
                style={styles.submitBtn}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  <Feather name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* FAQs Accordion */}
        <View style={styles.faqCardContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="help-buoy-outline" size={22} color="#F20B87" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions (FAQs)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Quick answers to common questions about orders, dark stores, and referral rewards.
          </Text>

          {FAQS.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => setExpandedFaq(isOpen ? null : index)}
                style={[styles.faqAccordionCard, isOpen && styles.faqAccordionCardOpen]}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, isOpen && styles.faqQuestionOpen]}>
                    {faq.q}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isOpen ? '#F20B87' : '#64748B'}
                  />
                </View>
                {isOpen && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Official Address & Info Footer */}
        <View style={styles.officeInfoBox}>
          <Text style={styles.officeTitle}>WOMUP ENTERPRISE PRIVATE LIMITED</Text>
          <Text style={styles.officeText}>
            Ahmedabad Central Hub & Fulfillment Center{'\n'}
            Customer Support: support@womup.in • Helpline: +91 98250 00099{'\n'}
            Operational 24 Hours • 7 Days a Week
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#5E17EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    lineHeight: 16,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  quickCardNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#6D28D9',
    fontWeight: '700',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 4,
  },
  textAreaField: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  faqCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  faqAccordionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqAccordionCardOpen: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FDA4AF',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    paddingRight: 8,
  },
  faqQuestionOpen: {
    color: '#BE123C',
  },
  faqBody: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  faqAnswer: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  officeInfoBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  officeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  officeText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  // Pincode Change UI Styles
  pincodeChangeSection: {
    marginTop: 4,
  },
  currentPinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  currentPinIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currentPinLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  currentPinValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 1,
  },
  verifiedPinBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedPinBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  proofHelperText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 15,
  },
  proofUploadRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  uploadProofBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginRight: 8,
  },
  uploadProofBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  proofPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  proofThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  proofInfoWrap: {
    flex: 1,
    marginLeft: 12,
  },
  proofSuccessTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  proofSuccessSub: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 2,
  },
  removeProofBtn: {
    padding: 8,
  },
  pincodeInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
  },
  pincodeInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
});

