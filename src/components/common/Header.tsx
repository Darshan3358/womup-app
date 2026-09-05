import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  rightActionText?: string;
  onRightActionPress?: () => void;
  dark?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
  rightActionText,
  onRightActionPress,
  dark = false,
  style,
}) => {
  const { goBack } = useApp();
  const iconColor = dark ? COLORS.white : COLORS.textPrimary;
  const textColor = dark ? COLORS.white : COLORS.textPrimary;
  const subtitleColor = dark ? 'rgba(255,255,255,0.7)' : COLORS.textMuted;
  const handleBack = onBack || goBack;

  return (
    <View style={[styles.container, dark && styles.darkContainer, style]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        {title && (
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : rightActionText ? (
          <TouchableOpacity activeOpacity={0.7} onPress={onRightActionPress}>
            <Text style={styles.rightActionText}>{rightActionText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  darkContainer: {
    backgroundColor: COLORS.navy,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
