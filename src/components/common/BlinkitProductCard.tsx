import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from './AppIcon';
import { BlinkitProduct } from '../../types';
import { useApp } from '../../context/AppContext';
import { resolveImageThumbnail } from '../../utils/imageUrl';

interface BlinkitProductCardProps {
  product: BlinkitProduct;
  variant?: 'grid' | 'horizontal' | 'wishlist';
  onPress?: () => void;
  style?: ViewStyle;
}

const formatRating = (val?: number): string => {
  if (val === undefined || val === null || isNaN(val)) return '4.8';
  return Number(val).toFixed(1);
};

const BlinkitProductCardComponent: React.FC<BlinkitProductCardProps> = ({
  product,
  variant = 'grid',
  onPress,
  style,
}) => {
  const {
    getBlinkitQty,
    updateBlinkitQty,
    setSelectedBlinkitProduct,
    setActiveScreen,
    isInWishlist,
    toggleWishlist,
    isServiceable,
    blinkitCart,
  } = useApp();
  const isWishlisted = isInWishlist(product.id);
  const [isLoading, setIsLoading] = useState(false);

  const variants = product.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id || null);

  // F-09 / B-10: Stable dependency to prevent effect firing on every parent render
  React.useEffect(() => {
    const vList = product.variants || [];
    const defV = vList.find((v) => v.isDefault) || vList[0];
    setSelectedVariantId(defV?.id || null);
  }, [product.id]);

  const activeVariant = variants.find((v) => v.id === selectedVariantId) || defaultVariant;
  const currentSellingPrice = activeVariant ? activeVariant.price : product.sellingPrice;
  const currentMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const currentPackSize = activeVariant ? activeVariant.label : product.packSize;

  const quantity = getBlinkitQty(product.id, activeVariant?.id);

  const handleAdd = () => {
    if (!isServiceable) {
      Alert.alert(
        'Delivery Unavailable',
        'Sorry, WOMART is not serviceable in your area. We are expanding soon!'
      );
      return;
    }
    const enrichedProd: BlinkitProduct = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      packSize: currentPackSize,
      selectedVariantId: activeVariant?.id,
    };
    updateBlinkitQty(enrichedProd, 1, activeVariant?.id);
  };

  const handleIncrement = () => {
    if (product.stock && quantity >= product.stock) return;
    const enrichedProd: BlinkitProduct = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      packSize: currentPackSize,
      selectedVariantId: activeVariant?.id,
    };
    updateBlinkitQty(enrichedProd, 1, activeVariant?.id);
  };

  const handleDecrement = () => {
    const enrichedProd: BlinkitProduct = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      packSize: currentPackSize,
      selectedVariantId: activeVariant?.id,
    };
    updateBlinkitQty(enrichedProd, -1, activeVariant?.id);
  };

  const handleCardPress = () => {
    const enrichedProd: BlinkitProduct = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      packSize: currentPackSize,
      selectedVariantId: activeVariant?.id,
    };
    if (onPress) {
      onPress();
    } else {
      setSelectedBlinkitProduct(enrichedProd);
      setActiveScreen('Blinkit_ProductDetail');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. WISHLIST VARIANT: Premium, Full-Width Horizontal Card
  // ─────────────────────────────────────────────────────────────
  if (variant === 'wishlist') {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleCardPress}
        style={styles.wishlistCardContainer}
      >
        {/* Left: Product Image Box */}
        <View style={styles.wishlistImageWrapper}>
          <Image
            source={{ uri: resolveImageThumbnail(product.imageUrl) }}
            style={styles.wishlistProductImage}
            resizeMode="cover"
          />
          {product.discountBadge && (
            <View style={styles.wishlistDiscountBadge}>
              <Text style={styles.wishlistDiscountBadgeText}>{product.discountBadge}</Text>
            </View>
          )}
        </View>

        {/* Right: Info & Actions */}
        <View style={styles.wishlistInfoWrapper}>
          {/* Top Meta Row: ETA + Rating + Heart button */}
          <View style={styles.wishlistTopRow}>
            <View style={styles.wishlistBadgesGroup}>
              <View style={styles.wishlistEtaBadge}>
                <AppIcon name="clock" size={12} color="#15803D" />
                <Text style={styles.wishlistEtaText}>{product.deliveryMinutes} mins</Text>
              </View>
              {product.rating ? (
                <View style={styles.wishlistRatingBadge}>
                  <AppIcon name="star" size={12} color="#D97706" />
                  <Text style={styles.wishlistRatingText}>{formatRating(product.rating)}</Text>
                </View>
              ) : null}
            </View>

            {/* Red Heart Toggle to Remove/Unlike */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                toggleWishlist(product);
              }}
              style={styles.wishlistHeartButton}
              accessibilityLabel="Remove from wishlist"
            >
              <AppIcon name="heart-filled" size={20} color="#E11D48" />
            </TouchableOpacity>
          </View>

          {/* Product Name */}
          <Text style={styles.wishlistTitleText} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Pack size + Urgency info */}
          <View style={styles.wishlistPackRow}>
            <Text style={styles.wishlistPackText}>{product.packSize || '1 unit'}</Text>
            {product.stockUrgency ? (
              <View style={styles.wishlistUrgencyPill}>
                <Text style={styles.wishlistUrgencyText}>{product.stockUrgency}</Text>
              </View>
            ) : null}
          </View>

          {/* Price + ADD Button Row */}
          <View style={styles.wishlistPriceRow}>
            <View style={styles.wishlistPriceCol}>
              <View style={styles.wishlistPriceAmounts}>
                <Text style={styles.wishlistSellingPrice}>₹{product.sellingPrice}</Text>
                {product.mrp > product.sellingPrice && (
                  <Text style={styles.wishlistMrpText}>₹{product.mrp}</Text>
                )}
              </View>
              {product.isPriceDrop && (
                <View style={styles.priceDropPill}>
                  <Text style={styles.priceDropPillText}>Price Drop</Text>
                </View>
              )}
            </View>

            {/* ADD / Quantity Stepper */}
            {quantity === 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAdd}
                disabled={isLoading || product.stock === 0 || !isServiceable}
                style={[
                  styles.wishlistAddBtn,
                  (product.stock === 0 || !isServiceable) && styles.disabledButton,
                ]}
                accessibilityLabel={`Add ${product.name} to cart`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#15803D" />
                ) : (
                  <Text
                    style={[
                      styles.wishlistAddBtnText,
                      (product.stock === 0 || !isServiceable) && styles.disabledButtonText,
                    ]}
                  >
                    {product.stock === 0 ? 'Out of Stock' : !isServiceable ? 'Not Serviceable' : 'ADD'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.wishlistStepper}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDecrement}
                  style={styles.stepperButton}
                  accessibilityLabel="Decrease quantity"
                >
                  <AppIcon name="minus" size={14} color="#15803D" />
                </TouchableOpacity>
                <Text style={styles.stepperQtyText}>{quantity}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleIncrement}
                  disabled={Boolean(product.stock && quantity >= product.stock)}
                  style={[
                    styles.stepperButton,
                    product.stock && quantity >= product.stock ? { opacity: 0.4 } : undefined,
                  ]}
                  accessibilityLabel="Increase quantity"
                >
                  <AppIcon name="plus" size={14} color="#15803D" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. GRID / HORIZONTAL VARIANT
  // ─────────────────────────────────────────────────────────────
  const isHorizontal = variant === 'horizontal';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleCardPress}
      style={[
        styles.cardContainer,
        isHorizontal ? styles.horizontalContainer : styles.gridContainer,
        style,
      ]}
    >
      {/* Product Image Box with Real Online Photo */}
      <View style={[styles.imageContainer, isHorizontal && styles.horizontalImageContainer]}>
        <Image
          source={{ uri: resolveImageThumbnail(product.imageUrl) }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {/* Wishlist Heart Top Right */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e: any) => {
            e?.stopPropagation?.();
            toggleWishlist(product);
          }}
          style={styles.wishlistButton}
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <AppIcon
            name={isWishlisted ? 'heart-filled' : 'heart'}
            size={16}
            color={isWishlisted ? '#E11D48' : COLORS.textMuted}
          />
        </TouchableOpacity>

        {/* Discount Badge Top Left */}
        {product.discountBadge && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{product.discountBadge}</Text>
          </View>
        )}

        {/* Carousel Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Product Meta & Info */}
      <View style={styles.contentContainer}>
        {/* Delivery ETA + Pack size */}
        <View style={styles.metaRow}>
          <View style={styles.etaBadge}>
            <AppIcon name="clock" size={12} color={COLORS.textMuted} />
            <Text style={styles.etaText}>{product.deliveryMinutes} mins</Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingBadge}>
            <AppIcon name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>{formatRating(product.rating)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[TYPOGRAPHY.bodySmBold, styles.titleText]} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Pack Size & Variant Selector */}
        {variants.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardVariantScroll}>
            {variants.map((v) => {
              const isSel = v.id === (activeVariant?.id || v.id);
              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.7}
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    setSelectedVariantId(v.id);
                  }}
                  style={[styles.cardVariantChip, isSel && styles.cardVariantChipActive]}
                >
                  <Text style={[styles.cardVariantChipText, isSel && styles.cardVariantChipTextActive]}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.packAndStockRow}>
            <Text style={styles.packSizeText}>{currentPackSize}</Text>
            {product.stockUrgency && (
              <View style={styles.urgencyPill}>
                <Text style={styles.urgencyText}>{product.stockUrgency}</Text>
              </View>
            )}
          </View>
        )}

        {/* Price Row + ADD Button */}
        <View style={styles.priceAndActionRow}>
          <View style={styles.priceCol}>
            <View style={styles.priceRow}>
              <Text style={TYPOGRAPHY.priceLg}>₹{currentSellingPrice}</Text>
              {currentMrp > currentSellingPrice && (
                <Text style={[TYPOGRAPHY.priceStrike, styles.mrpText]}>₹{currentMrp}</Text>
              )}
            </View>
            {product.isPriceDrop && (
              <View style={styles.priceDropPill}>
                <Text style={styles.priceDropPillText}>Price Drop</Text>
              </View>
            )}
          </View>

          {/* ADD / Quantity Stepper Button */}
          {quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAdd}
              disabled={isLoading || product.stock === 0 || !isServiceable}
              style={[
                styles.addButton,
                (product.stock === 0 || !isServiceable) && styles.disabledButton,
              ]}
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text
                  style={[
                    styles.addButtonText,
                    (product.stock === 0 || !isServiceable) && styles.disabledButtonText,
                  ]}
                >
                  {product.stock === 0 ? 'Out of Stock' : !isServiceable ? 'Not Serviceable' : 'ADD'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDecrement}
                style={styles.stepperButton}
                accessibilityLabel="Decrease quantity"
              >
                <AppIcon name="minus" size={14} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.stepperQtyText}>{quantity}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleIncrement}
                disabled={Boolean(product.stock && quantity >= product.stock)}
                style={[
                  styles.stepperButton,
                  product.stock && quantity >= product.stock ? { opacity: 0.4 } : undefined,
                ]}
                accessibilityLabel="Increase quantity"
              >
                <AppIcon name="plus" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ── GRID & HORIZONTAL STYLES ──
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 0,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gridContainer: {
    width: '100%',
  },
  horizontalContainer: {
    width: 160,
    marginRight: 12,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  horizontalImageContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EC4A9D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    zIndex: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(203, 213, 225, 0.8)',
  },
  activeDot: {
    backgroundColor: '#15803D',
    width: 8,
  },
  contentContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  titleText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 4,
  },
  packAndStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardVariantScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  cardVariantChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 4,
  },
  cardVariantChipActive: {
    borderColor: '#EC4A9D',
    backgroundColor: '#FCEAF5',
  },
  cardVariantChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#62677A',
  },
  cardVariantChipTextActive: {
    color: '#EC4A9D',
    fontWeight: '700',
  },
  packSizeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  urgencyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  priceAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 4,
  },
  priceCol: {
    flex: 1,
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  mrpText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  priceDropPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  priceDropPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  disabledButton: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  disabledButtonText: {
    color: '#94A3B8',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    minWidth: 70,
    justifyContent: 'space-between',
  },
  stepperButton: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    paddingHorizontal: 4,
  },

  // ── WISHLIST DEDICATED CARD STYLES ──
  wishlistCardContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  wishlistImageWrapper: {
    width: 105,
    height: 105,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wishlistProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistDiscountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#EC4A9D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wishlistDiscountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },
  wishlistInfoWrapper: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  wishlistTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wishlistBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wishlistEtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wishlistEtaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  wishlistRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wishlistRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  wishlistHeartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 19,
    marginTop: 3,
  },
  wishlistPackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  wishlistPackText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  wishlistUrgencyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  wishlistUrgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  wishlistPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  wishlistPriceCol: {
    justifyContent: 'center',
  },
  wishlistPriceAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  wishlistSellingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  wishlistMrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  wishlistAddBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#15803D',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
  },
  wishlistAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  wishlistStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 80,
    justifyContent: 'space-between',
  },
});

export const BlinkitProductCard = React.memo(BlinkitProductCardComponent);
