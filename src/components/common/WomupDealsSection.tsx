import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { BlinkitProduct } from '../../types';
import { useApp } from '../../context/AppContext';

interface WomupDealsSectionProps {
  products: BlinkitProduct[];
  onOpenProduct: (product: BlinkitProduct) => void;
  onViewAll?: () => void;
}

export const WomupDealsSection: React.FC<WomupDealsSectionProps> = ({
  products,
  onOpenProduct,
  onViewAll,
}) => {
  const { width } = useWindowDimensions();
  const { getBlinkitQty, updateBlinkitQty, isInWishlist, toggleWishlist } = useApp();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const isSmall = width < 500;
  // Dynamically calculate card width to show 4 cards on standard mobile screens (e.g. 412px Pixel 9 / iPhone)
  // and 4-5 cards on tablet / desktop viewports
  let targetVisibleCount = 5.2;
  let cardWidth = 88;

  if (width >= 1200) {
    targetVisibleCount = 5.2; // 5 full cards + 1 peeking
    cardWidth = Math.floor((Math.min(width, 1440) - 24 - 50) / targetVisibleCount);
  } else if (width >= 900) {
    targetVisibleCount = 4.6; // 4-5 cards visible
    cardWidth = Math.floor((width - 24 - 40) / targetVisibleCount);
  } else if (width >= 680) {
    targetVisibleCount = 4.2; // 4 cards + peeking
    cardWidth = Math.floor((width - 24 - 40) / targetVisibleCount);
  } else if (width >= 375) {
    // Exact Pixel 9 (412px) / iPhone 14/15/16 (390-430px) target: 4 cards visible!
    targetVisibleCount = 4.0;
    cardWidth = Math.max(82, Math.floor((width - 32 - 30) / 4)); // ~88px on 412px screen
  } else {
    // Ultra small screens (< 375px e.g. iPhone SE 320-360px)
    targetVisibleCount = 3.2;
    cardWidth = Math.max(78, Math.floor((width - 24 - 20) / 3.2));
  }

  const isCompactCard = cardWidth <= 110;

  const scrollRef = React.useRef<ScrollView>(null);
  const [currentScrollX, setCurrentScrollX] = useState(0);

  const handleScrollStep = (direction: 'left' | 'right') => {
    const step = cardWidth * 3 + 30;
    const nextX = direction === 'left' ? Math.max(0, currentScrollX - step) : currentScrollX + step;
    scrollRef.current?.scrollTo({ x: nextX, animated: true });
    setCurrentScrollX(nextX);
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Image
            source={require('../../../assets/pink_fire.png')}
            style={[styles.pinkFireIcon, isSmall && { width: 20, height: 24 }]}
            resizeMode="contain"
          />
          <Text style={[styles.sectionTitle, isSmall && { fontSize: 20 }]}>Deals of the Day</Text>
        </View>

        <View style={styles.headerActionsWrap}>
          {!isSmall && products.length > 4 && (
            <View style={styles.navArrowsGroup}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleScrollStep('left')}
                style={styles.navArrowBtn}
                accessibilityLabel="Previous deals"
              >
                <Ionicons name="chevron-back" size={16} color="#101A4D" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleScrollStep('right')}
                style={styles.navArrowBtn}
                accessibilityLabel="Next deals"
              >
                <Ionicons name="chevron-forward" size={16} color="#101A4D" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.8} onPress={onViewAll} style={styles.viewAllRow}>
            <Text style={[styles.viewAllText, isSmall && { fontSize: 12 }]}>View All →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => setCurrentScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollRail, { paddingRight: 16, gap: 10 }]}
        style={{ width: '100%', maxWidth: '100%' }}
      >
        {products.map((item) => {
          // Resolve variants list (250g, 500g, 1kg, 2kg, etc.)
          const itemVariants = item.variants && item.variants.length > 0 ? item.variants : [];
          const defaultVariant = itemVariants.find((v) => v.isDefault) || itemVariants[0];
          const selectedVariantId = selectedVariants[item.id] || defaultVariant?.id || null;
          const activeVariant = itemVariants.find((v) => v.id === selectedVariantId) || defaultVariant;

          const currentSellingPrice = activeVariant ? activeVariant.price : item.sellingPrice;
          const currentMrp = activeVariant ? activeVariant.mrp : item.mrp;
          const currentPackSize = activeVariant ? activeVariant.label : item.packSize;
          const discountPercent =
            currentMrp > currentSellingPrice
              ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100)
              : 12;

          const isWishlisted = isInWishlist(item.id);
          const quantity = getBlinkitQty(item.id);

          const handleAddToCart = () => {
            const enrichedProduct: BlinkitProduct = {
              ...item,
              sellingPrice: currentSellingPrice,
              mrp: currentMrp,
              packSize: currentPackSize,
            };
            updateBlinkitQty(enrichedProduct, 1);
          };

          const handleUpdateQty = (delta: number) => {
            const enrichedProduct: BlinkitProduct = {
              ...item,
              sellingPrice: currentSellingPrice,
              mrp: currentMrp,
              packSize: currentPackSize,
            };
            updateBlinkitQty(enrichedProduct, delta);
          };

          return (
            <View
              key={item.id}
              style={[
                styles.productCard,
                { width: cardWidth },
                isCompactCard && { padding: 6, borderRadius: 10 },
              ]}
            >
              {/* Row 1: Discount Badge + Wishlist Heart */}
              <View style={[styles.discountBadge, isCompactCard && { top: 4, left: 4, paddingHorizontal: 3, paddingVertical: 1 }]}>
                <Text style={[styles.discountText, isCompactCard && { fontSize: 7.5 }]}>
                  {discountPercent}% OFF
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleWishlist(item)}
                style={[styles.wishlistButton, isCompactCard && { top: 4, right: 4, width: 20, height: 20, borderRadius: 10 }]}
                accessibilityLabel="Wishlist"
              >
                <Ionicons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={isCompactCard ? 11 : 15}
                  color={isWishlisted ? COLORS.hotPink : '#9296A7'}
                />
              </TouchableOpacity>

              {/* Row 2: Product Image */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onOpenProduct({ ...item, sellingPrice: currentSellingPrice, mrp: currentMrp, packSize: currentPackSize })}
                style={[styles.imageWrapper, isCompactCard && { height: 72, marginBottom: 5 }]}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Row 3: Product Name */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onOpenProduct({ ...item, sellingPrice: currentSellingPrice, mrp: currentMrp, packSize: currentPackSize })}
              >
                <Text
                  style={[styles.productName, isCompactCard && { fontSize: 10.5, lineHeight: 13, minHeight: 26 }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>

              {/* Row 4: Rating (+ Delivery Time on wider screens) */}
              <View style={[styles.ratingRow, isCompactCard && { marginTop: 1, marginBottom: 3, gap: 2 }]}>
                <Ionicons name="star" size={isCompactCard ? 9 : 12} color="#F59E0B" />
                <Text style={[styles.ratingText, isCompactCard && { fontSize: 8.5 }]}>
                  {item.rating || 4.8}
                </Text>
                {!isCompactCard && (
                  <>
                    <Text style={styles.etaDotText}>•</Text>
                    <Text style={styles.etaMinutesText}>
                      {item.deliveryMinutes || 9} mins
                    </Text>
                  </>
                )}
              </View>

              {/* Row 5: ALL Variant Pills (e.g. 250g | 500g | 1kg | 2kg) - Kept fully selectable! */}
              {itemVariants.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.variantScrollRail, isCompactCard && { gap: 3, paddingRight: 4 }]}
                  style={[styles.variantScrollView, isCompactCard && { marginVertical: 3, maxHeight: 22 }]}
                >
                  {itemVariants.map((v) => {
                    const isSelected = v.id === (activeVariant?.id || v.id);
                    return (
                      <TouchableOpacity
                        key={v.id}
                        activeOpacity={0.7}
                        onPress={() => setSelectedVariants({ ...selectedVariants, [item.id]: v.id })}
                        style={[
                          styles.variantPill,
                          isCompactCard && { paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 4 },
                          isSelected && styles.variantPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.variantPillText,
                            isCompactCard && { fontSize: 8 },
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
                <View style={[styles.packSizeRow, isCompactCard && { marginVertical: 3, minHeight: 18 }]}>
                  <Text style={[styles.packSizeOnlyText, isCompactCard && { fontSize: 8.5 }]}>{currentPackSize}</Text>
                </View>
              )}

              {/* Row 6: Price & Add Button */}
              <View style={[styles.priceRow, isCompactCard && { paddingTop: 2 }]}>
                <View style={styles.priceColumn}>
                  <Text style={[styles.priceText, isCompactCard && { fontSize: 11.5, lineHeight: 14 }]}>
                    ₹{currentSellingPrice}
                  </Text>
                  {currentMrp > currentSellingPrice && (
                    <Text style={[styles.mrpText, isCompactCard && { fontSize: 8.5, lineHeight: 11 }]}>
                      ₹{currentMrp}
                    </Text>
                  )}
                </View>

                {quantity === 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddToCart}
                    style={[styles.addButton, isCompactCard && { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 }]}
                    accessibilityLabel="Add to cart"
                  >
                    <Text style={[styles.addButtonText, isCompactCard && { fontSize: 9 }]}>ADD</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.stepperContainer, isCompactCard && { borderRadius: 5 }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleUpdateQty(-1)}
                      style={[styles.stepperBtn, isCompactCard && { paddingHorizontal: 4, paddingVertical: 2 }]}
                    >
                      <Text style={[styles.stepperBtnText, isCompactCard && { fontSize: 9 }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepperValue, isCompactCard && { fontSize: 9, paddingHorizontal: 2 }]}>
                      {quantity}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleUpdateQty(1)}
                      style={[styles.stepperBtn, isCompactCard && { paddingHorizontal: 4, paddingVertical: 2 }]}
                    >
                      <Text style={[styles.stepperBtnText, isCompactCard && { fontSize: 9 }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginVertical: 18,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinkFireIcon: {
    width: 24,
    height: 28,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101A4D',
    letterSpacing: -0.4,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EC4A9D',
  },
  headerActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navArrowsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollRail: {
    paddingRight: 16,
    gap: 10,
    paddingTop: 2,
    paddingBottom: 6,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EAF1',
    borderRadius: 14,
    padding: 10,
    position: 'relative',
    shadowColor: '#142350',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EC4A9D',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    zIndex: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 110,
    backgroundColor: '#FAFBFE',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#101A4D',
    lineHeight: 16,
    minHeight: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#101A4D',
  },
  etaDotText: {
    fontSize: 10,
    color: '#9296A7',
    marginHorizontal: 2,
  },
  etaMinutesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#62677A',
  },
  variantScrollView: {
    marginVertical: 6,
    maxHeight: 30,
  },
  variantScrollRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 6,
  },
  variantPill: {
    backgroundColor: '#F1F3F8',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E5EE',
  },
  variantPillActive: {
    backgroundColor: '#FCEAF5',
    borderColor: '#EC4A9D',
  },
  variantPillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#62677A',
  },
  variantPillTextActive: {
    color: '#EC4A9D',
    fontWeight: '800',
  },
  packSizeRow: {
    marginVertical: 6,
    minHeight: 24,
    justifyContent: 'center',
  },
  packSizeOnlyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#62677A',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 4,
  },
  priceColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101A4D',
    lineHeight: 18,
  },
  mrpText: {
    fontSize: 10.5,
    color: '#9296A7',
    textDecorationLine: 'line-through',
    lineHeight: 13,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: '#1FA463',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#1FA463',
    fontSize: 11,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1FA463',
    borderRadius: 7,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 3,
  },
});
