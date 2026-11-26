import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { CoinBadge } from '../common/CoinBadge';
import { QuantityStepper } from './QuantityStepper';
import { useApp } from '../../context/AppContext';
import { resolveProductImageSource } from '../../utils/imageUrl';
import { Skeleton } from '../common/Skeleton';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'horizontal' | 'compact';
  onPress?: () => void;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  onPress,
  style,
}) => {
  const { cart, addToCart, updateQuantity, setSelectedProduct, setSelectedBlinkitProduct, setActiveScreen, getBlinkitQty } = useApp();
  const [imgLoaded, setImgLoaded] = useState(false);

  const variants = product.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id || null);

  const activeVariant = variants.find((v) => v.id === selectedVariantId) || defaultVariant;
  const currentSellingPrice = activeVariant ? activeVariant.price : product.sellingPrice;
  const currentMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const currentLabel = activeVariant ? activeVariant.label : product.quantityLabel;
  const activeStock =
    activeVariant && typeof activeVariant.stock === 'number'
      ? Math.max(0, activeVariant.stock)
      : typeof product.stock === 'number'
      ? Math.max(0, product.stock)
      : 100;
  const isOutOfStock = activeStock === 0;
  const isCriticalStock = activeStock > 0 && activeStock <= 5;
  const activeUrgency =
    activeStock > 0 && activeStock <= 5
      ? `Hurry! Only ${activeStock} left`
      : activeStock > 5 && activeStock < 10
      ? `Only ${activeStock} left`
      : undefined;
  const currentDiscount = currentMrp > currentSellingPrice
    ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100)
    : product.discountPercent;

  const quantity = getBlinkitQty ? getBlinkitQty(product.id, activeVariant?.id) : 0;

  const handleAddToCart = () => {
    if (activeStock <= 0) return;
    const enrichedProduct: Product = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      quantityLabel: currentLabel,
      stock: activeStock,
      selectedVariantId: activeVariant?.id,
    };
    addToCart(enrichedProduct, activeVariant?.id);
  };

  const handleCardPress = () => {
    const enrichedProduct: Product = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      quantityLabel: currentLabel,
    };
    setSelectedProduct(enrichedProduct);
    if (setSelectedBlinkitProduct) {
      setSelectedBlinkitProduct({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.categoryName || product.categoryId || '',
        imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : (typeof product.image === 'string' ? product.image : ''),
        packSize: currentLabel,
        mrp: currentMrp,
        sellingPrice: currentSellingPrice,
        discountBadge: currentDiscount > 0 ? `${currentDiscount}% OFF` : undefined,
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount || 0,
        deliveryMinutes: product.deliveryMinutes,
        description: product.description,
        variants: variants.map((v) => ({
          id: v.id,
          label: v.label,
          price: v.price,
          mrp: v.mrp,
          discountPercent: v.discountPercent,
          stock: v.stock,
          isAvailable: v.isAvailable,
          isDefault: v.isDefault,
        })),
        selectedVariantId: activeVariant?.id,
      });
    }
    if (onPress) {
      onPress();
    } else {
      setActiveScreen('Blinkit_ProductDetail');
    }
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCardPress}
        style={[styles.horizontalCard, style]}
      >
        {/* Visual Product Image Container */}
        <View style={styles.horizontalImageContainer}>
          {product.image || product.imageUrl ? (
            <>
              {!imgLoaded && (
                <View style={StyleSheet.absoluteFill}>
                  <Skeleton width="100%" height="100%" borderRadius={8} />
                </View>
              )}
              <Image
                source={resolveProductImageSource(product.imageUrl || product.image, product.name, (product as any).slug)}
                style={[
                  styles.horizontalImage,
                  isOutOfStock && { opacity: 0.45 },
                  !imgLoaded && { opacity: 0 },
                ]}
                resizeMode="cover"
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <View style={styles.iconCircle}>
              <Ionicons name="basket-outline" size={28} color={COLORS.purple} />
            </View>
          )}
          {currentDiscount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{currentDiscount}% OFF</Text>
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.oosOverlay}>
              <View style={styles.oosOverlayBadge}>
                <Text style={styles.oosOverlayText}>OUT OF STOCK</Text>
              </View>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.horizontalContent}>
          {product.brand ? <Text style={styles.brandText}>{product.brand}</Text> : null}
          <Text style={styles.nameText} numberOfLines={1}>
            {product.name}
          </Text>

          {/* Variant Selector Pills */}
          {variants.length > 1 ? (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantScrollContent}
                style={styles.variantScrollView}
              >
                {variants.map((v) => {
                  const isSelected = v.id === activeVariant?.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedVariantId(v.id);
                      }}
                      style={[
                        styles.variantPill,
                        isSelected && styles.variantPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantPillText,
                          isSelected && styles.variantPillTextActive,
                        ]}
                      >
                        {v.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {activeUrgency && (
                <View style={[styles.urgencyPill, isCriticalStock && styles.urgencyPillCritical, { marginBottom: 2 }]}>
                  <Text style={[styles.urgencyText, isCriticalStock && styles.urgencyTextCritical]}>
                    {activeUrgency}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.packAndUrgencyRow}>
              <Text style={styles.quantityLabel}>{currentLabel}</Text>
              {activeUrgency && (
                <View style={[styles.urgencyPill, isCriticalStock && styles.urgencyPillCritical]}>
                  <Text style={[styles.urgencyText, isCriticalStock && styles.urgencyTextCritical]}>
                    {activeUrgency}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>₹{currentSellingPrice}</Text>
            {currentMrp > currentSellingPrice && (
              <Text style={styles.mrpText}>₹{currentMrp}</Text>
            )}
          </View>

          <CoinBadge coins={product.shoppingCoins} />
        </View>

        {/* Add CTA */}
        <View style={styles.actionContainer}>
          {activeStock === 0 ? (
            <View style={[styles.addButton, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
              <Text style={[styles.addButtonText, { color: '#64748B', fontSize: 10 }]}>Out</Text>
            </View>
          ) : quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => updateQuantity(product.id, 1, activeVariant?.id)}
              onDecrement={() => updateQuantity(product.id, -1, activeVariant?.id)}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Grid / default variant
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleCardPress}
      style={[styles.gridCard, style]}
    >
      {/* Discount Badge */}
      {currentDiscount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{currentDiscount}% OFF</Text>
        </View>
      )}

      {/* Product Image */}
      <View style={styles.gridImageContainer}>
        {product.image || product.imageUrl ? (
          <>
            {!imgLoaded && (
              <View style={StyleSheet.absoluteFill}>
                <Skeleton width="100%" height="100%" borderRadius={8} />
              </View>
            )}
            <Image
              source={resolveProductImageSource(product.imageUrl || product.image, product.name, (product as any).slug)}
              style={[
                styles.gridProductImage,
                isOutOfStock && { opacity: 0.45 },
                !imgLoaded && { opacity: 0 },
              ]}
              resizeMode="cover"
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <View style={styles.iconCircleLarge}>
            <Ionicons name="fast-food-outline" size={32} color={COLORS.purple} />
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.oosOverlay}>
            <View style={styles.oosOverlayBadge}>
              <Text style={styles.oosOverlayText}>OUT OF STOCK</Text>
            </View>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.gridContent}>
        {product.brand ? <Text style={styles.brandText}>{product.brand}</Text> : null}
        <Text style={styles.nameText} numberOfLines={1}>
          {product.name}
        </Text>

        {/* Variant Selector Pills */}
        {variants.length > 1 ? (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.variantScrollContent}
              style={styles.variantScrollView}
            >
              {variants.map((v) => {
                const isSelected = v.id === activeVariant?.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedVariantId(v.id);
                    }}
                    style={[
                      styles.variantPill,
                      isSelected && styles.variantPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.variantPillText,
                        isSelected && styles.variantPillTextActive,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {activeUrgency && (
              <View style={[styles.urgencyPill, isCriticalStock && styles.urgencyPillCritical, { marginBottom: 2 }]}>
                <Text style={[styles.urgencyText, isCriticalStock && styles.urgencyTextCritical]}>
                  {activeUrgency}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.packAndUrgencyRow}>
            <Text style={styles.quantityLabel}>{currentLabel}</Text>
            {activeUrgency && (
              <View style={[styles.urgencyPill, isCriticalStock && styles.urgencyPillCritical]}>
                <Text style={[styles.urgencyText, isCriticalStock && styles.urgencyTextCritical]}>
                  {activeUrgency}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.sellingPrice}>₹{currentSellingPrice}</Text>
          {currentMrp > currentSellingPrice && (
            <Text style={styles.mrpText}>₹{currentMrp}</Text>
          )}
        </View>

        <View style={styles.coinBadgeContainer}>
          <CoinBadge coins={product.shoppingCoins} />
        </View>

        {/* Add or Stepper */}
        <View style={styles.gridActionRow}>
          {activeStock === 0 ? (
            <View style={[styles.gridAddButton, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
              <Text style={[styles.gridAddButtonText, { color: '#64748B', fontSize: 11 }]}>Out of Stock</Text>
            </View>
          ) : quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              style={styles.gridAddButton}
            >
              <Text style={styles.gridAddButtonText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => updateQuantity(product.id, 1, activeVariant?.id)}
              onDecrement={() => updateQuantity(product.id, -1, activeVariant?.id)}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 0,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gridProductImage: {
    width: '100%',
    height: '100%',
  },
  iconCircleLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  gridContent: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  brandText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quantityLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  sellingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  mrpText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  coinBadgeContainer: {
    marginBottom: 6,
  },
  gridActionRow: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  gridAddButton: {
    borderColor: COLORS.hotPink,
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  gridAddButtonText: {
    color: COLORS.hotPink,
    fontSize: 12,
    fontWeight: '700',
  },

  // Horizontal Card styles
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.compact,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  horizontalImageContainer: {
    width: 72,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 4,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalContent: {
    flex: 1,
    marginLeft: SPACING.compact,
    justifyContent: 'center',
  },
  actionContainer: {
    marginLeft: SPACING.sm,
    alignItems: 'flex-end',
  },
  addButton: {
    borderColor: COLORS.hotPink,
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: COLORS.hotPink,
    fontSize: 13,
    fontWeight: '700',
  },
  variantScrollView: {
    marginVertical: 4,
    maxHeight: 28,
  },
  variantScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  variantPill: {
    backgroundColor: '#F1F3F8',
    borderColor: '#E2E5EE',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  variantPillActive: {
    backgroundColor: '#FCEAF5',
    borderColor: '#EC4A9D',
  },
  variantPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#62677A',
  },
  variantPillTextActive: {
    color: '#EC4A9D',
    fontWeight: '700',
  },
  packAndUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 2,
  },
  urgencyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  urgencyPillCritical: {
    backgroundColor: '#FEE2E2',
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  urgencyTextCritical: {
    color: '#DC2626',
  },
  oosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  oosOverlayBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  oosOverlayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
