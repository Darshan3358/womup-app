import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const EmergencyModal: React.FC = () => {
  const { showEmergencyModal, setShowEmergencyModal } = useRider();

  const handleCall = async (title: string, number: string) => {
    const cleanNumber = number.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Call ${title}`, `Emergency helpline: ${number}`);
      }
    } catch {
      Alert.alert(`Call ${title}`, `Emergency helpline: ${number}`);
    }
  };

  return (
    <Modal
      visible={showEmergencyModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowEmergencyModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <View style={styles.header}>
            <View style={styles.sosBadge}>
              <Text style={styles.sosText}>SOS</Text>
            </View>
            <Text style={styles.title}>Emergency Assistance</Text>
            <Text style={styles.subtitle}>
              Your live location is being transmitted to the safety operations center.
            </Text>
          </View>

          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[styles.emergencyButton, styles.policeBtn]}
              onPress={() => handleCall('Police', '112')}
              activeOpacity={0.8}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="shield-outline" size={20} color="#DC2626" />
              </View>
              <View style={styles.btnInfo}>
                <Text style={styles.btnTitle}>Police Emergency</Text>
                <Text style={styles.btnDesc}>Call National Helpline 112</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, styles.ambulanceBtn]}
              onPress={() => handleCall('Ambulance', '108')}
              activeOpacity={0.8}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="medkit-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.btnInfo}>
                <Text style={styles.btnTitle}>Medical Ambulance</Text>
                <Text style={styles.btnDesc}>Call Emergency 108</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, styles.dispatchBtn]}
              onPress={() => handleCall('WormUp Operations Hub', '+91 79 4000 8899')}
              activeOpacity={0.8}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="headset-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.btnInfo}>
                <Text style={styles.btnTitle}>WormUp Hub Dispatch</Text>
                <Text style={styles.btnDesc}>Direct line to Satellite Dark Store Manager</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => setShowEmergencyModal(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sosBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  sosText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 14,
  },
  policeBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  ambulanceBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  dispatchBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnEmoji: {
    fontSize: 26,
  },
  btnInfo: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  btnDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dismissBtn: {
    paddingVertical: 14,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    alignItems: 'center',
  },
  dismissText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
});
