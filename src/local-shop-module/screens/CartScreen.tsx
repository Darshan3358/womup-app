import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalCartItem } from '../types/localShop.types';

interface CartScreenProps {
  initialCart?: LocalCartItem[];
  onGoBack: () => void;
  onOrderSuccess: (orderId: string, coinsEarned: number) => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  initialCart = [],
  onGoBack,
  onOrderSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<LocalCartItem[]>(initialCart);
  const [selectedPayment, setSelectedPayment] = useState<'UPI' | 'Wallet' | 'Card' | 'Cash'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdateQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index] = { ...copy[index], quantity: newQty };
      }
      return copy;
    });
  };

  const itemTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const platformFee = cartItems.length > 0 ? 5 : 0;
  const discount = Math.round(itemTotal * 0.05); // 5% instant discount
  const finalPayable = Math.max(0, itemTotal - discount + platformFee);

  // Highest coin percentage from cart or default 15%
  const coinPercentage = cartItems.length > 0 ? cartItems[0].coinPercentage : 15;
  const estimatedCoins = Math.round((finalPayable * coinPercentage) / 100);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items from the local store first.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const generatedOrderId = `WMP-LOCAL-${Math.floor(100000 + Math.random() * 900000)}`;
      onOrderSuccess(generatedOrderId, estimatedCoins);
    }, 1200);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart & Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Vendor Header Tag */}
        {cartItems.length > 0 && (
          <View style={styles.vendorHeader}>
            <View style={styles.vendorTagLeft}>
              <Ionicons name="storefront-outline" size={18} color="#E11D48" />
              <Text style={styles.vendorName}>{cartItems[0].vendorName}</Text>
            </View>
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>{coinPercentage}% Shopping Coins</Text>
            </View>
          </View>
        )}

        {/* Empty state */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={72} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>Add fresh items from nearby shops to earn shopping coins!</Text>
            <TouchableOpacity style={styles.continueShopBtn} onPress={onGoBack} activeOpacity={0.85}>
              <Text style={styles.continueShopText}>Explore Local Shops</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Items in Cart ({cartItems.length})</Text>

              {cartItems.map((item, idx) => (
                <View key={item.product.id} style={styles.itemRow}>
                  <Image source={{ uri: item.product.image }} style={styles.itemImage} />

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.itemUnit}>{item.product.unit}</Text>
                    <Text style={styles.itemPrice}>₹{item.product.price}</Text>
                  </View>

                  {/* Qty Counter */}
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQty(idx, -1)}
                    >
                      <Ionicons name="remove" size={14} color="#E11D48" />
                    </TouchableOpacity>
                    <Text style={styles.qtyNumber}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQty(idx, 1)}
                    >
                      <Ionicons name="add" size={14} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Bill Details */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Bill Details</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{itemTotal}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Store Discount (5%)</Text>
                <Text style={[styles.billValue, { color: '#059669' }]}>-₹{discount}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Handling & Platform Fee</Text>
                <Text style={styles.billValue}>₹{platformFee}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.billRowTotal}>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalValue}>₹{finalPayable}</Text>
              </View>

              {/* Estimated Coins to Earn banner */}
              <View style={styles.coinIncentiveCard}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.coinIncentiveTitle}>
                    You will earn {estimatedCoins} Shopping Coins!
                  </Text>
                  <Text style={styles.coinIncentiveSub}>
                    Equivalent to ₹{estimatedCoins} cash discount on your next visit.
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Options */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Select Payment Option</Text>

              {[
                { id: 'UPI', label: 'UPI (GPay, PhonePe, Paytm)', icon: 'phone-portrait-outline', badge: 'Instant' },
                { id: 'Wallet', label: 'WOMUP Coin Wallet', icon: 'wallet-outline', badge: '2,000 Coins' },
                { id: 'Card', label: 'Credit / Debit Card', icon: 'card-outline' },
                { id: 'Cash', label: 'Pay at Store Counter', icon: 'cash-outline' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.paymentOption,
                    selectedPayment === opt.id && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setSelectedPayment(opt.id as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentLeft}>
                    <Ionicons
                      name={opt.icon as any}
                      size={20}
                      color={selectedPayment === opt.id ? '#E11D48' : '#64748B'}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.paymentLabel,
                        selectedPayment === opt.id && styles.paymentLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {opt.badge && (
                      <View style={styles.payBadge}>
                        <Text style={styles.payBadgeText}>{opt.badge}</Text>
                      </View>
                    )}
                    <Ionicons
                      name={selectedPayment === opt.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selectedPayment === opt.id ? '#E11D48' : '#CBD5E1'}
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Pay Button */}
      {cartItems.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomTotal}>₹{finalPayable}</Text>
            <Text style={styles.bottomCoinsEarned}>+{estimatedCoins} Coins Reward</Text>
          </View>

          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={handlePlaceOrder}
            activeOpacity={0.85}
            disabled={isProcessing}
          >
            <Text style={styles.payNowText}>
              {isProcessing ? 'Processing...' : 'Place Order & Pay'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 14,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vendorTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 6,
  },
  coinBadge: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  coinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DB2777',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 6,
    lineHeight: 18,
  },
  continueShopBtn: {
    marginTop: 20,
    backgroundColor: '#E11D48',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  continueShopText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemUnit: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    paddingHorizontal: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E11D48',
  },
  coinIncentiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coinIncentiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  coinIncentiveSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: '#FDA4AF',
    backgroundColor: '#FFF1F2',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  paymentLabelSelected: {
    color: '#E11D48',
    fontWeight: '700',
  },
  payBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  payBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  bottomCoinsEarned: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  payNowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
