import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';

interface SearchBarProps {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  editable?: boolean;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search for products...',
  onPress,
  editable = true,
  onClear,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={editable ? 1 : 0.8}
      onPress={editable ? undefined : onPress}
      style={[styles.container, style]}
    >
      <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        editable={editable}
        pointerEvents={editable ? 'auto' : 'none'}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.compact,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});
