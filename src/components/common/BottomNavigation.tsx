import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { AppIcon, IconName } from './AppIcon';

export type BlinkitTabKey =
  | 'Home'
  | 'Local Shop'
  | 'Order Again'
  | 'Categories'
  | 'Profile'
  | 'App';

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

  // 5 clean tabs: Home, Order Again, Categories, Profile, App
  const tabs: {
    key: BlinkitTabKey;
    label: string;
    icon?: IconName;
    isWomupAppButton?: boolean;
  }[] = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Order Again', label: 'Order Again', icon: 'shopping-basket' },
    { key: 'Categories', label: 'Categories', icon: 'grid' },
    { key: 'Profile', label: 'Profile', icon: 'user' },
    { key: 'Local Shop', label: 'App', isWomupAppButton: true },
  ];

  const bottomPadding = Math.max(insets.bottom, 8);
  const barHeight = 64;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPadding }]}>
      <View style={[styles.container, { height: barHeight }]}>
        {tabs.map((tab) => {
          const isActive =
            currentTab === tab.key ||
            (tab.isWomupAppButton && (currentTab === 'Local Shop' || currentTab === 'App'));

          const iconColor = isActive ? COLORS.hotPink : COLORS.textMuted;
          const labelColor = isActive ? COLORS.hotPink : COLORS.textMuted;

          // Special 3D Circular WOMUP Logo Button ("App" / Local Shop)
          if (tab.isWomupAppButton) {
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => onSelectTab('Local Shop')}
                style={styles.womupAppTabItem}
                accessibilityLabel="WOMUP Local Shop App"
              >
                <View
                  style={[
                    styles.womupAppCircle,
                    isActive && styles.womupAppCircleActive,
                  ]}
                >
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.womupAppIconImage}
                    resizeMode="cover"
                  />
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    styles.womupAppLabel,
                    { color: labelColor },
                    isActive && styles.activeTabLabel,
                  ]}
                  numberOfLines={1}
                >
                  App
                </Text>

                {isActive && <View style={styles.activeBar} />}
              </TouchableOpacity>
            );
          }

          // Standard navigation tabs (Home, Order Again, Print, Profile)
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                {tab.icon && (
                  <AppIcon
                    name={tab.icon}
                    size={isSmallDevice ? 21 : 23}
                    color={iconColor}
                    isActive={isActive}
                  />
                )}
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
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
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
    paddingHorizontal: 6,
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
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  activeBar: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.hotPink,
    marginTop: 2,
  },

  // Distinctive Circular WOMUP App Button (Matches User Screenshot Image 2)
  womupAppTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  womupAppCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#C026D3', // Neon purple/magenta glowing rim
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(192, 38, 211, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
      } as any,
      default: {
        shadowColor: '#C026D3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 6,
      },
    }),
  },
  womupAppCircleActive: {
    borderColor: COLORS.hotPink,
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      web: {
        boxShadow: '0 0 12px rgba(225, 29, 72, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4)',
      } as any,
      default: {
        shadowColor: COLORS.hotPink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.75,
        shadowRadius: 7,
        elevation: 8,
      },
    }),
  },
  womupAppIconImage: {
    width: '100%',
    height: '100%',
  },
  womupAppLabel: {
    fontWeight: '700',
  },
});
