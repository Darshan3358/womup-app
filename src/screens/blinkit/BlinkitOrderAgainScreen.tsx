import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { ProductService } from '../../services/productService';
import { BlinkitProduct, Order, Address } from '../../types';
import { PrintingService, PrintOrderItem } from '../../services/printingService';
import { OrderCard } from '../../components/OrderCard';
import { resolveImageThumbnail } from '../../utils/imageUrl';

const defaultAddress: Address = {
  id: 'addr_default',
  type: 'Home',
  fullName: 'Ayushi',
  phoneNumber: '9876543210',
  houseFlat: 'Tragad Dark Road',
  areaLandmark: 'Chandlodiya',
  city: 'Ahmedabad',
  pincode: '382481',
  isDefault: true,
};

// Default Past Orders: starts clean and empty
const DEFAULT_PAST_ORDERS: Order[] = [];

export const BlinkitOrderAgainScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isSmall = width < 480;

  const {
    orders,
    setActiveScreen,
    setSelectedBlinkitProduct,
    setCurrentOrder,
    addToCart,
    selectedAddress,
    isInWishlist,
    toggleWishlist,
  } = useApp();

  const [popularProducts, setPopularProducts] = useState<BlinkitProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'grocery' | 'print'>('grocery');
  const [printOrders, setPrintOrders] = useState<PrintOrderItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const live = await ProductService.fetchProducts();
        if (live && live.length > 0) {
          setPopularProducts(live.map(mapProductToBlinkit));
        }
      } catch (e) {}

      try {
        const prints = await PrintingService.fetchMyPrintOrders();
        if (prints) setPrintOrders(prints);
      } catch (e) {}
    })();
  }, []);

  const displayOrders = orders && orders.length > 0 ? orders : DEFAULT_PAST_ORDERS;
  const hasPrintOrders = printOrders && printOrders.length > 0;

  // Curated bestsellers from live products catalog
  const bestsellersList: BlinkitProduct[] = popularProducts;

  const getProductImageSource = (item?: any, orderIdx?: number, isCancelled?: boolean): ImageSourcePropType => {
    if (item?.image) {
      return item.image;
    }
    if (item?.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0) {
      return { uri: item.imageUrl };
    }

    const itemName = (item?.name || '').toLowerCase();
    const itemId = item?.productId || '';

    // Search in popular products from backend
    if (itemId) {
      const match: any = popularProducts.find((p) => p.id === itemId);
      if (match?.image) return match.image;
      if (match?.imageUrl) return { uri: match.imageUrl };
    }

    if (itemName) {
      const nameMatch: any = popularProducts.find(
        (p) =>
          itemName.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(itemName)
      );
      if (nameMatch?.image) return nameMatch.image;
      if (nameMatch?.imageUrl) return { uri: nameMatch.imageUrl };
    }

    // Keyword mapping for authentic product images
    if (itemName.includes('tomato')) {
      return { uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' };
    }
    if (itemName.includes('paneer')) {
      return require('../../../assets/products/real_paneer_cubes.png');
    }
    if (itemName.includes('oil') || itemName.includes('sunflower')) {
      if (isCancelled || orderIdx === 2 || itemName.includes('pouch')) {
        return require('../../../assets/products/real_fortune_pouch.png');
      }
      return require('../../../assets/products/fortune_oil.jpg');
    }
    if (itemName.includes('milk') || itemName.includes('amul gold')) {
      return require('../../../assets/products/amul_milk.jpg');
    }
    if (itemName.includes('atta') || itemName.includes('flour') || itemName.includes('aashirvaad')) {
      return require('../../../assets/products/aashirvaad_atta.jpg');
    }
    if (itemName.includes('salt') || itemName.includes('tata')) {
      return require('../../../assets/products/tata_salt.jpg');
    }
    if (itemName.includes('maggi') || itemName.includes('noodle')) {
      return require('../../../assets/products/maggi_noodles.jpg');
    }
    if (itemName.includes('rice') || itemName.includes('basmati')) {
      return require('../../../assets/products/fortune_rice.jpg');
    }
    if (itemName.includes('oat')) {
      return { uri: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=400&q=80' };
    }
    if (itemName.includes('banana')) {
      return { uri: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80' };
    }
    if (itemName.includes('coriander') || itemName.includes('dhaniya')) {
      return { uri: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80' };
    }
    if (itemName.includes('buttermilk') || itemName.includes('chhas')) {
      return { uri: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=500&q=80' };
    }

    if (orderIdx === 1) {
      return require('../../../assets/products/fortune_oil.jpg');
    }
    if (orderIdx === 2) {
      return require('../../../assets/products/real_fortune_pouch.png');
    }
    return require('../../../assets/products/real_paneer_cubes.png');
  };

  const handleOpenOrderDetail = (ord: Order) => {
    setCurrentOrder(ord);
    setActiveScreen('C24_OrderTracking');
  };

  const handleOpenProductDetail = (prod: BlinkitProduct) => {
    setSelectedBlinkitProduct(prod);
    setActiveScreen('Blinkit_ProductDetail');
  };

  const handleRepeatOrder = (ord: Order) => {
    if (ord.items && ord.items.length > 0) {
      ord.items.forEach((it) => {
        addToCart({
          id: it.productId || `prod_${Date.now()}`,
          name: it.name,
          brand: 'Wom Up',
          categoryId: 'cooking',
          sellingPrice: it.price,
          mrp: Math.round(it.price * 1.15),
          discountPercent: 12,
          shoppingCoins: 10,
          rating: 4.8,
          reviewCount: 30,
          stock: 100,
          deliveryMinutes: 9,
          description: '',
          quantityLabel: `${it.quantity} unit`,
        });
      });
      setActiveScreen('C19_Cart');
    }
  };

  const handleOpenPrintDetail = (pOrd: PrintOrderItem) => {
    const printTrackingObj: Order = {
      id: `print_${Date.now()}`,
      orderNumber: pOrd.printOrderNumber,
      date: new Date(pOrd.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: (pOrd.status === 'DELIVERED' ? 'DELIVERED' : 'PLACED') as any,
      items: [
        {
          productId: 'print_service_item',
          name: `${pOrd.originalFileName} (${pOrd.pageCount} pgs × ${pOrd.numberOfCopies} copies, ${pOrd.isColor ? 'Color' : 'B&W'})`,
          quantity: pOrd.numberOfCopies,
          price: pOrd.totalAmount,
        },
      ],
      itemCount: pOrd.numberOfCopies,
      subtotal: pOrd.totalAmount,
      discount: 0,
      shoppingCoinsUsed: 0,
      deliveryFee: 0,
      totalAmount: pOrd.totalAmount,
      deliveryAddress: selectedAddress,
      deliverySlot: 'Express (10 minutes)',
      paymentMethod: 'Online / Cash on Delivery',
      deliveryPartner: undefined,
    };
    setCurrentOrder(printTrackingObj);
    setActiveScreen('C24_OrderTracking');
  };

  return (
    <View style={styles.container}>
      {/* Pinned Navy Header with Search & Integrated Order Type Tabs */}
      <BlinkitHeader
        variant="gradient"
        etaLabel="Delivery in"
        etaTime="9 minutes"
        searchPlaceholder='Search "past items, snacks, milk"'
        showCategoryTabs={false}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayOrders.length > 0 ? (
          /* Grocery Orders Section matching SRS */
          <View style={styles.pastOrdersContainer}>
            {/* Past Orders Hero Introduction Banner (SRS Section 13) */}
            <View style={styles.heroBanner}>
              <View style={styles.bannerLeft}>
                <View style={styles.clockIconCircle}>
                  <Ionicons name="time-outline" size={20} color="#F23D9B" />
                </View>
                <View style={styles.bannerTextColumn}>
                  <Text style={styles.bannerTitle}>Your Past Orders</Text>
                  <Text style={styles.bannerSubtitle}>
                    Track your previous orders and reorder your favourites
                  </Text>
                </View>
              </View>

              <Image
                source={require('../../../assets/order_again_box.png')}
                style={styles.bannerBoxImage}
                resizeMode="contain"
              />
            </View>

            {displayOrders.map((ord, idx) => (
              <OrderCard
                key={ord.id || ord.orderNumber || idx}
                order={ord}
                onPressDetails={() => handleOpenOrderDetail(ord)}
                onPressReorder={() => handleRepeatOrder(ord)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.onboardingBannerContainer}>
            <Ionicons name="receipt-outline" size={54} color={COLORS.purple} style={{ marginBottom: 12 }} />
            <Text style={[TYPOGRAPHY.headingLg, styles.onboardingHeading]}>No Orders Yet</Text>
            <Text style={[TYPOGRAPHY.bodySm, styles.onboardingSubtext]}>
              You haven't placed any orders yet. Browse products and get fresh items delivered in 9 minutes!
            </Text>
            <TouchableOpacity
              onPress={() => setActiveScreen('Blinkit_Home')}
              style={[styles.repeatOrderBtn, { marginTop: 14 }]}
            >
              <Ionicons name="basket-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.repeatOrderBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bestsellers Section (SRS Section 26 & 27) */}
        <View style={styles.bestsellersSection}>
          <View style={styles.bestsellersHeaderRow}>
            <Text style={styles.bestsellersTitle}>Bestsellers</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('C15_ProductListing')}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productRail}
          >
            {bestsellersList.map((prod) => {
              const discountPercent =
                prod.mrp > prod.sellingPrice
                  ? Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100)
                  : 12;

              const isFav = isInWishlist(prod.id);

              return (
                <View key={prod.id} style={styles.bestsellerCard}>
                  {/* Discount Badge */}
                  <View style={styles.bsDiscountBadge}>
                    <Text style={styles.bsDiscountText}>{discountPercent}% OFF</Text>
                  </View>

                  {/* Wishlist Heart */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleWishlist(prod)}
                    style={styles.bsWishlistBtn}
                    accessibilityLabel="Wishlist"
                  >
                    <Ionicons
                      name={isFav ? 'heart' : 'heart-outline'}
                      size={14}
                      color={isFav ? '#F23D9B' : '#9299AE'}
                    />
                  </TouchableOpacity>

                  {/* Product Image (Full Fit) */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleOpenProductDetail(prod)}
                    style={styles.bsImageWrapper}
                  >
                    <Image
                      source={{ uri: resolveImageThumbnail(prod.imageUrl) }}
                      style={styles.bsImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Product Name */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleOpenProductDetail(prod)}
                  >
                    <Text style={styles.bsProductName} numberOfLines={2}>
                      {prod.name}
                    </Text>
                  </TouchableOpacity>

                  {/* Rating */}
                  <View style={styles.bsRatingRow}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.bsRatingText}>{prod.rating || 4.8}</Text>
                  </View>

                  {/* Price & Add Button */}
                  <View style={styles.bsActionRow}>
                    <View>
                      <Text style={styles.bsPrice}>₹{prod.sellingPrice}</Text>
                      {prod.mrp > prod.sellingPrice && (
                        <Text style={styles.bsMrp}>₹{prod.mrp}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        addToCart({
                          id: prod.id,
                          name: prod.name,
                          brand: prod.brand,
                          categoryId: prod.category || 'c1',
                          sellingPrice: prod.sellingPrice,
                          mrp: prod.mrp,
                          discountPercent,
                          shoppingCoins: 10,
                          rating: prod.rating,
                          reviewCount: prod.reviewCount,
                          stock: prod.stock,
                          deliveryMinutes: prod.deliveryMinutes,
                          description: '',
                          quantityLabel: prod.packSize || '1 unit',
                        })
                      }
                      style={styles.bsAddBtn}
                    >
                      <Text style={styles.bsAddBtnText}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Persistent Floating View Cart pill */}
      <FloatingCartPill bottomOffset={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FE', // SRS Section 6: background: #F7F9FE
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // Order Type Tabs inside Navy Header (SRS Section 12)
  orderTypeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 2,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  orderTypeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  orderTypeTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: '#F23D9B',
  },
  orderTypeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  orderTypeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Past Orders Hero Banner (SRS Section 13)
  heroBanner: {
    backgroundColor: '#F3EBFC',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE4FB',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  clockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FCEAF5',
  },
  bannerTextColumn: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#10205D',
    lineHeight: 20,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#697293',
    lineHeight: 15,
  },
  bannerBoxImage: {
    width: 120,
    height: 72,
  },

  // Past Order Cards (SRS Section 14–25)
  pastOrdersContainer: {
    paddingHorizontal: 16,
  },
  pastOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EAF2',
    shadowColor: '#142350',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderThumbBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#EDEFF8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    marginRight: 12,
  },
  orderThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  orderContentColumn: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },

  // Card Header Row (Order number + status + chevron)
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderHeaderLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  orderNumberText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#10205D',
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusBadgeDelivered: {
    backgroundColor: '#E7F8F0',
  },
  statusTextDelivered: {
    color: '#18A66A',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FDEBEC',
  },
  statusTextCancelled: {
    color: '#E54B4B',
  },
  statusBadgePending: {
    backgroundColor: '#F3E8FF',
  },
  statusTextPending: {
    color: '#7C3AED',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusDotDelivered: {
    backgroundColor: '#18A66A',
  },
  statusDotCancelled: {
    backgroundColor: '#E54B4B',
  },
  statusDotPending: {
    backgroundColor: '#7C3AED',
  },
  chevronCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  orderDateText: {
    fontSize: 11,
    color: '#7E87A4',
    fontWeight: '500',
  },

  // Divider
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F3F8',
    marginVertical: 10,
  },

  // Order Item Line
  orderItemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  pinkBullet: {
    color: '#F23D9B',
    fontSize: 13,
    marginRight: 5,
    lineHeight: 13,
  },
  itemNameText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#10205D',
  },
  itemQtyBadge: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7E87A4',
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10205D',
    marginLeft: 6,
  },
  moreItemsText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
    marginTop: 2,
  },

  // Bill Row
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#697293',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10205D',
    marginLeft: 2,
  },
  totalCountText: {
    fontSize: 11.5,
    color: '#7E87A4',
    fontWeight: '500',
  },

  // Actions Row: View Details & Repeat Order
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F2FF',
    borderWidth: 1.2,
    borderColor: '#E0D8FF',
    height: 40,
    borderRadius: 20,
  },
  detailsBtnText: {
    color: '#493BCE',
    fontSize: 12.5,
    fontWeight: '700',
  },
  repeatOrderBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F23D9B',
    height: 40,
    borderRadius: 20,
    shadowColor: '#F23D9B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  repeatOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Bestsellers Section (SRS Section 26 & 27)
  bestsellersSection: {
    marginTop: 20,
    paddingLeft: 16,
  },
  bestsellersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 12,
  },
  bestsellersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10205D',
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F23D9B',
  },
  productRail: {
    paddingRight: 16,
    gap: 12,
  },
  bestsellerCard: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAF2',
    padding: 10,
    position: 'relative',
    shadowColor: '#142350',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bsDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  bsDiscountText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  bsWishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#E8EAF2',
  },
  bsImageWrapper: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: '#FAFBFE',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bsImage: {
    width: '100%',
    height: '100%',
  },
  bsProductName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10205D',
    lineHeight: 16,
    minHeight: 32,
  },
  bsRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    marginBottom: 6,
  },
  bsRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  bsActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  bsPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10205D',
  },
  bsMrp: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  bsAddBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bsAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Onboarding state
  onboardingBannerContainer: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  onboardingHeading: {
    textAlign: 'center',
    color: '#10205D',
    fontWeight: '700',
    marginBottom: 6,
  },
  onboardingSubtext: {
    textAlign: 'center',
    color: '#697293',
    maxWidth: 290,
    lineHeight: 18,
  },
});

