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
      label: isAuthenticated ? 'Profile' : 'Profile',
    },
    { key: 'Local Shop', label: 'App', isWomupAppButton: true },
  ];

  const bottomPadding = Math.max(insets.bottom, 10);

  const renderIcon = (tabKey: BlinkitTabKey, isActive: boolean) => {
    switch (tabKey) {
      case 'Home':
        return (
          <Image
            source={require('../../../assets/nav_home_ref.png')}
            style={[styles.tabIcon, !isActive && { tintColor: '#8886AE' }]}
            resizeMode="contain"
          />
        );
      case 'Order Again':
        return (
          <Image
            source={require('../../../assets/nav_orders_ref.png')}
            style={[styles.tabIcon, { tintColor: isActive ? '#F20B87' : '#8886AE' }]}
            resizeMode="contain"
          />
        );
      case 'Categories':
        return (
          <Image
            source={require('../../../assets/nav_categories_ref.png')}
            style={[styles.tabIcon, { tintColor: isActive ? '#F20B87' : '#8886AE' }]}
            resizeMode="contain"
          />
        );
      case 'Profile':
        return (
          <Image
            source={require('../../../assets/nav_login_ref.png')}
            style={[styles.tabIcon, { tintColor: isActive ? '#F20B87' : '#8886AE' }]}
            resizeMode="contain"
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[styles.outerWrapper, { paddingBottom: bottomPadding }]}
      pointerEvents="box-none"
    >
      <View style={styles.navContainer} pointerEvents="auto">
        {tabs.map((tab) => {
          const isActive = Boolean(
            currentTab === tab.key ||
            (tab.isWomupAppButton &&
              (currentTab === 'Local Shop' || currentTab === 'App'))
          );

          const activeColor = '#F20B87';
          const inactiveColor = '#657493';
          const labelColor = isActive ? activeColor : inactiveColor;

          // 5th Item: Prominent Circular WOMUP Logo Button ("App")
          if (tab.isWomupAppButton) {
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => onSelectTab('Local Shop')}
                style={styles.womupAppTabBtn}
                accessibilityRole="tab"
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

          // Standard Navigation Tabs: Home, Orders, Categories, Profile
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabBtn}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 66,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 11, 135, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#4327C9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(67, 39, 201, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
      } as any,
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingBottom: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    marginBottom: 2,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '800',
    color: '#F20B87',
  },
  activeBar: {
    position: 'absolute',
    bottom: -2,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F20B87',
  },
  womupAppTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  womupAppHalo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  womupAppIconImage: {
    width: 40,
    height: 40,
  },
  womupAppLabel: {
    fontWeight: '600',
    marginTop: 0,
  },
});
