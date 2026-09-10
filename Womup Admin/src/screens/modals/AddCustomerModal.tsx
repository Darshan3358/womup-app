import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { CustomerType } from '../../types/admin';

export const AddCustomerModal: React.FC = () => {
  const { activeModal, setActiveModal, addCustomer, zones } = useAdminState();

  const [type, setType] = useState<CustomerType>('Individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zoneName, setZoneName] = useState('Bopal');
  const [address, setAddress] = useState('');

  const handleCreate = () => {
    if (!name || !phone || !address) {
      Alert.alert('Validation Required', 'Please enter Name, Phone Number and Address.');
      return;
    }

    addCustomer({
      name,
      phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@womup.com`,
      type,
      zoneName,
      address,
    });

    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setActiveModal('none');
    Alert.alert('Success', `New ${type} customer added successfully.`);
  };

  return (
    <ModalContainer
      visible={activeModal === 'AddCustomer'}
      title="Add New Customer"
      onClose={() => setActiveModal('none')}
    >
      {/* Type Selector */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'Individual' && styles.activeTypeBtn]}
          onPress={() => setType('Individual')}
        >
          <Text style={[styles.typeText, type === 'Individual' && styles.activeTypeText]}>
            Individual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, type === 'Corporate' && styles.activeTypeBtn]}
          onPress={() => setType('Corporate')}
        >
          <Text style={[styles.typeText, type === 'Corporate' && styles.activeTypeText]}>
            Corporate
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Anish Patel"
          placeholderTextColor={COLORS.secondaryText}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          placeholderTextColor={COLORS.secondaryText}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="anish.patel@example.com"
          placeholderTextColor={COLORS.secondaryText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Select Area Zone</Text>
        <View style={styles.zoneRow}>
          {zones.map((z) => (
            <TouchableOpacity
              key={z.id}
              style={[styles.zoneChip, zoneName === z.name && styles.activeZoneChip]}
              onPress={() => setZoneName(z.name)}
            >
              <Text style={[styles.zoneChipText, zoneName === z.name && styles.activeZoneChipText]}>
                {z.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Address *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Enter house no, street, locality..."
          placeholderTextColor={COLORS.secondaryText}
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setActiveModal('none')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createText}>Create Customer</Text>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeTypeBtn: {
    backgroundColor: COLORS.purple,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTypeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    height: 60,
    paddingTop: 8,
  },
  zoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  zoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeZoneChip: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  zoneChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activeZoneChipText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  cancelText: {
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  createBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    marginLeft: 6,
  },
  createText: {
    fontWeight: '700',
    color: COLORS.white,
  },
});
