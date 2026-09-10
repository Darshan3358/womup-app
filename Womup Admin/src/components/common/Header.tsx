import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ArrowLeft, Layers, Menu } from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const { activeTab, subView, setSubView, goBackSubView, toggleSidebar } = useAdminState();

  const isSubScreen = showBack || subView !== 'none';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (subView !== 'none') {
      goBackSubView();
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.content}>
        {isSubScreen ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft color={COLORS.white} size={22} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoRow} onPress={toggleSidebar} activeOpacity={0.8}>
            <Image
              source={require('../../../assets/womup_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>Womup</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.screenTitle}>
          {title || (subView !== 'none' ? subView : activeTab)}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {}}
          >
            <Bell color={COLORS.white} size={20} />
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleSidebar}
          >
            <Menu color={COLORS.white} size={22} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: 12,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8,
  },
  brandTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenTitle: {
    color: COLORS.lightPink,
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
});
