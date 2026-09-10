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

export const EditCustomerModal: React.FC = () => {
  const { activeModal, setActiveModal, selectedCustomer, updateCustomer, zones } = useAdminState();

  const [name, setName] = useState(selectedCustomer?.name || '');
  const [phone, setPhone] = useState(selectedCustomer?.phone || '');
  const [zoneName, setZoneName] = useState(selectedCustomer?.zoneName || 'Bopal');
  const [address, setAddress] = useState(selectedCustomer?.address || '');
  const [status, setStatus] = useState<'Active' | 'Blocked'>(selectedCustomer?.status || 'Active');

  if (!selectedCustomer) return null;

  const handleSave = () => {
    if (!name || !phone || !address) {
      Alert.alert('Validation Error', 'Please fill in all required customer fields.');
      return;
    }
    updateCustomer(selectedCustomer.id, {
      name,
      phone,
      zoneName,
      address,
      status,
    });
    setActiveModal('none');
    Alert.alert('Updated', 'Customer details saved successfully.');
  };

  return (
    <ModalContainer
      visible={activeModal === 'EditCustomer'}
      title="Edit Customer Profile"
      onClose={() => setActiveModal('none')}
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Area Zone</Text>
        <View style={styles.zoneSelectorRow}>
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
        <Text style={styles.label}>Primary Address *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact Status</Text>
        <View style={styles.statusToggleRow}>
          <TouchableOpacity
            style={[styles.statusBtn, status === 'Active' && styles.activeStatusBtn]}
            onPress={() => setStatus('Active')}
          >
            <Text style={[styles.statusBtnText, status === 'Active' && styles.activeStatusBtnText]}>
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusBtn, status === 'Blocked' && styles.blockedStatusBtn]}
            onPress={() => setStatus('Blocked')}
          >
            <Text style={[styles.statusBtnText, status === 'Blocked' && styles.activeStatusBtnText]}>
              Blocked
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setActiveModal('none')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
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
    height: 70,
    paddingTop: 8,
  },
  zoneSelectorRow: {
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
  statusToggleRow: {
    flexDirection: 'row',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 3,
  },
  activeStatusBtn: {
    backgroundColor: COLORS.success,
  },
  blockedStatusBtn: {
    backgroundColor: COLORS.error,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeStatusBtnText: {
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
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    marginLeft: 6,
  },
  saveText: {
    fontWeight: '700',
    color: COLORS.white,
  },
});
