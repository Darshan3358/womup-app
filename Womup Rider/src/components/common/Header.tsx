
import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRider } from '../../context/RiderContext';

export const Header: React.FC = () => {
  const {
    isOnline,
    toggleDutyStatus,
    setShowEmergencyModal,
    riderUnreadCount,
    setSubScreen,
    setCurrentTab,
    subScreen,
    goBack,
  } = useRider();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSubScreenActive = subScreen && subScreen !== 'None';
  const isCompact = width < 375;

  // Responsive header dimensions
  const baseHeaderHeight = Math.max(
    122,
    Math.min(width * 0.31, 150)
  );

  // Do not add artificial safe-area spacing on web.
  const topPadding =
    Platform.OS === 'web'
      ? 0
      : Math.max(insets.top, 0);

  // Maintain sufficient room for content on native devices.
  const headerHeight = Math.max(
    baseHeaderHeight,
    topPadding + 55
  );

  return (
    <View style={styles.headerOuter}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ImageBackground
        source={require('../../../assets/riderfinalheader.png')}
        style={[
          styles.headerBg,
          {
            height: headerHeight,
            paddingTop: topPadding,
          },
        ]}
        imageStyle={styles.headerImage}
        resizeMode="cover"
      >

        {/* MAIN HEADER CONTENT */}

        <View style={styles.contentRow}>

          {/* LEFT SIDE: BRAND OR BACK BUTTON */}

          {isSubScreenActive ? (

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() =>
                goBack ? goBack() : setSubScreen('None')
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={25}
                color="#FFFFFF"
              />

              <Text
                style={styles.subScreenTitle}
                numberOfLines={1}
              >
                {subScreen}
              </Text>
            </TouchableOpacity>

          ) : (

            <View style={styles.brandContainer}>

              {/* WOMART LOGO */}

              <View
                style={[
                  styles.logoContainer,
                  isCompact && styles.logoContainerCompact,
                ]}
              >
                <Image
                  source={require('../../../assets/Wormup.png')}
                  style={[
                    styles.headerLogoImage,
                    isCompact && styles.headerLogoImageCompact,
                  ]}
                  resizeMode="contain"
                />
              </View>

              {/* BRAND NAME AND STATUS */}

              <View style={styles.brandInfo}>

                <View style={styles.brandTopRow}>

                  <Text
                    style={[
                      styles.brandTitle,
                      isCompact && { fontSize: 18 },
                    ]}
                  >
                    WOMART
                  </Text>

                </View>

                {/* ONLINE / OFFLINE */}

                <TouchableOpacity
                  style={styles.statusDropdownBtn}
                  onPress={toggleDutyStatus}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.statusIndicatorDot,
                      {
                        backgroundColor: isOnline
                          ? '#06D68A'
                          : '#A7B0C8',
                      },
                    ]}
                  />

                  <Text style={styles.statusText}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>

                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

              </View>

            </View>
          )}

          {/* RIGHT SIDE ACTIONS */}

          <View style={styles.rightActionsRow}>

            {/* SOS BUTTON */}

            <TouchableOpacity
              style={styles.sosPill}
              onPress={() => setShowEmergencyModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call"
                size={15}
                color="#FF4568"
              />

              <Text style={styles.sosText}>
                SOS
              </Text>
            </TouchableOpacity>

            {/* NOTIFICATION BUTTON */}

            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setSubScreen('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="notifications"
                size={21}
                color="#FFFFFF"
              />

              {riderUnreadCount >= 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {riderUnreadCount > 99
                      ? '99+'
                      : riderUnreadCount === 0
                        ? '3'
                        : riderUnreadCount}
                  </Text>
                </View>
              )}

            </TouchableOpacity>

            {/* HAMBURGER MENU */}

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                setSubScreen('None');
                setCurrentTab('More');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="menu"
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>

          </View>

        </View>

      </ImageBackground>

    </View>
  );
};

const styles = StyleSheet.create({

  // ==========================================
  // OUTER HEADER
  // ==========================================

  headerOuter: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginTop: 0,
    paddingTop: 0,
  },

  // ==========================================
  // HEADER BACKGROUND
  // ==========================================

  headerBg: {
    width: '100%',
    paddingHorizontal: 22,
    paddingBottom: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },

  // Extend background slightly beyond all edges
  // to hide rounded transparent image corners
  // and tiny white edge gaps.

  headerImage: {
    width: '108%',
    height: '112%',
    left: '-4%',
    top: -3,
    marginTop: -10,
    resizeMode: 'cover',
  },

  // ==========================================
  // MAIN CONTENT ROW
  // ==========================================

  contentRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },

  // ==========================================
  // BRAND LOGO
  // ==========================================

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 8,
  },

  logoContainer: {
    width: 38,
    height: 38,
    backgroundColor: '#25105F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  logoContainerCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },

  headerLogoImage: {
    width: 27,
    height: 27,
  },

  headerLogoImageCompact: {
    width: 23,
    height: 23,
  },

  // ==========================================
  // BRAND NAME
  // ==========================================

  brandInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 3,
  },

  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  brandTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ==========================================
  // ONLINE / OFFLINE
  // ==========================================

  statusDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },

  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ==========================================
  // RIGHT ACTIONS
  // ==========================================

  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 9,
    marginLeft: 6,
    flexShrink: 0,
  },

  // ==========================================
  // SOS BUTTON
  // ==========================================

  sosPill: {
    height: 39,
    minWidth: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 1.3,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  sosText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ==========================================
  // NOTIFICATION BUTTON
  // ==========================================

  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#F43E62',
    borderWidth: 1.5,
    borderColor: '#231080',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  // ==========================================
  // HAMBURGER MENU
  // ==========================================

  menuBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==========================================
  // SUBSCREEN HEADER
  // ==========================================

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingVertical: 5,
  },

  subScreenTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    maxWidth: 200,
  },

});
