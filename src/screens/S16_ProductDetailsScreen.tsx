import React, { useState } from 'react';
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
import { CoinBadge } from '../components/common/CoinBadge';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S16_ProductDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { selectedProduct, addToCart, setActiveScreen, goBack } = useApp();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const product = selectedProduct;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product);
    setActiveScreen('C19_Cart');
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title={product.brand}
        onBack={goBack}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionIcon}>
              <Ionicons name="share-social-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsWishlisted(!isWishlisted)}
              style={styles.actionIcon}
            >
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={22}
                color={isWishlisted ? COLORS.hotPink : COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Large Image Showcase */}
        <View style={styles.imageShowcase}>
          {product.image || product.imageUrl ? (
            <Image
              source={product.image || { uri: product.imageUrl }}
              style={styles.showcaseProductImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconCircleLarge}>
              <Ionicons name="basket" size={72} color={COLORS.purple} />
            </View>
          )}
          {product.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Title & Brand */}
        <View style={styles.infoSection}>
          <Text style={styles.brandName}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name} {product.quantityLabel}</Text>

          {/* Rating & Stock row */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F1B562" />
              <Text style={styles.ratingText}>{product.rating} ({product.reviewCount})</Text>
            </View>
            <View style={styles.stockBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.stockText}>In Stock</Text>
            </View>
          </View>

          {/* Price & Coins */}
          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>₹{product.sellingPrice}</Text>
            <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>
            <View style={styles.savingsPill}>
              <Text style={styles.savingsText}>Save ₹{product.mrp - product.sellingPrice}</Text>
            </View>
          </View>

          <View style={styles.coinBadgeWrapper}>
            <CoinBadge coins={product.shoppingCoins} size="md" />
            <Text style={styles.coinHintText}>Earn {product.shoppingCoins} SC on purchase</Text>
          </View>

          {/* Delivery ETA Card */}
          <View style={styles.etaCard}>
            <Ionicons name="flash-outline" size={20} color={COLORS.hotPink} />
            <View style={styles.etaTextContainer}>
              <Text style={styles.etaTitle}>Delivery in {product.deliveryMinutes} mins</Text>
              <Text style={styles.etaSubtitle}>Shipment from nearest Womup dark store</Text>
            </View>
          </View>

          {/* Product Description */}
          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>

          {/* Specifications */}
          {product.specifications && (
            <>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsTable}>
                {Object.entries(product.specifications).map(([key, value], idx) => (
                  <View key={key} style={[styles.specRow, idx % 2 === 0 && styles.specRowEven]}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddToCart}
          style={styles.cartButton}
        >
          <Ionicons
            name={added ? 'checkmark' : 'cart-outline'}
            size={18}
            color={COLORS.navy}
          />
          <Text style={styles.cartButtonText}>
            {added ? 'Added!' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>

        <GradientButton
          title="Buy Now"
          onPress={handleBuyNow}
          style={styles.buyButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 2,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageShowcase: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: 'hidden',
  },
  showcaseProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconCircleLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
    padding: SPACING.md,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 4,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B37D28',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  sellingPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  mrpText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  savingsPill: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  coinBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: SPACING.md,
  },
  coinHintText: {
    fontSize: 12,
    color: COLORS.purple,
    fontWeight: '500',
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F9',
    borderRadius: RADIUS.card,
    padding: SPACING.compact,
    gap: 12,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FCE1F5',
  },
  etaTextContainer: {
    flex: 1,
  },
  etaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  etaSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
  specsTable: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  specRowEven: {
    backgroundColor: COLORS.cardBackground,
  },
  specKey: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    gap: 6,
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  buyButton: {
    flex: 1.2,
  },
});
