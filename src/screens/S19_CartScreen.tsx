import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { QuantityStepper } from '../components/product/QuantityStepper';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S19_CartScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    cart,
    updateQuantity,
    cartSummary,
    appliedCoins,
    setActiveScreen,
    goBack,
  } = useApp();

  if (cart.length === 0) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <Header title="My Cart" onBack={goBack} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={54} color={COLORS.hotPink} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Explore everyday essentials and add items to your cart</Text>
          <GradientButton
            title="Start Shopping"
            onPress={() => setActiveScreen('Blinkit_Home')}
            style={styles.startShoppingButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="My Cart"
        subtitle={`${cart.length} Items`}
        onBack={goBack}
      />

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cart Item Cards matching wireframe */}
        <View style={styles.itemsList}>
          {cart.map((item) => (
            <View key={item.product.id} style={styles.cartItemRow}>
              <View style={styles.itemImageWrapper}>
                {item.product.image || item.product.imageUrl ? (
                  <Image
                    source={item.product.image || { uri: item.product.imageUrl }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.itemIconCircle}>
                    <Ionicons name="basket-outline" size={24} color={COLORS.purple} />
                  </View>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name} {item.product.quantityLabel}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>₹{item.product.sellingPrice}</Text>
                  {item.product.mrp > item.product.sellingPrice && (
                    <Text style={styles.itemMrp}>₹{item.product.mrp}</Text>
                  )}
                </View>
              </View>

              <QuantityStepper
                quantity={item.quantity}
                onIncrement={() => updateQuantity(item.product.id, 1)}
                onDecrement={() => updateQuantity(item.product.id, -1)}
              />
            </View>
          ))}
        </View>

        {/* View Coupons & Offers Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.couponCard}
        >
          <View style={styles.couponLeft}>
            <Ionicons name="pricetag" size={20} color={COLORS.hotPink} />
            <Text style={styles.couponText}>View Coupons & Offers</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Shopping Coin Redemption Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveScreen('C21_ApplyShoppingCoin')}
          style={styles.coinBanner}
        >
          <View style={styles.coinLeft}>
            <Ionicons name="ribbon" size={20} color={COLORS.purple} />
            <View>
              <Text style={styles.coinTitle}>Shopping Coin Benefit</Text>
              <Text style={styles.coinSubtitle}>
                {appliedCoins > 0 ? `${appliedCoins} SC applied (-₹${appliedCoins})` : 'Use available 2,000 SC'}
              </Text>
            </View>
          </View>
          <Text style={styles.coinChangeText}>{appliedCoins > 0 ? 'Edit' : 'Apply'}</Text>
        </TouchableOpacity>

        {/* Bill Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>Bill Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartSummary.subtotalSelling}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, styles.discountGreen]}>
              -₹{cartSummary.couponDiscount}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shopping Coin</Text>
            <Text style={[styles.summaryValue, styles.discountGreen]}>
              -₹{cartSummary.shoppingCoinDiscount}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, styles.deliveryFree]}>FREE</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.savingsText}>You save ₹{cartSummary.totalSavings}</Text>
            </View>
            <Text style={styles.totalValue}>₹{cartSummary.totalPayable}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomTotal}>₹{cartSummary.totalPayable}</Text>
          <Text style={styles.bottomItemsCount}>{cart.length} Items</Text>
        </View>

        <GradientButton
          title="Proceed to Checkout"
          onPress={() => setActiveScreen('C20_Checkout')}
          style={styles.checkoutButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
    minHeight: 0,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  itemsList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBackground,
  },
  itemImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemMrp: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F7',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FCE1F5',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  coinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3EFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E6F9',
  },
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  coinSubtitle: {
    fontSize: 12,
    color: COLORS.purple,
    marginTop: 1,
  },
  coinChangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.purple,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.compact,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  discountGreen: {
    color: COLORS.success,
  },
  deliveryFree: {
    color: COLORS.success,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.compact,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  savingsText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomPriceInfo: {
    marginRight: SPACING.md,
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bottomItemsCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  checkoutButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  startShoppingButton: {
    width: '80%',
  },
});
