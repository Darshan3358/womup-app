import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Path } from 'react-native-svg';
import { LocalCartItem, LocalVendor, LocalTransaction } from '../types/localShop.types';
import { LocalShopApi } from '../api/localShopApi';
import { StoreDirectionMapModal } from '../components/StoreDirectionMapModal';

interface ShopDetailScreenProps {
  vendorId?: string;
  initialVendor?: LocalVendor;
  customerCoords?: { latitude: number; longitude: number };
  customerAddress?: string;
  onGoBack: () => void;
  onOpenCart?: (cart: LocalCartItem[]) => void;
  onScanCounterQR: () => void;
}

/**
 * Procedural Vector QR Code with Position Finder Patterns & Center WOMUP Brand Pill
 */
const ShopQRCodeVisual: React.FC<{ size?: number; codeValue: string }> = ({ size = 180 }) => {
  return (
    <View style={qrStyles.wrapper}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        {/* Background */}
        <Rect x="0" y="0" width="160" height="160" fill="#FFFFFF" rx="8" />

        {/* Top-Left Position Detection Marker */}
        <Rect x="10" y="10" width="40" height="40" fill="#0F172A" rx="6" />
        <Rect x="16" y="16" width="28" height="28" fill="#FFFFFF" rx="3" />
        <Rect x="22" y="22" width="16" height="16" fill="#0F172A" rx="2" />

        {/* Top-Right Position Detection Marker */}
        <Rect x="110" y="10" width="40" height="40" fill="#0F172A" rx="6" />
        <Rect x="116" y="16" width="28" height="28" fill="#FFFFFF" rx="3" />
        <Rect x="122" y="22" width="16" height="16" fill="#0F172A" rx="2" />

        {/* Bottom-Left Position Detection Marker */}
        <Rect x="10" y="110" width="40" height="40" fill="#0F172A" rx="6" />
        <Rect x="16" y="116" width="28" height="28" fill="#FFFFFF" rx="3" />
        <Rect x="22" y="122" width="16" height="16" fill="#0F172A" rx="2" />

        {/* Dense QR Data Dot Grid Matrix */}
        <Path
          d="
            M60,14 h8 v8 h-8 z M76,14 h8 v8 h-8 z M92,14 h8 v8 h-8 z
            M60,26 h8 v8 h-8 z M84,26 h8 v8 h-8 z
            M68,38 h8 v8 h-8 z M92,38 h8 v8 h-8 z
            M14,60 h8 v8 h-8 z M26,60 h8 v8 h-8 z M42,60 h8 v8 h-8 z M60,60 h8 v8 h-8 z M80,60 h8 v8 h-8 z M104,60 h8 v8 h-8 z M120,60 h8 v8 h-8 z M136,60 h8 v8 h-8 z
            M14,72 h8 v8 h-8 z M34,72 h8 v8 h-8 z M52,72 h8 v8 h-8 z M98,72 h8 v8 h-8 z M114,72 h8 v8 h-8 z M130,72 h8 v8 h-8 z
            M22,84 h8 v8 h-8 z M42,84 h8 v8 h-8 z M60,84 h8 v8 h-8 z M92,84 h8 v8 h-8 z M122,84 h8 v8 h-8 z M142,84 h8 v8 h-8 z
            M14,96 h8 v8 h-8 z M30,96 h8 v8 h-8 z M60,96 h8 v8 h-8 z M84,96 h8 v8 h-8 z M108,96 h8 v8 h-8 z M134,96 h8 v8 h-8 z
            M60,110 h8 v8 h-8 z M76,110 h8 v8 h-8 z M118,110 h8 v8 h-8 z M138,110 h8 v8 h-8 z
            M68,122 h8 v8 h-8 z M92,122 h8 v8 h-8 z M126,122 h8 v8 h-8 z
            M60,134 h8 v8 h-8 z M84,134 h8 v8 h-8 z M104,134 h8 v8 h-8 z M134,134 h8 v8 h-8 z
          "
          fill="#1E293B"
        />

        {/* Center WOMUP Brand Shield */}
        <Rect x="64" y="64" width="32" height="32" fill="#E11D48" rx="8" />
        <Rect x="67" y="67" width="26" height="26" fill="#FFFFFF" rx="6" />
        <Rect x="70" y="70" width="20" height="20" fill="#E11D48" rx="4" />
      </Svg>
      <View style={qrStyles.centerLetter}>
        <Text style={qrStyles.centerLetterText}>W</Text>
      </View>
    </View>
  );
};

const qrStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLetter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLetterText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
});

export const ShopDetailScreen: React.FC<ShopDetailScreenProps> = ({
  vendorId = '',
  initialVendor,
  customerCoords,
  customerAddress,
  onGoBack,
  onScanCounterQR,
}) => {
  const insets = useSafeAreaInsets();
  const [vendor, setVendor] = useState<LocalVendor | null>(initialVendor || null);
  const [isLoading, setIsLoading] = useState(!initialVendor && Boolean(vendorId));
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  // User Rating State (1 to 5 stars)
  const [userRating, setUserRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        if (vendorId) {
          const fetched = await LocalShopApi.getShopDetail(
            vendorId,
            customerCoords?.latitude,
            customerCoords?.longitude,
          );
          if (fetched) {
            setVendor(fetched);
          }
        }
      } catch (e) {
        console.warn('Failed to load shop details:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [vendorId, customerCoords?.latitude, customerCoords?.longitude]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Loading Shop Details...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={56} color="#94A3B8" />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12 }}>Shop Not Found</Text>
        <TouchableOpacity
          style={{ marginTop: 16, backgroundColor: '#E11D48', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
          onPress={onGoBack}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Back to Shops</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter transactions for this specific vendor (starts empty until genuine live payments occur)
  const vendorTransactions: LocalTransaction[] = [];

  // Generate standardized counter QR payload & code string
  const cleanId = (vendor.id || 'SHOP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const shopQrCodeText = `WOMUP-PAY-${cleanId}-001`;

  // Handle "Get Directions" via In-App Map Modal
  const handleGetDirections = () => {
    setIsMapModalVisible(true);
  };

  // Handle direct phone call
  const handleCallShop = () => {
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone.replace(/\s+/g, '')}`).catch(() => {
        Alert.alert('Shop Phone', `Contact: ${vendor.phone}`);
      });
    }
  };

  // Handle star rating feedback
  const handleRateShop = (stars: number) => {
    setUserRating(stars);
    setHasRated(true);
    Alert.alert(
      'Feedback Received ⭐',
      `Thank you for rating ${vendor.name} ${stars} out of 5 stars! Your review helps the local community.`,
      [{ text: 'Awesome' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header Bar (Back button, Title, Share/Menu action) */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onGoBack}
          style={styles.circleBackBtn}
          accessibilityLabel="Back to Shops"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {vendor.name}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            WOMUP Local Partner Shop
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              vendor.name,
              `• Address: ${vendor.address}\n• Phone: ${vendor.phone}\n• Hours: ${vendor.timings}\n• Cashback: ${vendor.coinPercentage}% Shopping Coins`,
              [{ text: 'OK' }]
            );
          }}
          style={styles.circleMenuBtn}
          accessibilityLabel="Shop Options"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Shop Banner & Profile Card */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: vendor.image }} style={styles.coverImage} />
          <View style={[styles.floatingCoinBadge, { backgroundColor: vendor.badgeColor || '#E11D48' }]}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.coinBadgeText}>{vendor.coinPercentage}% Shopping Coins</Text>
          </View>
        </View>

        {/* Shop Info Card */}
        <View style={styles.bioCard}>
          <View style={styles.vendorHeaderRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.shopName}>{vendor.name}</Text>
                {vendor.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#2563EB"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={15} color="#E11D48" style={{ marginRight: 4 }} />
                <Text style={styles.shopAddress}>{vendor.address}</Text>
              </View>
            </View>

            <View style={styles.ratingBox}>
              <Ionicons name="star" size={15} color="#F59E0B" />
              <Text style={styles.ratingText}>{vendor.rating}</Text>
              <Text style={styles.reviewCount}>({vendor.reviewCount})</Text>
            </View>
          </View>

          {/* Key Metrics: Distance, Timings, Phone */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="navigate-outline" size={15} color="#64748B" />
              <Text style={styles.metricText}>{vendor.distanceKm} km away</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={15} color="#64748B" />
              <Text style={styles.metricText}>{vendor.timings}</Text>
            </View>

            <View style={styles.metricDivider} />

            <TouchableOpacity
              style={styles.metricItem}
              onPress={handleCallShop}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={14} color="#10B981" />
              <Text style={[styles.metricText, styles.callText]}>{vendor.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Coin Offer Highlight Banner */}
        <View style={styles.coinOfferCard}>
          <View style={styles.coinOfferIconCircle}>
            <MaterialCommunityIcons name="diamond-stone" size={24} color="#9333EA" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.coinOfferTitle}>
              💎 EARN {vendor.coinPercentage}% SHOPPING COINS
            </Text>
            <Text style={styles.coinOfferSub}>
              Scan QR code at shop counter to pay your bill & earn instant coins into your wallet!
            </Text>
          </View>
        </View>

        {/* 4. In-Store Billing Call to Action Card */}
        <View style={styles.qrCardContainer}>
          <View style={styles.inStoreActionHeader}>
            <View style={styles.qrHeaderLeft}>
              <View style={[styles.qrHeaderDot, { backgroundColor: '#E11D48' }]} />
              <Text style={styles.qrHeaderTitle}>IN-STORE BILLING & CHECKOUT</Text>
            </View>
            <View style={styles.qrVerifiedTag}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={styles.qrVerifiedText}>VERIFIED PARTNER</Text>
            </View>
          </View>

          <View style={styles.counterStepBox}>
            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.stepText}>Ask shopkeeper for the counter QR code (or check printed standee)</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
              <Text style={styles.stepText}>Tap below to scan with your camera and enter bill amount</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
              <Text style={styles.stepText}>Choose Coins, Wallet, Cash, or UPI to earn instant cashback!</Text>
            </View>
          </View>

          {/* 5. Primary Action Button: SCAN & PAY AT COUNTER */}
          <TouchableOpacity
            style={styles.primaryScanBtn}
            activeOpacity={0.85}
            onPress={onScanCounterQR}
            accessibilityLabel="Scan and pay at counter"
          >
            <Ionicons name="qr-code-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryScanText}>SCAN & PAY AT COUNTER</Text>
          </TouchableOpacity>

          {/* 6. Secondary Action Button: GET DIRECTIONS */}
          <TouchableOpacity
            style={styles.secondaryDirectionsBtn}
            activeOpacity={0.85}
            onPress={handleGetDirections}
            accessibilityLabel="Get directions in Google Maps"
          >
            <Ionicons name="location" size={18} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryDirectionsText}>📍 GET STORE DIRECTIONS</Text>
          </TouchableOpacity>
        </View>

        {/* 7. Recent Transactions at this Shop */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>RECENT TRANSACTIONS AT THIS SHOP</Text>
          </View>

          {vendorTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {vendorTransactions.map((tx) => (
                <View key={tx.id} style={styles.txItem}>
                  <View style={styles.txLeft}>
                    <View style={styles.txIconCircle}>
                      <Ionicons name="checkmark" size={15} color="#10B981" />
                    </View>
                    <View>
                      <Text style={styles.txDate}>{tx.date}</Text>
                      <Text style={styles.txOrderNum}>{tx.orderNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>₹{tx.amount}</Text>
                    <Text style={styles.txCoinsEarned}>+{tx.coinsEarned} Coins ✅</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.txEmptyBox}>
              <View style={styles.txEmptyIcon}>
                <Ionicons name="pricetag-outline" size={24} color="#94A3B8" />
              </View>
              <Text style={styles.txEmptyTitle}>No Transactions Yet</Text>
              <Text style={styles.txEmptySubtitle}>
                Visit {vendor.name}, scan the counter QR to make your first payment, and earn{' '}
                {vendor.coinPercentage}% instant coins!
              </Text>
            </View>
          )}
        </View>

        {/* 8. Rating Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="star" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>RATE THIS SHOP</Text>
          </View>
          <Text style={styles.rateSubtitle}>
            How was your shopping experience at {vendor.name}? Tap stars to rate:
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starNum) => {
              const isFilled = starNum <= userRating;
              return (
                <TouchableOpacity
                  key={starNum}
                  activeOpacity={0.7}
                  onPress={() => handleRateShop(starNum)}
                  style={styles.starTouchItem}
                  accessibilityLabel={`Rate ${starNum} stars`}
                >
                  <Ionicons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={36}
                    color={isFilled ? '#F59E0B' : '#CBD5E1'}
                  />
                  <Text style={styles.starNumberText}>{starNum}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {hasRated && (
            <View style={styles.ratedThankYouBanner}>
              <Ionicons name="heart" size={14} color="#E11D48" style={{ marginRight: 6 }} />
              <Text style={styles.ratedThankYouText}>
                Thanks for your feedback! Your {userRating}-star rating was recorded.
              </Text>
            </View>
          )}
        </View>

        {/* Space at the bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* In-App Store Directions Map Modal */}
      {vendor && (
        <StoreDirectionMapModal
          visible={isMapModalVisible}
          onClose={() => setIsMapModalVisible(false)}
          storeName={vendor.name || vendor.storeName || 'Partner Store'}
          storeAddress={vendor.address}
          storeCoords={{
            latitude: vendor.latitude || (vendor.coordinates?.coordinates?.[1] ?? 23.0195),
            longitude: vendor.longitude || (vendor.coordinates?.coordinates?.[0] ?? 72.5180),
          }}
          customerCoords={customerCoords}
          customerAddress={customerAddress}
          distanceKm={vendor.distanceKm}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  circleBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleMenuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
    height: 190,
    backgroundColor: '#E2E8F0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  floatingCoinBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  coinBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  bioCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: -20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vendorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  shopName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  shopAddress: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewCount: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  callText: {
    color: '#059669',
    fontWeight: '700',
  },
  coinOfferCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  coinOfferIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinOfferTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7E22CE',
    letterSpacing: 0.2,
  },
  coinOfferSub: {
    fontSize: 11.5,
    color: '#6B21A8',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  qrCardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  inStoreActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  counterStepBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 16,
  },
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  qrHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  qrVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  qrVerifiedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
  },
  qrInstructions: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 10,
    lineHeight: 17,
  },
  qrCodeVisualBox: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codePillText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  primaryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryScanText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  secondaryDirectionsText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  rateSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  starTouchItem: {
    alignItems: 'center',
    padding: 4,
  },
  starNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  ratedThankYouBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  ratedThankYouText: {
    color: '#E11D48',
    fontSize: 11.5,
    fontWeight: '700',
  },
  transactionsList: {
    marginTop: 8,
    gap: 10,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  txDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  txOrderNum: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  txCoinsEarned: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 1,
  },
  txEmptyBox: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  txEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  txEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  txEmptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
});
