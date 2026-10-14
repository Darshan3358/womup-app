import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Store,
  MapPin,
  Briefcase,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Camera,
  Upload,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { FileUploadField } from '../components/FileUploadField';

interface VendorRegistrationScreenProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const VendorRegistrationScreen: React.FC<VendorRegistrationScreenProps> = ({
  onCancel,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Basic Info
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState('Kirana / Vegetables');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [district, setDistrict] = useState('Ahmedabad');
  const [taluka, setTaluka] = useState('Daskroi');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('380015');

  // Step 3: Business & Bank
  const [gstNo, setGstNo] = useState('');
  const [categoryName, setCategoryName] = useState('Vegetables');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [branchName, setBranchName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Step 4: KYC Documents
  const [aadharNo, setAadharNo] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [panCard, setPanCard] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [shopPhoto, setShopPhoto] = useState('');

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!firmName.trim() || !ownerName.trim() || !mobile.trim()) {
        Alert.alert('Required Fields', 'Please enter Firm Name, Owner Name, and Mobile Number.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!address.trim() || !pincode.trim()) {
        Alert.alert('Required Fields', 'Please enter Address and Pincode.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert('Required Fields', 'Please enter Bank Account Number and IFSC Code for payments.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!aadharNo.trim() || aadharNo.replace(/\s+/g, '').length < 12) {
      Alert.alert('Aadhaar Required', 'Please enter a valid 12-digit Aadhaar Number.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5050/api/v1/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: firmName.trim(),
          vendorFirmName: firmName.trim(),
          ownerName: ownerName.trim(),
          vendorOwnerName: ownerName.trim(),
          ownerPhone: mobile.trim(),
          vendorMobile: mobile.trim(),
          vendorAlternateMobile: altMobile.trim(),
          vendorEmail: email.trim(),
          businessType,
          address: address.trim(),
          businessAddress: address.trim(),
          businessLandmark: landmark.trim(),
          city,
          districtId: district,
          talukaId: taluka,
          stateId: state,
          pincode: pincode.trim(),
          businessPincode: pincode.trim(),
          categoryName,
          businessCategoryId: categoryName,
          vendorGstNo: gstNo.trim(),
          bankName,
          bankBranch: branchName.trim(),
          accountHolderName: accountHolder.trim() || ownerName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          upiId: upiId.trim(),
          vendorAadharNo: aadharNo.trim(),
          vendorAadharFrontImage: aadharFront,
          vendorAadharBackImage: aadharBack,
          panCardImage: panCard,
          tradeLicenseImage: tradeLicense,
          shopPhotoImage: shopPhoto,
          vendorStatus: 1, // Pending
          isVerified: false,
        }),
      });

      const data = await response.json();
      setSubmitting(false);

      if (data.success || response.ok) {
        Alert.alert(
          'Application Submitted 🎉',
          'Your vendor partner registration has been submitted successfully! Status: Under Review.',
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        Alert.alert('Submission Error', data.message || 'Could not submit registration. Please verify details.');
      }
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Connection Error', 'Could not reach server. Please check your network.');
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Register Merchant Shop</Text>
          <Text style={styles.subtitle}>Step {currentStep} of 4: {
            currentStep === 1 ? 'Basic Details' :
            currentStep === 2 ? 'Store Location' :
            currentStep === 3 ? 'Bank & Tax' : 'KYC Verification'
          }</Text>

          {/* Stepper Progress Bar */}
          <View style={styles.stepper}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={[
                  styles.stepBar,
                  step <= currentStep && styles.stepBarActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Store size={20} color={COLORS.rose} />
              <Text style={styles.sectionTitle}>Shop & Owner Profile</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firm / Shop Name *</Text>
              <TextInput
                style={styles.input}
                value={firmName}
                onChangeText={setFirmName}
                placeholder="e.g. Gokul Vegetables & Fruits"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Full Name *</Text>
              <TextInput
                style={styles.input}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Ramesh Patel"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Type *</Text>
              <TextInput
                style={styles.input}
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="e.g. Kirana / Vegetables / Dairy"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alternate Mobile</Text>
              <TextInput
                style={styles.input}
                value={altMobile}
                onChangeText={setAltMobile}
                placeholder="+91 98765 00000"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="gokul@gmail.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* STEP 2: Location */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Shop Location & Address</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Shop No. 4, Near Nandanvan Society"
                placeholderTextColor="#64748B"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Landmark</Text>
              <TextInput
                style={styles.input}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Near Railway Crossing"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pincode *</Text>
                <TextInput
                  style={styles.input}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Taluka</Text>
                <TextInput style={styles.input} value={taluka} onChangeText={setTaluka} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>District</Text>
                <TextInput style={styles.input} value={district} onChangeText={setDistrict} />
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Business & Bank Details */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Bank Account & Tax Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GST Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={gstNo}
                onChangeText={setGstNo}
                placeholder="24ABCDE1234F1Z5"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name *</Text>
              <TextInput style={styles.input} value={bankName} onChangeText={setBankName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch Name</Text>
              <TextInput
                style={styles.input}
                value={branchName}
                onChangeText={setBranchName}
                placeholder="e.g. SG Highway"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="50100234567890"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={styles.input}
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="HDFC0000123"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>UPI ID (For Instant Payouts)</Text>
              <TextInput
                style={styles.input}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="gokul@okhdfc"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* STEP 4: KYC Documents */}
        {currentStep === 4 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <FileCheck2 size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Aadhaar & Shop Documentation</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Aadhaar Number *</Text>
              <TextInput
                style={styles.input}
                value={aadharNo}
                onChangeText={setAadharNo}
                placeholder="XXXX XXXX 1234"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={14}
              />
            </View>

            <FileUploadField
              label="Aadhaar Front Image"
              required
              value={aadharFront}
              folder="wormup/kyc/vendor"
              onUploadComplete={(url) => setAadharFront(url)}
              helperText="Upload clear photo or scan of front side"
            />

            <FileUploadField
              label="Aadhaar Back Image"
              required
              value={aadharBack}
              folder="wormup/kyc/vendor"
              onUploadComplete={(url) => setAadharBack(url)}
              helperText="Upload clear photo showing your permanent address"
            />

            <FileUploadField
              label="PAN Card Image"
              required
              value={panCard}
              folder="wormup/kyc/vendor"
              onUploadComplete={(url) => setPanCard(url)}
              helperText="Upload business or personal PAN card"
            />

            <FileUploadField
              label="Shop Front Photo"
              required
              value={shopPhoto}
              folder="wormup/kyc/vendor"
              onUploadComplete={(url) => setShopPhoto(url)}
              helperText="Upload photo showing shop signboard clearly"
            />
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.footerBtns}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentStep((currentStep - 1) as any)}
            >
              <ArrowLeft size={18} color="#94A3B8" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
              <Text style={styles.backBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNextStep}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>
                  {currentStep === 4 ? 'Submit Application' : 'Continue'}
                </Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  stepper: { flexDirection: 'row', gap: 6, marginTop: 14 },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepBarActive: { backgroundColor: COLORS.rose },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 6 },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: { flexDirection: 'row', gap: 12 },
  docBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  docInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docTitle: { fontSize: 13, fontWeight: '600', color: '#E2E8F0' },
  uploadedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  uploadedText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  footerBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  nextBtn: {
    flex: 2,
    backgroundColor: COLORS.rose,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
