import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarFilterProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  onSubmitSearch?: () => void;
}

export const SearchBarFilter: React.FC<SearchBarFilterProps> = ({
  value,
  onChangeText,
  onFilterPress,
  onSubmitSearch,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        {/* Left Magnifier Icon */}
        <Ionicons name="search-outline" size={20} color="#64748B" style={styles.leftIcon} />

        {/* Text Input */}
        <TextInput
          style={styles.input}
          placeholder="Search for shops, products or categories..."
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={onSubmitSearch}
        />

        {/* Filter Sliders Icon */}
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={onFilterPress}
          accessibilityLabel="Filter shops"
        >
          <Ionicons name="options-outline" size={20} color="#334155" />
        </TouchableOpacity>

        {/* Pink Circular Search Button */}
        <TouchableOpacity
          style={styles.searchCircleBtn}
          activeOpacity={0.8}
          onPress={onSubmitSearch}
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingLeft: 12,
    paddingRight: 5,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leftIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 7,
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E11D48', // Vibrant pink / rose
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
});
