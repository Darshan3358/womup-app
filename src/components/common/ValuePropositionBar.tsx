import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export const ValuePropositionBar: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      {/* 1. Fast Delivery */}
      <View style={styles.featureItem}>
        <View style={[styles.iconCircle, { backgroundColor: '#FDF2F8' }]}>
          <Ionicons name="flash" size={16} color="#EC4899" />
        </View>
        <Text style={styles.featureLabel}>Fast{'\n'}Delivery</Text>
      </View>

      <View style={styles.divider} />

      {/* 2. Secure Payments */}
      <View style={styles.featureItem}>
        <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
        </View>
        <Text style={styles.featureLabel}>Secure{'\n'}Payments</Text>
      </View>

      <View style={styles.divider} />

      {/* 3. 24x7 Support */}
      <View style={styles.featureItem}>
        <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
          <Feather name="headphones" size={16} color="#3B82F6" />
        </View>
        <Text style={styles.featureLabel}>24x7{'\n'}Support</Text>
      </View>

      <View style={styles.divider} />

      {/* 4. Exciting Offers */}
      <View style={styles.featureItem}>
        <View style={[styles.iconCircle, { backgroundColor: '#FDF4FF' }]}>
          <Ionicons name="gift" size={16} color="#E11D88" />
        </View>
        <Text style={styles.featureLabel}>Exciting{'\n'}Offers</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E1B4B',
    lineHeight: 13,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
  },
});
