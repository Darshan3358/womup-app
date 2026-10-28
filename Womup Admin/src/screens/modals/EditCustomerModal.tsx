import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Shield,
  FileText,
  ChevronDown,
  Lock,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  Users,
} from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { CustomerService } from '../../services/customerService';
import { Customer } from '../../types/admin';

export const EditCustomerModal: React.FC = () => {
  const { activeModal, setActiveModal, selectedCustomer, updateCustomer, zones } = useAdminState();

  // Loading state
  const [saving, setSaving] = useState(false);

  // Section 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [gender, setGender] = useState('Female');
  const [birthdate, setBirthdate] = useState('');

  // Section 2: Contact Info
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Section 3: Address
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [village, setVillage] = useState('');
  const [zoneName, setZoneName] = useState('Bopal');
  const [pincode, setPincode] = useState('');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [areaList, setAreaList] = useState<Array<{ id: string; name: string }>>([]);

  // Section 4: Sponsor & Referral (Read-only)
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [userCode, setUserCode] = useState('');

  // Section 5: Bank Details
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Section 6: Status Controls
  const [kycStatus, setKycStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');
  const [paymentStatus, setPaymentStatus] = useState<1 | 2>(1); // 1 = Enabled, 2 = Disabled
  const [contactStatus, setContactStatus] = useState<'Active' | 'Blocked'>('Active');
  const [isSuspended, setIsSuspended] = useState<0 | 1>(0); // 0 = No, 1 = Yes
  const [showKycDropdown, setShowKycDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  // Section 7: Admin Notes
  const [adminNotes, setAdminNotes] = useState('');

  // Populate state on open
  useEffect(() => {
    if (selectedCustomer) {
      const nameParts = (selectedCustomer.name || '').split(' ');
      setFirstName(selectedCustomer.firstName || nameParts[0] || '');
      setSurname(selectedCustomer.surname || nameParts.slice(1).join(' ') || '');
      setFatherHusbandName(selectedCustomer.fatherHusbandName || '');
      setGender(selectedCustomer.gender || 'Female');
      setBirthdate(selectedCustomer.birthdate || selectedCustomer.birthDate || '15/08/1995');

      setMobile(selectedCustomer.phone || '');
      setEmail(selectedCustomer.email || '');

      setAddress(selectedCustomer.address || '');
      setLandmark(selectedCustomer.landmark || '');
      setVillage(selectedCustomer.village || '');
      setZoneName(selectedCustomer.zoneName || 'Bopal');
      setPincode(selectedCustomer.pincode || '380015');

      setSponsorId(selectedCustomer.sponsorId || selectedCustomer.sponsorCode || 'WOM5871');
      setSponsorName(selectedCustomer.sponsorName || 'Darshan T.');
      setReferralCode(selectedCustomer.sponsorCode || 'WOM5871');
      setUserCode(selectedCustomer.referralCode || selectedCustomer.userCode || 'WOM1213');

      setBankName(selectedCustomer.bankName || '');
      setBranchName(selectedCustomer.branchName || '');
      setAccountHolderName(selectedCustomer.accountHolderName || selectedCustomer.name || '');
      setAccountNumber(selectedCustomer.accountNumber || '');
      setIfscCode(selectedCustomer.ifscCode || '');
      setUpiId(selectedCustomer.upiId || '');

      setKycStatus(selectedCustomer.kycStatus || 'Pending');
      setPaymentStatus(selectedCustomer.paymentStatus !== undefined ? (selectedCustomer.paymentStatus as 1 | 2) : 1);
      setContactStatus(selectedCustomer.status || 'Active');
      setIsSuspended(selectedCustomer.isSuspended ? 1 : 0);
      setAdminNotes(selectedCustomer.adminNotes || '');
    }
  }, [selectedCustomer]);

  // Load area zones list
  useEffect(() => {
    CustomerService.getAreas().then((areas) => {
      if (areas && areas.length > 0) {
        setAreaList(areas);
      } else if (zones && zones.length > 0) {
        setAreaList(zones.map((z) => ({ id: z.id, name: z.name })));
      }
    });
  }, [zones]);

  if (!selectedCustomer) return null;

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First Name is required.');
      return;
    }
    if (!surname.trim()) {
      Alert.alert('Validation Error', 'Surname is required.');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Validation Error', 'Mobile Number is required.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Full Address is required.');
      return;
    }
    if (!pincode.trim()) {
      Alert.alert('Validation Error', 'Pincode is required.');
      return;
    }

    try {
      setSaving(true);
      const fullName = `${firstName.trim()} ${surname.trim()}`;
      const payload: Partial<Customer> & Record<string, any> = {
        name: fullName,
        firstName: firstName.trim(),
        surname: surname.trim(),
        fatherHusbandName: fatherHusbandName.trim(),
        gender,
        birthdate: birthdate.trim(),
        birthDate: birthdate.trim(),
        phone: mobile.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        landmark: landmark.trim(),
        village: village.trim(),
        zoneName,
        areaZone: zoneName,
        pincode: pincode.trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim(),
        kycStatus,
        paymentStatus,
        status: contactStatus,
        isBlocked: contactStatus === 'Blocked' ? 1 : 0,
        isSuspended,
        adminNotes: adminNotes.trim(),
      };

      // 1. Update in backend via CustomerService
      await CustomerService.updateCustomer(selectedCustomer.id, payload);

      // 2. Update in AdminStateContext so all screens reflect instantly
      updateCustomer(selectedCustomer.id, payload);

      setActiveModal('none');
      Alert.alert('Success', 'Customer profile updated successfully.');
    } catch (err: any) {
      console.error('[EditCustomerModal] save error:', err);
      Alert.alert('Error', err.message || 'Failed to save customer changes.');
    } finally {
      setSaving(false);
    }
  };

  const allAreas = areaList.length > 0 ? areaList : (zones.length > 0 ? zones : [
    { id: '1', name: 'Bopal' },
    { id: '2', name: 'Satellite' },
    { id: '3', name: 'Prahlad Nagar' },
    { id: '4', name: 'Vastrapur' },
    { id: '5', name: 'Bodakdev' },
    { id: '6', name: 'Ahmedabad' },
  ]);

  return (
    <ModalContainer
      visible={activeModal === 'EditCustomer'}
      title="Edit Customer Profile"
      onClose={() => setActiveModal('none')}
    >
      <View style={styles.modalInnerWrapper}>
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ════════════ SECTION 1: Personal Info ════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <User size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Personal Info</Text>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Ayushi"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={surname}
                  onChangeText={setSurname}
                  placeholder="e.g. Thanki"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.fullWidthCol}>
              <Text style={styles.label}>Father / Husband Name</Text>
              <TextInput
                style={styles.input}
                value={fatherHusbandName}
                onChangeText={setFatherHusbandName}
                placeholder="e.g. Mukesh Thanki"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.controlGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.toggleRowFull}>
                {['Female', 'Male', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.toggleBtnFull, gender === g && styles.toggleBtnActiveNeutral]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.toggleBtnText, gender === g && styles.toggleBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fullWidthCol}>
              <Text style={styles.label}>Birthdate *</Text>
              <TextInput
                style={styles.input}
                value={birthdate}
                onChangeText={setBirthdate}
                placeholder="DD/MM/YYYY e.g. 15/08/1995"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* ════════════ SECTION 2: Contact Info ════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Phone size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Contact Info</Text>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  placeholder="+91 98765 43210"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="ayushi@example.com"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* ════════════ SECTION 3: Address ════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MapPin size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Address</Text>
            </View>

            <View style={styles.fullWidthCol}>
              <Text style={styles.label}>Full Address *</Text>
              <TextInput
                style={[styles.input, styles.textareaCompact]}
                value={address}
                onChangeText={setAddress}
                placeholder="Flat / Building, Street Name, Area..."
                placeholderTextColor={COLORS.textMuted}
                multiline
              />
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Landmark</Text>
                <TextInput
                  style={styles.input}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Near University / Behind Temple"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Village / Locality</Text>
                <TextInput
                  style={styles.input}
                  value={village}
                  onChangeText={setVillage}
                  placeholder="e.g. Vejalpur"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={[styles.row2Col, showZoneDropdown && { zIndex: 100 }]}>
              <View style={[styles.col, showZoneDropdown && { zIndex: 100 }]}>
                <Text style={styles.label}>Area Zone *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowZoneDropdown(!showZoneDropdown)}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>{zoneName || 'Select Area Zone'}</Text>
                  <ChevronDown size={14} color={COLORS.textMuted} />
                </TouchableOpacity>

                {showZoneDropdown && (
                  <View style={[styles.dropdownMenu, { zIndex: 9999, elevation: 20 }]}>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                      {allAreas.map((z) => (
                        <TouchableOpacity
                          key={z.id}
                          style={[styles.dropdownItem, zoneName === z.name && styles.dropdownItemActive]}
                          onPress={() => {
                            setZoneName(z.name);
                            setShowZoneDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, zoneName === z.name && styles.dropdownItemTextActive]}>
                            {z.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Pincode *</Text>
                <TextInput
                  style={styles.input}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                  placeholder="e.g. 380015"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* ════════════ SECTION 4: Sponsor & Referral (Read-only) ════════════ */}
          <View style={[styles.sectionCard, styles.readOnlySectionCard]}>
            <View style={styles.sectionHeader}>
              <Users size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Sponsor & Referral (Read-only)</Text>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Sponsor ID</Text>
                <View style={styles.readOnlyInput}>
                  <Lock size={12} color={COLORS.textMuted} style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text style={styles.readOnlyText} numberOfLines={1} ellipsizeMode="middle">{sponsorId || 'WOM5871'}</Text>
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Sponsor Name</Text>
                <View style={styles.readOnlyInput}>
                  <Lock size={12} color={COLORS.textMuted} style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text style={styles.readOnlyText} numberOfLines={1}>{sponsorName || 'Darshan T.'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Referral Code (Used to Join)</Text>
                <View style={styles.readOnlyInput}>
                  <Lock size={12} color={COLORS.textMuted} style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text style={styles.readOnlyText} numberOfLines={1}>{referralCode || 'WOM5871'}</Text>
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>User's Own Referral Code</Text>
                <View style={styles.readOnlyInput}>
                  <Lock size={12} color={COLORS.textMuted} style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text style={[styles.readOnlyText, { color: COLORS.purple, fontWeight: '700' }]} numberOfLines={1}>
                    {userCode || 'WOM1213'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ════════════ SECTION 5: Bank Details ════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <CreditCard size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Bank Details</Text>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Bank Name</Text>
                <TextInput
                  style={styles.input}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Branch</Text>
                <TextInput
                  style={styles.input}
                  value={branchName}
                  onChangeText={setBranchName}
                  placeholder="e.g. SG Highway"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Account Holder</Text>
                <TextInput
                  style={styles.input}
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholder="Account holder name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                  placeholder="e.g. 123456789012"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>IFSC Code</Text>
                <TextInput
                  style={[styles.input, { textTransform: 'uppercase' }]}
                  value={ifscCode}
                  onChangeText={(val) => setIfscCode(val.toUpperCase())}
                  placeholder="e.g. HDFC0000123"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>UPI ID</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  placeholder="username@okhdfcbank"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* ════════════ SECTION 6: Status Controls ════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Shield size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Status Controls</Text>
            </View>

            {/* KYC Status Dedicated Full Width */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>KYC Status</Text>
              <View style={styles.toggleRowFull}>
                {(['Pending', 'Verified', 'Rejected'] as const).map((status) => {
                  const isActive = kycStatus === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.toggleBtnFull,
                        isActive && (
                          status === 'Verified' ? styles.toggleBtnActiveGreen :
                          status === 'Rejected' ? styles.toggleBtnActiveRed :
                          styles.toggleBtnActiveAmber
                        ),
                      ]}
                      onPress={() => setKycStatus(status)}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          isActive && styles.toggleBtnTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Payment & Contact Status 2-Col */}
            <View style={styles.row2Col}>
              <View style={styles.col}>
                <Text style={styles.label}>Payment Status</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, paymentStatus === 1 && styles.toggleBtnActiveGreen]}
                    onPress={() => setPaymentStatus(1)}
                  >
                    <Text style={[styles.toggleBtnText, paymentStatus === 1 && styles.toggleBtnTextActive]}>
                      Enabled
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, paymentStatus === 2 && styles.toggleBtnActiveRed]}
                    onPress={() => setPaymentStatus(2)}
                  >
                    <Text style={[styles.toggleBtnText, paymentStatus === 2 && styles.toggleBtnTextActive]}>
                      Disabled
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Contact Status</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, contactStatus === 'Active' && styles.toggleBtnActiveGreen]}
                    onPress={() => setContactStatus('Active')}
                  >
                    <Text style={[styles.toggleBtnText, contactStatus === 'Active' && styles.toggleBtnTextActive]}>
                      Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, contactStatus === 'Blocked' && styles.toggleBtnActiveRed]}
                    onPress={() => setContactStatus('Blocked')}
                  >
                    <Text style={[styles.toggleBtnText, contactStatus === 'Blocked' && styles.toggleBtnTextActive]}>
                      Blocked
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Suspend Account Full Width */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>Suspend Account</Text>
              <View style={styles.toggleRowFull}>
                <TouchableOpacity
                  style={[styles.toggleBtnFull, isSuspended === 0 && styles.toggleBtnActiveNeutral]}
                  onPress={() => setIsSuspended(0)}
                >
                  <Text style={[styles.toggleBtnText, isSuspended === 0 && styles.toggleBtnTextActive]}>
                    No (Normal)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtnFull, isSuspended === 1 && styles.toggleBtnActiveRed]}
                  onPress={() => setIsSuspended(1)}
                >
                  <Text style={[styles.toggleBtnText, isSuspended === 1 && styles.toggleBtnTextActive]}>
                    Yes (Suspended)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ════════════ SECTION 7: Admin Notes ════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileText size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Admin Notes</Text>
            </View>

            <View style={styles.fullWidthCol}>
              <TextInput
                style={[styles.input, styles.textareaCompact]}
                value={adminNotes}
                onChangeText={setAdminNotes}
                placeholder="Internal notes (not visible to customer)... e.g. Verified manually via phone call."
                placeholderTextColor={COLORS.textMuted}
                multiline
              />
            </View>
          </View>

          {/* ════════════ Footer Button Row ════════════ */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActiveModal('none')}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  modalInnerWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 30,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
  },
  readOnlySectionCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  row2Col: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  col: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  controlGroup: {
    width: '100%',
    marginBottom: 8,
  },
  fullWidthCol: {
    width: '100%',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  textareaCompact: {
    height: 58,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    height: 38,
    overflow: 'hidden',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 38,
  },
  dropdownBtnText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.input,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#EDE9FE',
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  dropdownItemTextActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    height: 38,
  },
  toggleRowFull: {
    flexDirection: 'row',
    gap: 8,
    height: 38,
    width: '100%',
  },
  toggleBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 4,
  },
  toggleBtnFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
  },
  toggleBtnActiveAmber: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  toggleBtnActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  toggleBtnActiveRed: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  toggleBtnActiveNeutral: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelText: {
    fontWeight: '600',
    color: COLORS.textMuted,
    fontSize: 13,
  },
  saveBtn: {
    flex: 2,
    height: 42,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
  },
  saveText: {
    fontWeight: '700',
    color: COLORS.white,
    fontSize: 13,
  },
});
