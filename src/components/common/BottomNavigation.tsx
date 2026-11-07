import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

import { useApp } from '../../context/AppContext';

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
  const { isAuthenticated } = useApp();

  const isSmallDevice = width <= 360;

  // 5 clean tabs: Home, Orders, Categories, Profile/Login, Local App
  const tabs: {
    key: BlinkitTabKey;
    label: string;
    isWomupAppButton?: boolean;
  }[] = [
    { key: 'Home', label: 'Home' },
    { key: 'Order Again', label: 'Orders' },
    { key: 'Categories', label: 'Categories' },
    {
      key: 'Profile',
      label: isAuthenticated ? 'Profile' : 'Login',
    },
    { key: 'Local Shop', label: 'App', isWomupAppButton: true },
  ];

  const bottomPadding = Math.max(insets.bottom, 6);
  const barHeight = 58;

  const renderIcon = (tabKey: BlinkitTabKey, isActive: boolean) => {
    const iconColor = isActive ? '#E11D88' : '#6B7280';
    const iconSize = isSmallDevice ? 22 : 24;

    switch (tabKey) {
      case 'Home':
        return <Ionicons name={isActive ? 'home' : 'home-outline'} size={iconSize} color={iconColor} />;
      case 'Order Again':
        return <Feather name="shopping-bag" size={iconSize - 2} color={iconColor} />;
      case 'Categories':
        return <Ionicons name={isActive ? 'grid' : 'grid-outline'} size={iconSize} color={iconColor} />;
      case 'Profile':
        return <Feather name="user" size={iconSize - 1} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/womart_footer_wave.png')}
      style={[styles.wrapper, { paddingBottom: bottomPadding }]}
      resizeMode="cover"
    >
      <View style={[styles.container, { height: barHeight }]}>
        {tabs.map((tab) => {
          const isActive = Boolean(
            currentTab === tab.key ||
            (tab.isWomupAppButton && (currentTab === 'Local Shop' || currentTab === 'App'))
          );

          const labelColor = isActive ? '#E11D88' : '#6B7280';

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
              </TouchableOpacity>
            );
          }

          // Standard navigation tabs (Home, Orders, Categories, Login/Profile)
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                {renderIcon(tab.key, isActive)}
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
            </TouchableOpacity>
          );
        })}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FAF5FF',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.06)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
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
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '800',
    color: '#E11D88',
  },
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
    borderColor: '#C026D3',
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
    borderColor: '#E11D88',
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      web: {
        boxShadow: '0 0 12px rgba(225, 29, 72, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4)',
      } as any,
      default: {
        shadowColor: '#E11D88',
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
