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
    switch (tabKey) {
      case 'Home':
        return (
          <Image
            source={require('../../../assets/nav_home_ref.png')}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        );
      case 'Order Again':
        return (
          <Image
            source={require('../../../assets/nav_orders_ref.png')}
            style={{ width: 24, height: 24, tintColor: isActive ? '#E11D88' : undefined }}
            resizeMode="contain"
          />
        );
      case 'Categories':
        return (
          <Image
            source={require('../../../assets/nav_categories_ref.png')}
            style={{ width: 24, height: 24, tintColor: isActive ? '#E11D88' : undefined }}
            resizeMode="contain"
          />
        );
      case 'Profile':
        return (
          <Image
            source={require('../../../assets/nav_login_ref.png')}
            style={{ width: 24, height: 24, tintColor: isActive ? '#E11D88' : undefined }}
            resizeMode="contain"
          />
        );
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

          const labelColor = isActive ? '#E11D88' : '#52525B';

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
                <View style={styles.womupAppHalo}>
                  <Image
                    source={require('../../../assets/nav_app_button_ref.png')}
                    style={styles.womupAppIconImage}
                    resizeMode="contain"
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

              {/* Pink Underline Pill Indicator under Active Tab */}
              {isActive && <View style={styles.activeBar} />}
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
    overflow: 'visible',
    paddingTop: 14,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.06)',
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
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '700',
    color: '#E11D88',
  },
  activeBar: {
    width: 22,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E11D88',
    marginTop: 3,
  },
  womupAppTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  womupAppHalo: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  womupAppIconImage: {
    width: 42,
    height: 42,
  },
  womupAppLabel: {
    fontWeight: '600',
    marginTop: 1,
  },
});
