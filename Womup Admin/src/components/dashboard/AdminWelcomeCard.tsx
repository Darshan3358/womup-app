import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight, Check } from 'lucide-react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { GRADIENTS } from '../../theme';

interface AdminWelcomeCardProps {
  adminName?: string;
  dateLabel?: string;
  onPressDate?: () => void;
}

export const AdminWelcomeCard: React.FC<AdminWelcomeCardProps> = ({
  adminName = 'Admin Darshan',
  dateLabel,
  onPressDate,
}) => {
  // Determine greeting based on current device hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning,' : currentHour < 17 ? 'Good Afternoon,' : 'Good Evening,';

  // Format current date if not provided
  const formattedDate =
    dateLabel ||
    new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <LinearGradient
      colors={GRADIENTS.welcomeCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.contentRow}>
        {/* Avatar with online badge */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {/* SVG Male Administrator Avatar with glasses, suit, tie */}
            <Svg width={50} height={50} viewBox="0 0 100 100">
              {/* Background circular surface */}
              <Circle cx="50" cy="50" r="48" fill="#F3E8FF" />

              {/* Suit shoulders */}
              <Path d="M 12 100 Q 50 68 88 100 Z" fill="#1E1B4B" />

              {/* White Shirt collar */}
              <Path d="M 38 72 L 50 90 L 62 72 L 50 64 Z" fill="#FFFFFF" />

              {/* Dark Tie */}
              <Path d="M 47 70 L 53 70 L 55 92 L 50 100 L 45 92 Z" fill="#4338CA" />

              {/* Neck */}
              <Rect x="43" y="52" width="14" height="16" rx="4" fill="#FBCFE8" />

              {/* Face */}
              <Circle cx="50" cy="40" r="21" fill="#FDE047" opacity={0.25} />
              <Circle cx="50" cy="38" r="20" fill="#FBCFE8" />

              {/* Hair */}
              <Path
                d="M 28 35 C 28 18, 72 18, 72 35 C 72 37, 68 24, 50 24 C 34 24, 28 36, 28 35 Z"
                fill="#1E293B"
              />

              {/* Glasses frame */}
              <Rect x="34" y="32" width="13" height="9" rx="2" fill="none" stroke="#0F172A" strokeWidth="2.5" />
              <Rect x="53" y="32" width="13" height="9" rx="2" fill="none" stroke="#0F172A" strokeWidth="2.5" />
              <Path d="M 47 36 L 53 36" stroke="#0F172A" strokeWidth="2" />

              {/* Eyes */}
              <Circle cx="40.5" cy="36.5" r="2" fill="#0F172A" />
              <Circle cx="59.5" cy="36.5" r="2" fill="#0F172A" />

              {/* Smile */}
              <Path
                d="M 44 48 Q 50 53 56 48"
                fill="none"
                stroke="#9D174D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
          </View>

          {/* Green Online Status Dot */}
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
          </View>
        </View>

        {/* Admin greeting & details */}
        <View style={styles.textColumn}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.adminNameText} numberOfLines={1}>
              {adminName}
            </Text>
            {/* Verified Badge */}
            <View style={styles.verifiedBadge}>
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.subText}>Manage your WomUp ecosystem</Text>
        </View>

        {/* Date Chip */}
        <TouchableOpacity
          style={styles.dateChip}
          onPress={onPressDate}
          activeOpacity={0.8}
        >
          <Calendar size={12} color="#FFFFFF" />
          <Text style={styles.dateChipText} numberOfLines={1}>
            {formattedDate}
          </Text>
          <ChevronRight size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Subtle decorative bottom wave */}
      <View style={styles.waveContainer} pointerEvents="none">
        <Svg width="100%" height={26} viewBox="0 0 350 26" preserveAspectRatio="none">
          <Path
            d="M 0 16 Q 80 4 175 16 T 350 16 L 350 26 L 0 26 Z"
            fill="rgba(255, 255, 255, 0.08)"
          />
          <Path
            d="M 0 20 Q 90 10 200 20 T 350 20 L 350 26 L 0 26 Z"
            fill="rgba(255, 255, 255, 0.06)"
          />
        </Svg>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 22,
    paddingHorizontal: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  adminNameText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 5,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    fontWeight: '400',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  dateChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 90,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    zIndex: 1,
  },
});

