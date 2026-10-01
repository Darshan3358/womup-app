
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { AppIcon, IconName } from './AppIcon';

export type BlinkitTabKey = 'Home' | 'Order Again' | 'Categories' | 'Print' | 'Profile';
// Backward compatibility alias
export type TabKey = BlinkitTabKey | 'Cart' | 'Orders' | 'Account' | 'District';

interface BottomNavigationProps {
  currentTab: BlinkitTabKey | TabKey;
  onSelectTab: (tab: any) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmallDevice = width <= 360;

  const tabs: {
    key: BlinkitTabKey;
    label: string;
    icon: IconName;
  }[] = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Order Again', label: 'Order Again', icon: 'shopping-basket' },
    { key: 'Categories', label: 'Categories', icon: 'grid' },
    { key: 'Print', label: 'Print', icon: 'printer' },
    { key: 'Profile', label: 'Profile', icon: 'user' },
  ];

  const bottomPadding = Math.max(insets.bottom, 8);
  const barHeight = 64;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPadding }]}>
      <View style={[styles.container, { height: barHeight }]}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const iconColor = isActive ? COLORS.hotPink : COLORS.textMuted;
          const labelColor = isActive ? COLORS.hotPink : COLORS.textMuted;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                <AppIcon
                  name={tab.icon}
                  size={isSmallDevice ? 22 : 24}
                  color={iconColor}
                  isActive={isActive}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  { color: labelColor },
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>

              {/* Active Indicator Bar */}
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.06)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 8,
      },
    }),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  activeBar: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.hotPink,
    marginTop: 3,
  },
});
