import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface RiderReviewModalProps {
  visible: boolean;
  orderId: string;
  orderNumber: string;
  rider: {
    id: string;
    name: string;
    photo?: string;
    vehicleNumber?: string;
    averageRating?: number;
    totalReviews?: number;
  };
  onClose: () => void;
  onSubmitted?: (stars: number, data?: any) => void;
}

const TAGS = [
  { id: 'fast', label: '⚡ Fast Delivery' },
  { id: 'polite', label: '😊 Polite & Courteous' },
  { id: 'on_time', label: '⏰ On Time' },
  { id: 'well_packed', label: '📦 Handled with Care' },
  { id: 'professional', label: '👍 Professional Handover' },
];

const TIP_OPTIONS = [0, 10, 20, 30, 50];

export const RiderReviewModal: React.FC<RiderReviewModalProps> = ({
  visible,
  orderId,
  orderNumber,
  rider,
  onClose,
  onSubmitted,
}) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['fast', 'polite']);
  const [tipAmount, setTipAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Please Select a Rating', 'Tap the stars to rate your delivery experience.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5050/api/v1/orders/${encodeURIComponent(orderId)}/rate-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stars,
          comment: comment.trim(),
          tags: selectedTags,
          tipAmount,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        Alert.alert('Thank You!', 'Your rating has been submitted successfully.');
        onSubmitted?.(stars, json.data);
        onClose();
      } else {
        Alert.alert('Notice', json.message || 'Could not submit rating. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit rating. Check internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInside}>
            {/* Close Cross Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>

            {/* Rider Avatar */}
            <View style={styles.avatarWrapper}>
              {rider.photo ? (
                <Image source={{ uri: rider.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontSize: 36 }}>🛵</Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            </View>

            <Text style={styles.title}>How was your delivery?</Text>
            <Text style={styles.riderName}>{rider.name || 'DARSHAN THANKI'}</Text>
            <Text style={styles.vehicleNumber}>
              {rider.vehicleNumber || 'GJ AE 2020'} • ⭐ {rider.averageRating || 4.88} ({rider.totalReviews || 128} reviews)
            </Text>

            {/* Star Rating Row */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStars(s)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                >
                  <Ionicons
                    name={s <= stars ? 'star' : 'star-outline'}
                    size={38}
                    color={s <= stars ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.starsLabel}>
              {stars === 0
                ? 'Tap stars to rate'
                : stars === 1
                ? '😞 Poor Delivery'
                : stars === 2
                ? '😐 Below Expectations'
                : stars === 3
                ? '🙂 Good Experience'
                : stars === 4
                ? '😊 Very Good Handover'
                : '🤩 Outstanding & Fast!'}
            </Text>

            {/* Quick Feedback Tags */}
            <View style={styles.tagsWrapper}>
              {TAGS.map((tag) => {
                const isActive = selectedTags.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => toggleTag(tag.id)}
                    style={[styles.tagChip, isActive && styles.tagChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Comment Input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Add feedback for delivery partner (optional)..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={200}
              value={comment}
              onChangeText={setComment}
            />

            {/* Rider Tip Selection */}
            <View style={styles.tipSection}>
              <View style={styles.tipHeaderRow}>
                <Ionicons name="heart" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={styles.tipLabel}>Add a tip for your partner (100% to rider)</Text>
              </View>

              <View style={styles.tipRow}>
                {TIP_OPTIONS.map((amt) => {
                  const isActive = tipAmount === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => setTipAmount(amt)}
                      style={[styles.tipChip, isActive && styles.tipChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tipText, isActive && styles.tipTextActive]}>
                        {amt === 0 ? 'No tip' : `₹${amt}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>
                  {tipAmount > 0 ? `Submit Rating & Tip ₹${tipAmount}` : 'Submit Rating'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  scrollInside: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 10,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    padding: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  riderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    textAlign: 'center',
    marginTop: 4,
  },
  vehicleNumber: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    gap: 4,
  },
  starTouch: {
    padding: 4,
  },
  starsLabel: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    minHeight: 65,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
  },
  tipSection: {
    width: '100%',
    marginTop: 18,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  tipChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tipChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  tipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tipTextActive: {
    color: '#059669',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 22,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
