import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CheckCircle2, AlertCircle, Store, MapPin, Tag, Building2 } from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const AddZoneModal: React.FC = () => {
  const { activeModal, setActiveModal, addOperationalZoneItem, zones } = useAdminState();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isCodeUserEdited, setIsCodeUserEdited] = useState(false);
  const [darkStore, setDarkStore] = useState('');
  const [isDarkStoreUserEdited, setIsDarkStoreUserEdited] = useState(false);
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (activeModal === 'AddZone') {
      setName('');
      setCode('');
      setIsCodeUserEdited(false);
      setDarkStore('');
      setIsDarkStoreUserEdited(false);
      setAddress('');
      setStatus('Active');
      setLoading(false);
      setErrorMsg(null);
    }
  }, [activeModal]);

  const handleNameChange = (val: string) => {
    setName(val);
    setErrorMsg(null);

    // Auto-generate code if user hasn't manually edited it
    if (!isCodeUserEdited) {
      const generatedCode = val
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      setCode(generatedCode);
    }

    // Auto-generate Dark Store if user hasn't manually edited it
    if (!isDarkStoreUserEdited) {
      setDarkStore(val.trim() ? `Wom Up ${val.trim()} Dark Store` : '');
    }
  };

  const handleCodeChange = (val: string) => {
    setIsCodeUserEdited(true);
    setErrorMsg(null);
    setCode(val.toUpperCase().replace(/[^A-Z0-9_]/g, ''));
  };

  const handleDarkStoreChange = (val: string) => {
    setIsDarkStoreUserEdited(true);
    setErrorMsg(null);
    setDarkStore(val);
  };

  const handleCreate = async () => {
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Zone Name is required.');
      return;
    }

    const trimmedCode = code.trim() || trimmedName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    if (!trimmedCode) {
      setErrorMsg('Zone Code is required.');
      return;
    }

    // Check duplicate locally against currently loaded zones
    const duplicateName = zones.find(
      (z) => z.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      setErrorMsg(`A zone named "${trimmedName}" already exists.`);
      return;
    }

    const duplicateCode = zones.find(
      (z) => z.code && z.code.toUpperCase() === trimmedCode.toUpperCase()
    );
    if (duplicateCode) {
      setErrorMsg(`A zone with code "${trimmedCode}" already exists.`);
      return;
    }

    const finalDarkStore = darkStore.trim() || `Wom Up ${trimmedName} Dark Store`;
    const finalAddress = address.trim() || `${trimmedName}, Ahmedabad`;

    setLoading(true);
    try {
      const res = await addOperationalZoneItem({
        name: trimmedName,
        code: trimmedCode,
        darkStore: finalDarkStore,
        address: finalAddress,
        isActive: status === 'Active',
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create operational zone.');
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      setActiveModal('none');
      Alert.alert(
        'Zone Created',
        `Operational Zone "${trimmedName}" has been successfully added to MongoDB and linked with "${finalDarkStore}". It is now selected for area pricing.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating zone');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setErrorMsg(null);
    setActiveModal('none');
  };

  return (
    <ModalContainer
      visible={activeModal === 'AddZone'}
      title="Add New Operational Zone"
      onClose={handleCancel}
    >
      <View style={styles.formContainer}>
        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={COLORS.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Zone Name Field */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <MapPin size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.label}>Zone Name *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Prahlad Nagar"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={handleNameChange}
            editable={!loading}
            autoFocus={true}
          />
          <Text style={styles.helperText}>The customer-facing and operational area name.</Text>
        </View>

        {/* Zone Code Field */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Tag size={14} color={COLORS.navy} style={{ marginRight: 6 }} />
            <Text style={styles.label}>Zone Code *</Text>
          </View>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="e.g. PRAHLAD_NAGAR"
            placeholderTextColor={COLORS.textMuted}
            value={code}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            editable={!loading}
          />
          <Text style={styles.helperText}>Unique internal code used for routing and delivery tracking.</Text>
        </View>

        {/* Dark Store Field */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Store size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.label}>Dark Store *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Wom Up Prahlad Nagar Dark Store"
            placeholderTextColor={COLORS.textMuted}
            value={darkStore}
            onChangeText={handleDarkStoreChange}
            editable={!loading}
          />
          <Text style={styles.helperText}>Warehouse hub fulfilling orders for this operational zone.</Text>
        </View>

        {/* Address Field */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Building2 size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.label}>Address</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Zone / store address (e.g. Near Corporate Road, Ahmedabad)"
            placeholderTextColor={COLORS.textMuted}
            value={address}
            onChangeText={(val) => {
              setErrorMsg(null);
              setAddress(val);
            }}
            multiline
            numberOfLines={2}
            editable={!loading}
          />
        </View>

        {/* Status Toggle Field */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                status === 'Active' && styles.statusOptionActive,
              ]}
              onPress={() => setStatus('Active')}
              disabled={loading}
            >
              <View
                style={[
                  styles.radioCircle,
                  status === 'Active' && styles.radioCircleSelected,
                ]}
              >
                {status === 'Active' && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[
                  styles.statusText,
                  status === 'Active' && styles.statusTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                status === 'Inactive' && styles.statusOptionInactive,
              ]}
              onPress={() => setStatus('Inactive')}
              disabled={loading}
            >
              <View
                style={[
                  styles.radioCircle,
                  status === 'Inactive' && styles.radioCircleSelected,
                ]}
              >
                {status === 'Inactive' && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[
                  styles.statusText,
                  status === 'Inactive' && styles.statusTextInactive,
                ]}
              >
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createBtn, loading && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <CheckCircle2 size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.createBtnText}>Create Zone</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingVertical: SPACING.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.input,
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border || '#E2E8F0',
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  codeInput: {
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.navy,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 6,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border || '#E2E8F0',
    borderRadius: RADIUS.input,
  },
  statusOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  statusOptionInactive: {
    borderColor: COLORS.textMuted,
    backgroundColor: '#F1F5F9',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusTextActive: {
    color: COLORS.primary,
  },
  statusTextInactive: {
    color: COLORS.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#E2E8F0',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.button,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
