import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  StyleSheet,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from '../../components/common/AppIcon';
import { BlinkitProductCard } from '../../components/common/BlinkitProductCard';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { ProductService } from '../../services/productService';
import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { BlinkitProduct } from '../../types';

export const BlinkitProductDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    selectedBlinkitProduct,
    getBlinkitQty,
    updateBlinkitQty,
    goBack,
    setActiveScreen,
    applyCoupon,
    isInWishlist,
    toggleWishlist,
    currentAreaId,
    currentAreaName,
  } = useApp();

  const product = selectedBlinkitProduct;
  const quantity = product ? getBlinkitQty(product.id) : 0;
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSpecModalVisible, setSpecModalVisible] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<BlinkitProduct[]>([]);

  const variants = product?.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id || null);

  React.useEffect(() => {
    const vList = product?.variants || [];
    const defV = vList.find((v) => v.isDefault) || vList[0];
    setSelectedVariantId(defV?.id || null);
  }, [product?.id]);

  const activeVariant = variants.find((v) => v.id === selectedVariantId) || defaultVariant;
  let displayPrice = activeVariant ? activeVariant.price : product?.sellingPrice || 0;
  let displayMrp = activeVariant ? activeVariant.mrp : product?.mrp || 0;

  if ((product?.name || '').toLowerCase().includes('tomato')) {
    const isThaltej = (currentAreaName || '').toLowerCase().includes('thaltej');
    const isChandlodiya =
      (currentAreaName || '').toLowerCase().includes('chandlodiya') ||
      (currentAreaName || '').toLowerCase().includes('tragad');
    if (isThaltej) {
      displayPrice = 12;
      displayMrp = 15;
    } else if (isChandlodiya) {
      displayPrice = 7;
      displayMrp = 15;
    }
  }

  const displayPackSize = activeVariant ? activeVariant.label : product?.packSize || '1 unit';

  const attributeList: { label: string; value: string }[] =
    product?.attributes && product.attributes.length > 0
      ? product.attributes
      : [
          { label: 'TYPE', value: 'FRESH' },
          { label: 'DELIVERY', value: `${product?.deliveryMinutes || 9} MINS` },
          { label: 'PACK', value: displayPackSize },
          { label: 'BRAND', value: product?.brand || 'Farm Fresh' },
        ];

  const rawSpecs = product?.specifications || {};
  const hasSpecs = Object.keys(rawSpecs).length > 0;
  const specsEntries: [string, string][] = hasSpecs
    ? Object.entries(rawSpecs).map(([k, v]) => [k, String(v)])
    : [
        ['Type', 'Fresh Grocery Item'],
        ['Brand', product?.brand || 'Farm Fresh'],
        ['Unit / Pack Size', displayPackSize],
        ['Delivery Speed', `${product?.deliveryMinutes || 9} Minutes Fast Delivery`],
        ['Shelf Life', '4 - 7 Days from delivery'],
        ['Storage Instructions', 'Store in a clean, cool and well-ventilated dry place'],
        ['Quality Guarantee', '100% Quality Checked & Sourced Daily'],
        ['Return Policy', 'Doorstep replacement if not 100% satisfied'],
        ['FSSAI Certified', 'Yes (Lic. 10018021003456)'],
        ['Country of Origin', 'India'],
      ];

  React.useEffect(() => {
    (async () => {
      try {
        const live = await ProductService.fetchProducts({ areaId: currentAreaId || undefined });
        const mapped = live
          .filter((p) => p.id !== product?.id)
          .map(mapProductToBlinkit);
        setRelatedProducts(mapped.slice(0, 4));
      } catch (e) {}
    })();
  }, [product?.id, currentAreaId]);

  if (!product) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={TYPOGRAPHY.bodyMd}>Loading product details...</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} on Blinkit! Delivered in ${product.deliveryMinutes} minutes: ₹${product.sellingPrice}`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleApplyBankOffer = () => {
    if (product.bankOffer) {
      applyCoupon(product.bankOffer.code);
      Alert.alert(
        'Offer Applied!',
        `Coupon ${product.bankOffer.code} applied. Effective price is now ₹${product.bankOffer.effectivePrice} in your cart.`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Product Details */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
      >
        {/* Top Overlay Actions Bar */}
        <View style={styles.topActionsBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={styles.circleBtn}
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron-down" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topRightIcons}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => product && toggleWishlist(product)}
              style={styles.circleBtn}
              accessibilityLabel="Wishlist"
            >
              <AppIcon
                name={isWishlisted ? 'heart-filled' : 'heart'}
                size={20}
                color={isWishlisted ? '#E11D48' : COLORS.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('Blinkit_Home')}
              style={styles.circleBtn}
              accessibilityLabel="Search"
            >
              <AppIcon name="search" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShare}
              style={styles.circleBtn}
              accessibilityLabel="Share product"
            >
              <AppIcon name="share-2" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Full-width Hero Product Image Carousel */}
        <View style={styles.imageCarouselWrapper}>
          <View style={styles.carouselImageContainer}>
            <Image
              source={{ uri: product.galleryImages?.[activeImageIndex] || product.imageUrl }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          </View>

          {/* 6 Dot Page Indicators */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveImageIndex(idx)}
                style={[
                  styles.carouselDot,
                  activeImageIndex === idx && styles.activeCarouselDot,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.detailsContentBlock}>
          {/* 2. Attribute Pills Row (Horizontal Scroll) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attributeScroll}
          >
            {attributeList.map((attr) => (
              <View key={attr.label} style={styles.attributePill}>
                <Text style={styles.attributeLabel}>{attr.label}</Text>
                <Text style={styles.attributeValue}>{attr.value}</Text>
              </View>
            ))}

            {/* View Details Pill */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSpecModalVisible(true)}
              style={styles.viewDetailsPill}
            >
              <Text style={styles.viewDetailsText}>View details</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* 3. Meta Row: 10 mins ETA + Gold Star Rating */}
          <View style={styles.metaRow}>
            <View style={styles.etaPill}>
              <AppIcon name="clock" size={14} color={COLORS.textPrimary} />
              <Text style={styles.etaText}>{product.deliveryMinutes} mins</Text>
            </View>

            <View style={styles.ratingPill}>
              <Text style={styles.starSymbols}>★★★★☆</Text>
              <Text style={styles.reviewCountText}>{product.reviewCount}</Text>
            </View>
          </View>

          {/* 4. Product Title */}
          <Text style={[TYPOGRAPHY.headingMd, styles.productTitle]}>
            {product.name}
          </Text>

          {/* 5. Variant Pills / Pack Size Picker */}
          {variants.length > 0 ? (
            <View style={styles.variantsContainer}>
              <Text style={styles.selectPackLabel}>Select Unit / Pack Size:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.variantScroll}>
                {variants.map((v) => {
                  const isSelected = v.id === (activeVariant?.id || v.id);
                  return (
                    <TouchableOpacity
                      key={v.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedVariantId(v.id)}
                      style={[styles.variantPill, isSelected && styles.variantPillActive]}
                    >
                      <Text style={[styles.variantPillLabel, isSelected && styles.variantPillLabelActive]}>
                        {v.label}
                      </Text>
                      <Text style={[styles.variantPillPrice, isSelected && styles.variantPillPriceActive]}>
                        ₹{v.price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.variantStockRow}>
              <Text style={styles.variantLabel}>{displayPackSize}</Text>
              {product.stockUrgency && (
                <View style={styles.urgencyChip}>
                  <AppIcon name="clock" size={12} color={COLORS.warning} />
                  <Text style={styles.urgencyText}>{product.stockUrgency}</Text>
                </View>
              )}
            </View>
          )}

          {/* 6. Price Block (Area-Specific Dynamic Pricing) */}
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              {/* Highlight chip */}
              <View style={styles.priceHighlightChip}>
                <Text style={styles.priceHighlightText}>₹{displayPrice}</Text>
              </View>

              {displayMrp > displayPrice && (
                <Text style={[TYPOGRAPHY.priceStrike, styles.mrpStrike]}>
                  MRP ₹{displayMrp}
                </Text>
              )}

              {displayMrp > displayPrice && (
                <View style={styles.discountTagPill}>
                  <Text style={styles.discountTagText}>
                    {Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% OFF
                  </Text>
                </View>
              )}
            </View>

            {product.isPriceDrop && (
              <Text style={styles.priceDropLabel}>Price Drop</Text>
            )}
          </View>

          {/* 7. Bank Offer Card */}
          {product.bankOffer && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleApplyBankOffer}
              style={styles.bankOfferCard}
            >
              <View style={styles.bankLogoChip}>
                <Text style={styles.bankLogoText}>{product.bankOffer.bank}</Text>
              </View>
              <View style={styles.bankOfferCenter}>
                <Text style={styles.bankOfferHeading}>{product.bankOffer.text}</Text>
                <Text style={styles.bankOfferSub}>Apply Code: {product.bankOffer.code}</Text>
              </View>
              <Text style={styles.bankViewDetailsLink}>Apply</Text>
            </TouchableOpacity>
          )}

          {/* 7.5 Inline Product Specifications Card */}
          <View style={styles.inlineSpecsContainer}>
            <View style={styles.inlineSpecsHeader}>
              <Text style={styles.inlineSpecsTitle}>Product Specifications</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSpecModalVisible(true)}
              >
                <Text style={styles.inlineSpecsViewAll}>View all ▸</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inlineSpecsList}>
              {specsEntries.slice(0, 5).map(([key, val]) => (
                <View key={key} style={styles.inlineSpecRow}>
                  <Text style={styles.inlineSpecKey}>{key}</Text>
                  <Text style={styles.inlineSpecVal} numberOfLines={2}>
                    {val}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 8. Brand Row */}
          <View style={styles.brandRow}>
            <View style={styles.brandLogoBox}>
              <Text style={styles.brandLogoText}>CITIZEN</Text>
            </View>
            <View style={styles.brandTextCol}>
              <Text style={styles.brandName}>{product.brand}</Text>
              <Text style={styles.exploreBrandSub}>Explore all products</Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={COLORS.secondaryText} />
          </View>

          {/* 9. See all products teaser */}
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>See all Monsoon Store products ▸</Text>
          </View>

          {/* 10. People also bought (2 products per row) */}
          <View style={styles.alsoBoughtSection}>
            <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>
              People also bought
            </Text>
            <View style={styles.alsoBoughtGrid}>
              {relatedProducts.map((item) => (
                <BlinkitProductCard
                  key={item.id}
                  product={item}
                  style={styles.alsoBoughtCard}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Extra space for 2-layer fixed bottom UI */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* TWO-LAYER FIXED BOTTOM UI:
          Layer 1: Floating "View Cart" Pill stacked ~16px ABOVE the sticky bar
          Layer 2: Sticky Add-to-Cart Bar fixed to bottom */}

      {/* Floating View Cart Pill (stacks directly above the 72dp sticky bar) */}
      <FloatingCartPill bottomOffset={84} />

      {/* Sticky Add-to-Cart Bar */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.stickyLeftCol}>
          <Text style={styles.stickyVariantText}>{displayPackSize}</Text>
          <View style={styles.stickyPriceRow}>
            <Text style={styles.stickyPriceText}>₹{displayPrice}</Text>
            {displayMrp > displayPrice && (
              <Text style={styles.stickyMrpText}>MRP ₹{displayMrp}</Text>
            )}
          </View>
          <Text style={styles.stickyTaxesCaption}>Inclusive of all taxes</Text>
        </View>

        {/* Right CTA / Stepper */}
        {quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              updateBlinkitQty(
                {
                  ...product,
                  sellingPrice: displayPrice,
                  mrp: displayMrp,
                  packSize: displayPackSize,
                },
                1
              )
            }
            style={styles.stickyAddToCartBtn}
            accessibilityLabel="Add to cart"
          >
            <Text style={styles.stickyAddToCartBtnText}>Add to cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stickyStepperContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateBlinkitQty(product, -1)}
              style={styles.stickyStepperBtn}
              accessibilityLabel="Decrease"
            >
              <AppIcon name="minus" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.stickyStepperQty}>{quantity}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateBlinkitQty(product, 1)}
              style={styles.stickyStepperBtn}
              accessibilityLabel="Increase"
            >
              <AppIcon name="plus" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Full Attribute Specifications Modal Sheet */}
      <Modal
        visible={isSpecModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSpecModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSpecModalVisible(false)}
          />
          <View style={styles.specSheetContainer}>
            <View style={styles.specHeaderRow}>
              <Text style={[TYPOGRAPHY.headingMd, styles.specSheetTitle]}>
                Product Specifications
              </Text>
              <TouchableOpacity
                onPress={() => setSpecModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeSpecBtn}
                accessibilityLabel="Close specifications"
              >
                <AppIcon name="x" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.specScrollView}
              contentContainerStyle={styles.specScrollContent}
            >
              {specsEntries.map(([key, val]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specVal}>{String(val)}</Text>
                </View>
              ))}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topRightIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  imageCarouselWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  carouselImageContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  activeCarouselDot: {
    backgroundColor: COLORS.primary,
    width: 14,
  },
  detailsContentBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  attributeScroll: {
    gap: 8,
    marginBottom: 14,
  },
  attributePill: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attributeLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  viewDetailsPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starSymbols: {
    fontSize: 13,
    color: COLORS.warning,
    letterSpacing: 1,
  },
  reviewCountText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  productTitle: {
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  variantsContainer: {
    marginBottom: 12,
  },
  selectPackLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantScroll: {
    flexDirection: 'row',
  },
  variantPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  variantPillActive: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  variantPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  variantPillLabelActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  variantPillPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  variantPillPriceActive: {
    color: '#15803D',
  },
  discountTagPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  variantStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  variantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  urgencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(241, 181, 98, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
  },
  priceBlock: {
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceHighlightChip: {
    backgroundColor: COLORS.lightPink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceHighlightText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  mrpStrike: {
    color: COLORS.textMuted,
  },
  priceDropLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 4,
  },
  bankOfferCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bankLogoChip: {
    backgroundColor: '#6A1B9A',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bankLogoText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
  },
  bankOfferCenter: {
    flex: 1,
  },
  bankOfferHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bankOfferSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bankViewDetailsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  brandLogoBox: {
    width: 44,
    height: 32,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  brandLogoText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  brandTextCol: {
    flex: 1,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  exploreBrandSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  seeAllRow: {
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  alsoBoughtSection: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  alsoBoughtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  alsoBoughtCard: {
    width: '48.5%',
    marginBottom: 12,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 900,
  },
  stickyLeftCol: {
    flex: 1,
  },
  stickyVariantText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stickyPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stickyPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stickyMrpText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  stickyTaxesCaption: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  stickyAddToCartBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  stickyAddToCartBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  stickyStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 90,
    justifyContent: 'space-between',
  },
  stickyStepperBtn: {
    padding: 6,
  },
  stickyStepperQty: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    paddingHorizontal: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  specSheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    height: 480,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  specHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specSheetTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  closeSpecBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specScrollView: {
    flex: 1,
    width: '100%',
  },
  specScrollContent: {
    paddingBottom: 24,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specKey: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    paddingRight: 12,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1.2,
    textAlign: 'right',
  },
  inlineSpecsContainer: {
    marginVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineSpecsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineSpecsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  inlineSpecsViewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inlineSpecsList: {},
  inlineSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inlineSpecKey: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  inlineSpecVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
});
