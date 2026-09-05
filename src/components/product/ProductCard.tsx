import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
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
  const { cart, addToCart, updateQuantity, setSelectedProduct, setActiveScreen } = useApp();

  const cartItem = cart.find((i) => i.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleCardPress = () => {
    setSelectedProduct(product);
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
              resizeMode="contain"
            />
          ) : (
            <View style={styles.iconCircle}>
              <Ionicons name="basket-outline" size={28} color={COLORS.purple} />
            </View>
          )}
          {product.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.horizontalContent}>
          <Text style={styles.brandText}>{product.brand}</Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.quantityLabel}>{product.quantityLabel}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>₹{product.sellingPrice}</Text>
            <Text style={styles.mrpText}>₹{product.mrp}</Text>
          </View>

          <CoinBadge coins={product.shoppingCoins} />
        </View>

        {/* Add CTA */}
        <View style={styles.actionContainer}>
          {quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => addToCart(product)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add</Text>
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
      {product.discountPercent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{product.discountPercent}% OFF</Text>
        </View>
      )}

      {/* Product Image */}
      <View style={styles.gridImageContainer}>
        {product.image || product.imageUrl ? (
          <Image
            source={product.image || { uri: product.imageUrl }}
            style={styles.gridProductImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.iconCircleLarge}>
            <Ionicons name="fast-food-outline" size={32} color={COLORS.purple} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.gridContent}>
        <Text style={styles.nameText} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.quantityLabel}>{product.quantityLabel}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.sellingPrice}>₹{product.sellingPrice}</Text>
          <Text style={styles.mrpText}>₹{product.mrp}</Text>
        </View>

        <View style={styles.coinBadgeContainer}>
          <CoinBadge coins={product.shoppingCoins} />
        </View>

        {/* Add or Stepper */}
        <View style={styles.gridActionRow}>
          {quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => addToCart(product)}
              style={styles.gridAddButton}
            >
              <Text style={styles.gridAddButtonText}>Add</Text>
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
    padding: SPACING.compact,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  gridImageContainer: {
    height: 105,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    padding: 4,
    overflow: 'hidden',
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
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  gridContent: {
    flex: 1,
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
    height: 72,
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
});
