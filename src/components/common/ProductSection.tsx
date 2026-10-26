import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { SECTION_ICONS } from '../../theme/sectionIcons';
import { BlinkitProduct } from '../../types';
import { useApp } from '../../context/AppContext';
import { ProductSectionSkeleton } from './Skeleton';
import { resolveImageThumbnail } from '../../utils/imageUrl';

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
  isLoading?: boolean;
}

const ProductSectionComponent: React.FC<ProductSectionProps> = ({
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
  isLoading = false,
}) => {
  const { width } = useWindowDimensions();
  const { blinkitCart, getBlinkitQty, updateBlinkitQty, isInWishlist, toggleWishlist, currentAreaName } = useApp();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [pickerProduct, setPickerProduct] = useState<BlinkitProduct | null>(null);

  // Stable callback so each card's variant-select handler doesn't cause re-renders
  const handleSelectVariant = useCallback((itemId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [itemId]: variantId }));
  }, []);

  const isSmall = width < 500;

  // Resolve Lucide SVG icon configuration from central theme
  const iconConfig = SECTION_ICONS[iconName || id || ''] || null;

  // Responsive card width calculation
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
  // Gap between cards (matches cardsScrollContent gap style)
  const CARD_GAP = 10;
  const flatListRef = useRef<FlatList<BlinkitProduct>>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setVisibleIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const totalProducts = products?.length || 0;
  const handleScrollStep = useCallback((dir: 'left' | 'right') => {
    if (totalProducts === 0) return;
    const step = 3;
    const nextIndex = dir === 'left'
      ? Math.max(0, visibleIndex - step)
      : Math.min(totalProducts - 1, visibleIndex + step);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0 });
    setVisibleIndex(nextIndex);
  }, [visibleIndex, totalProducts]);

  // O(1) item layout — required for scrollToIndex to work correctly
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: cardWidth + CARD_GAP,
    offset: (cardWidth + CARD_GAP) * index + 16, // 16px left padding
    index,
  }), [cardWidth]);

  // Render a single product card — extracted for FlatList renderItem memoisation
  const renderCard = useCallback(({ item }: { item: BlinkitProduct }) => {
    const itemVariants = item.variants && item.variants.length > 0 ? item.variants : [];
    const defaultVariant = itemVariants.find((v) => v.isDefault) || itemVariants[0];
    const selectedVariantId = selectedVariants[item.id] || defaultVariant?.id || null;
    const activeVariant = itemVariants.find((v) => v.id === selectedVariantId) || defaultVariant;

    let currentSellingPrice = activeVariant ? activeVariant.price : item.sellingPrice;
    let currentMrp = activeVariant ? activeVariant.mrp : item.mrp;
    let currentPackSize = activeVariant ? activeVariant.label : item.packSize;

    const discountPercent =
      currentMrp > currentSellingPrice
        ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100)
        : 0;

    const isWishlisted = isInWishlist(item.id);
    const quantity = getBlinkitQty(item.id, activeVariant?.id);

    const getProductPayload = (): BlinkitProduct => ({
      ...item,
      sellingPrice: currentSellingPrice,
      mrp: currentMrp,
      packSize: currentPackSize,
      selectedVariantId: activeVariant?.id,
    });

    return (
      <View
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
            source={{ uri: resolveImageThumbnail(item.imageUrl) }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Product Name */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenProduct(getProductPayload())}>
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
        <View style={[styles.ratingRow, isCompact && { marginTop: 2, marginBottom: 4, gap: 2 }]}>
          <Ionicons name="star" size={isCompact ? 9 : 11} color="#F59E0B" />
          <Text style={[styles.ratingText, isCompact && { fontSize: 8.5 }]}>
            {item.rating || 4.8}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={[styles.etaText, isCompact && { fontSize: 8 }]}>
            {item.deliveryMinutes || 9}m
          </Text>
        </View>

        {/* Variant Dropdown or single packSize */}
        {itemVariants.length > 1 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPickerProduct(item)}
            style={[
              styles.variantDropdownTrigger,
              isCompact && { paddingHorizontal: 5, height: 20 },
            ]}
          >
            <Text
              style={[
                styles.variantDropdownText,
                isCompact && { fontSize: 8.5 },
              ]}
              numberOfLines={1}
            >
              {activeVariant?.label || currentPackSize || 'Select Unit'}
            </Text>
            <Ionicons name="chevron-down" size={isCompact ? 9 : 11} color="#4F46E5" />
          </TouchableOpacity>
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
              <Text style={[styles.mrpText, isCompact && { fontSize: 8.5 }]}>₹{currentMrp}</Text>
            ) : null}
          </View>

          {quantity > 0 ? (
            <View style={[styles.stepperContainer, isCompact && { paddingHorizontal: 2, height: 26 }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateBlinkitQty(getProductPayload(), -1, activeVariant?.id)}
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
                onPress={() => updateBlinkitQty(getProductPayload(), 1, activeVariant?.id)}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="add" size={isCompact ? 10 : 13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateBlinkitQty(getProductPayload(), 1, activeVariant?.id)}
              style={[styles.addButton, isCompact && { height: 25, paddingHorizontal: 8 }]}
              accessibilityLabel={`Add ${item.name}`}
            >
              <Text style={[styles.addButtonText, isCompact && { fontSize: 10 }]}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [selectedVariants, cardWidth, isCompact, currentAreaName,
      blinkitCart, getBlinkitQty, updateBlinkitQty, isInWishlist, toggleWishlist,
      onOpenProduct, handleSelectVariant]);

  const IconComponent = iconConfig?.icon;

  if (isLoading) {
    return <ProductSectionSkeleton title={title} subtitle={subtitle} />;
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
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
              <Text style={styles.sectionSubtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRightWrap}>
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

      {/* Horizontal product rail — virtualised */}
      <FlatList
        ref={flatListRef}
        data={products}
        extraData={blinkitCart}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContent}
        initialNumToRender={4}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Variant Selector Dropdown Modal */}
      {pickerProduct ? (
        <Modal
          visible={!!pickerProduct}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerProduct(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerProduct(null)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e: any) => e?.stopPropagation?.()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {pickerProduct.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>Select Pack Size</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPickerProduct(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.variantOptionsList}>
                {(pickerProduct.variants || []).map((v) => {
                  const currentSelectedId =
                    selectedVariants[pickerProduct.id] ||
                    (pickerProduct.variants?.find((pv) => pv.isDefault) || pickerProduct.variants?.[0])?.id;
                  const isSelected = v.id === currentSelectedId;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        handleSelectVariant(pickerProduct.id, v.id);
                        setPickerProduct(null);
                      }}
                      style={[
                        styles.variantOptionRow,
                        isSelected && styles.variantOptionRowSelected,
                      ]}
                    >
                      <View style={styles.variantOptionLeft}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text
                          style={[
                            styles.variantOptionLabel,
                            isSelected && styles.variantOptionLabelSelected,
                          ]}
                        >
                          {v.label}
                        </Text>
                      </View>

                      <View style={styles.variantOptionRight}>
                        <Text style={styles.variantOptionPrice}>
                          ₹{v.price}
                        </Text>
                        {v.mrp > v.price && (
                          <Text style={styles.variantOptionMrp}>
                            ₹{v.mrp}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};

// F-09: Memoize to prevent re-renders when parent (BlinkitHomeScreen) state changes
export const ProductSection = React.memo(ProductSectionComponent);

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
  variantDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    height: 22,
    marginBottom: 4,
    width: '100%',
  },
  variantDropdownText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4338CA',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  variantOptionsList: {
    gap: 8,
  },
  variantOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  variantOptionRowSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  variantOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#6366F1',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#6366F1',
  },
  variantOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  variantOptionLabelSelected: {
    color: '#4338CA',
    fontWeight: '700',
  },
  variantOptionRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  variantOptionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  variantOptionMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
});
