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
  const { cart, addToCart, updateQuantity, setSelectedProduct, setActiveScreen, getBlinkitQty } = useApp();

  const variants = product.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id || null);

  const activeVariant = variants.find((v) => v.id === selectedVariantId) || defaultVariant;
  const currentSellingPrice = activeVariant ? activeVariant.price : product.sellingPrice;
  const currentMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const currentLabel = activeVariant ? activeVariant.label : product.quantityLabel;
  const currentDiscount = currentMrp > currentSellingPrice
    ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100)
    : product.discountPercent;

  const cartItem = cart.find((i) => i.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : (getBlinkitQty ? getBlinkitQty(product.id) : 0);

  const handleAddToCart = () => {
    const enrichedProduct: Product = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      quantityLabel: currentLabel,
    };
    addToCart(enrichedProduct);
  };

  const handleCardPress = () => {
    const enrichedProduct: Product = {
      ...product,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      quantityLabel: currentLabel,
    };
    setSelectedProduct(enrichedProduct);
    if (onPress) {
      onPress();
    } else {
      setActiveScreen('C16_ProductDetails');
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
            <Image
              source={product.image || { uri: product.imageUrl }}
              style={styles.horizontalImage}
              resizeMode="cover"
            />
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
        </View>

        {/* Details */}
        <View style={styles.horizontalContent}>
          {product.brand ? <Text style={styles.brandText}>{product.brand}</Text> : null}
          <Text style={styles.nameText} numberOfLines={1}>
            {product.name}
          </Text>

          {/* Variant Selector Pills */}
          {variants.length > 1 ? (
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
          ) : (
            <Text style={styles.quantityLabel}>{currentLabel}</Text>
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
          {quantity === 0 ? (
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
              onIncrement={() => updateQuantity(product.id, 1)}
              onDecrement={() => updateQuantity(product.id, -1)}
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
          <Image
            source={product.image || { uri: product.imageUrl }}
            style={styles.gridProductImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.iconCircleLarge}>
            <Ionicons name="fast-food-outline" size={32} color={COLORS.purple} />
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
        ) : (
          <Text style={styles.quantityLabel}>{currentLabel}</Text>
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
          {quantity === 0 ? (
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
              onIncrement={() => updateQuantity(product.id, 1)}
              onDecrement={() => updateQuantity(product.id, -1)}
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
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: RADIUS.card,
    borderTopRightRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    padding: 0,
    overflow: 'hidden',
  },
  gridProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 0,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
});
