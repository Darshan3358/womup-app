import React, { useState, useRef } from 'react';
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
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { SECTION_ICONS } from '../../theme/sectionIcons';
import { BlinkitProduct } from '../../types';
import { useApp } from '../../context/AppContext';

export interface ProductSectionProps {
  id?: string;
  iconName?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  iconImage?: any;
  products: BlinkitProduct[];
  onOpenProduct: (product: BlinkitProduct) => void;
  onViewAll?: () => void;
  viewAllText?: string;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  id,
  iconName,
  title,
  subtitle,
  icon,
  iconImage,
  products,
  onOpenProduct,
  onViewAll,
  viewAllText = 'View All',
}) => {
  const { width } = useWindowDimensions();
  const { getBlinkitQty, updateBlinkitQty, isInWishlist, toggleWishlist } = useApp();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const isSmall = width < 500;

  // Resolve Lucide SVG icon configuration from central theme
  const iconConfig = SECTION_ICONS[iconName || id || ''] || null;

  // Responsive card width calculation:
  // Mobile (375-430px): ~92-105px (3.5 to 4 cards peeking)
  // Small (<375px): ~86px
  // Tablet/Desktop (680px+): ~130-150px
  let cardWidth = 98;
  if (width >= 1200) {
    cardWidth = Math.floor((Math.min(width, 1440) - 48) / 6.2);
  } else if (width >= 900) {
    cardWidth = Math.floor((width - 40) / 5.2);
  } else if (width >= 680) {
    cardWidth = Math.floor((width - 32) / 4.4);
  } else if (width >= 375) {
    cardWidth = Math.max(88, Math.floor((width - 32 - 24) / 3.6));
  } else {
    cardWidth = Math.max(82, Math.floor((width - 24 - 16) / 3.2));
  }

  const isCompact = cardWidth <= 115;
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);

  const handleScrollStep = (dir: 'left' | 'right') => {
    const step = cardWidth * 3 + 20;
    const nextX = dir === 'left' ? Math.max(0, scrollX - step) : scrollX + step;
    scrollRef.current?.scrollTo({ x: nextX, animated: true });
    setScrollX(nextX);
  };

  if (!products || products.length === 0) {
    return null;
  }

  const IconComponent = iconConfig?.icon;

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header with Professional Icon Badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          {iconConfig && IconComponent ? (
            <View style={[styles.iconBadge, { backgroundColor: iconConfig.bg }]}>
              <IconComponent size={19} color={iconConfig.color} strokeWidth={2.4} />
            </View>
          ) : iconImage ? (
            <View style={[styles.iconBadge, { backgroundColor: '#F3F4F6' }]}>
              <Image source={iconImage} style={styles.headerImage} resizeMode="contain" />
            </View>
          ) : icon ? (
            <View style={[styles.iconBadge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={styles.headerIconEmoji}>{icon}</Text>
            </View>
          ) : null}

          <View style={styles.titleTextWrap}>
            <Text style={[styles.sectionTitle, isSmall && { fontSize: 17 }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.sectionSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRightWrap}>
          {/* Arrow buttons for tablet/desktop */}
          {!isSmall && products.length > 4 && (
            <View style={styles.arrowsWrap}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleScrollStep('left')}
                style={styles.arrowBtn}
              >
                <Ionicons name="chevron-back" size={15} color="#101A4D" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleScrollStep('right')}
                style={styles.arrowBtn}
              >
                <Ionicons name="chevron-forward" size={15} color="#101A4D" />
              </TouchableOpacity>
            </View>
          )}

          {onViewAll && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onViewAll}
              style={styles.viewAllBtn}
              accessibilityRole="button"
            >
              <Text style={styles.viewAllText}>{viewAllText}</Text>
              <ChevronRight size={15} color="#EC4A9D" strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContent}
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={32}
      >
        {products.map((item) => {
          const itemVariants = item.variants && item.variants.length > 0 ? item.variants : [];
          const defaultVariant = itemVariants.find((v) => v.isDefault) || itemVariants[0];
          const selectedVariantId = selectedVariants[item.id] || defaultVariant?.id || null;
          const activeVariant =
            itemVariants.find((v) => v.id === selectedVariantId) || defaultVariant;

          const currentSellingPrice = activeVariant ? activeVariant.price : item.sellingPrice;
          const currentMrp = activeVariant ? activeVariant.mrp : item.mrp;
          const currentPackSize = activeVariant ? activeVariant.label : item.packSize;
          const discountPercent =
            currentMrp > currentSellingPrice
              ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100)
              : 0;

          const isWishlisted = isInWishlist(item.id);
          const quantity = getBlinkitQty(item.id);

          const getProductPayload = (): BlinkitProduct => ({
            ...item,
            sellingPrice: currentSellingPrice,
            mrp: currentMrp,
            packSize: currentPackSize,
          });

          return (
            <View
              key={item.id}
              style={[
                styles.productCard,
                { width: cardWidth },
                isCompact && { padding: 6, borderRadius: 10 },
              ]}
            >
              {/* Discount Badge & Wishlist Heart */}
              {discountPercent > 0 ? (
                <View
                  style={[
                    styles.discountBadge,
                    isCompact && { top: 4, left: 4, paddingHorizontal: 4, paddingVertical: 1 },
                  ]}
                >
                  <Text style={[styles.discountText, isCompact && { fontSize: 7.5 }]}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleWishlist(item)}
                style={[
                  styles.wishlistButton,
                  isCompact && { top: 4, right: 4, width: 22, height: 22, borderRadius: 11 },
                ]}
                accessibilityLabel="Wishlist"
              >
                <Ionicons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={isCompact ? 12 : 14}
                  color={isWishlisted ? COLORS.hotPink : '#9296A7'}
                />
              </TouchableOpacity>

              {/* Product Image */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onOpenProduct(getProductPayload())}
                style={[
                  styles.imageWrapper,
                  { width: '100%', aspectRatio: 1 },
                  isCompact && { marginBottom: 6 },
                ]}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Product Name */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onOpenProduct(getProductPayload())}
              >
                <Text
                  style={[
                    styles.productName,
                    isCompact && { fontSize: 10.5, lineHeight: 13, minHeight: 26 },
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>

              {/* Rating + Delivery ETA */}
              <View
                style={[
                  styles.ratingRow,
                  isCompact && { marginTop: 2, marginBottom: 4, gap: 2 },
                ]}
              >
                <Ionicons name="star" size={isCompact ? 9 : 11} color="#F59E0B" />
                <Text style={[styles.ratingText, isCompact && { fontSize: 8.5 }]}>
                  {item.rating || 4.8}
                </Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={[styles.etaText, isCompact && { fontSize: 8 }]}>
                  {item.deliveryMinutes || 9}m
                </Text>
              </View>

              {/* Variant Pills (if multiple) or single packSize */}
              {itemVariants.length > 1 ? (
                <View style={styles.variantScrollWrap}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.variantScrollContent}
                  >
                    {itemVariants.map((v) => {
                      const isSel = v.id === (activeVariant?.id || defaultVariant?.id);
                      return (
                        <TouchableOpacity
                          key={v.id}
                          activeOpacity={0.7}
                          onPress={() =>
                            setSelectedVariants((prev) => ({ ...prev, [item.id]: v.id }))
                          }
                          style={[
                            styles.variantChip,
                            isSel && styles.variantChipSelected,
                            isCompact && { paddingHorizontal: 3, paddingVertical: 1 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.variantChipText,
                              isSel && styles.variantChipTextSelected,
                              isCompact && { fontSize: 7.5 },
                            ]}
                            numberOfLines={1}
                          >
                            {v.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <Text style={[styles.packSizeText, isCompact && { fontSize: 9 }]} numberOfLines={1}>
                  {currentPackSize || '1 unit'}
                </Text>
              )}

              {/* Price & Action Row */}
              <View style={[styles.actionRow, isCompact && { marginTop: 4 }]}>
                <View style={styles.priceColumn}>
                  <Text style={[styles.sellingPrice, isCompact && { fontSize: 11.5 }]}>
                    ₹{currentSellingPrice}
                  </Text>
                  {currentMrp > currentSellingPrice ? (
                    <Text style={[styles.mrpText, isCompact && { fontSize: 8.5 }]}>
                      ₹{currentMrp}
                    </Text>
                  ) : null}
                </View>

                {quantity > 0 ? (
                  <View style={[styles.stepperContainer, isCompact && { paddingHorizontal: 2, height: 26 }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => updateBlinkitQty(getProductPayload(), -1)}
                      style={styles.stepperBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Ionicons name="remove" size={isCompact ? 10 : 13} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={[styles.stepperQtyText, isCompact && { fontSize: 10, minWidth: 12 }]}>
                      {quantity}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => updateBlinkitQty(getProductPayload(), 1)}
                      style={styles.stepperBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Ionicons name="add" size={isCompact ? 10 : 13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => updateBlinkitQty(getProductPayload(), 1)}
                    style={[styles.addButton, isCompact && { height: 25, paddingHorizontal: 8 }]}
                    accessibilityLabel={`Add ${item.name}`}
                  >
                    <Text style={[styles.addButtonText, isCompact && { fontSize: 10 }]}>ADD</Text>
                  </TouchableOpacity>
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
    marginTop: 18,
    marginBottom: 6,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconEmoji: {
    fontSize: 18,
  },
  headerImage: {
    width: 20,
    height: 20,
  },
  titleTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0B1755',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F3F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EC4A9D',
  },
  cardsScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ECEEF5',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: 'space-between',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EC4A9D',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  imageWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 14.5,
    minHeight: 29,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  dotSeparator: {
    fontSize: 8,
    color: '#94A3B8',
  },
  etaText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#059669',
  },
  variantScrollWrap: {
    height: 20,
    marginBottom: 4,
  },
  variantScrollContent: {
    gap: 4,
  },
  variantChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  variantChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  variantChipText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
  },
  variantChipTextSelected: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  packSizeText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceColumn: {
    flex: 1,
    marginRight: 4,
  },
  sellingPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrpText: {
    fontSize: 9.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 6,
    height: 26,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 6,
    height: 26,
    paddingHorizontal: 4,
    gap: 4,
  },
  stepperBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQtyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 14,
  },
});
