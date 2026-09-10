import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { BlinkitProductCard } from '../../components/common/BlinkitProductCard';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { ProductService } from '../../services/productService';
import { BlinkitProduct, Order } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';

import { PrintingService, PrintOrderItem } from '../../services/printingService';

export const BlinkitOrderAgainScreen: React.FC = () => {
  const { orders, setActiveScreen, setSelectedBlinkitProduct, setCurrentOrder, addToCart, selectedAddress } = useApp();
  const [popularProducts, setPopularProducts] = useState<BlinkitProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'grocery' | 'print'>('grocery');
  const [printOrders, setPrintOrders] = useState<PrintOrderItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const live = await ProductService.fetchProducts();
        setPopularProducts(live.map(mapProductToBlinkit));
      } catch (e) {}

      try {
        const prints = await PrintingService.fetchMyPrintOrders();
        if (prints) setPrintOrders(prints);
      } catch (e) {}
    })();
  }, []);

  const hasPastOrders = orders && orders.length > 0;
  const hasPrintOrders = printOrders && printOrders.length > 0;

  const handleOpenOrderDetail = (ord: Order) => {
    setCurrentOrder(ord);
    setActiveScreen('C24_OrderTracking');
  };

  const handleRepeatOrder = (ord: Order) => {
    if (ord.items && ord.items.length > 0) {
      ord.items.forEach((it) => {
        addToCart({
          id: it.productId || `prod_${Date.now()}`,
          name: it.name,
          brand: 'Worm Up',
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
      deliveryPartner: {
        name: 'Vikram Singh (Worm Up Express)',
        phone: '+91 98234 56789',
      },
    };
    setCurrentOrder(printTrackingObj);
    setActiveScreen('C24_OrderTracking');
  };

  return (
    <View style={styles.container}>
      {/* Pinned Gradient Header with Search */}
      <BlinkitHeader
        variant="gradient"
        etaLabel="Delivery in"
        etaTime="9 minutes"
        searchPlaceholder='Search "past items, prints, milk"'
        showCategoryTabs={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Segmented Tab: Grocery Orders vs Print Orders */}
        <View style={styles.orderTypeTabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('grocery')}
            style={[styles.orderTypeTab, activeTab === 'grocery' && styles.orderTypeTabActive]}
          >
            <Ionicons
              name="basket"
              size={15}
              color={activeTab === 'grocery' ? '#FFFFFF' : COLORS.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.orderTypeTabText, activeTab === 'grocery' && styles.orderTypeTabTextActive]}>
              Grocery Orders ({orders?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('print')}
            style={[styles.orderTypeTab, activeTab === 'print' && styles.orderTypeTabActive]}
          >
            <Ionicons
              name="print"
              size={15}
              color={activeTab === 'print' ? '#FFFFFF' : COLORS.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.orderTypeTabText, activeTab === 'print' && styles.orderTypeTabTextActive]}>
              Print Orders ({printOrders?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'print' ? (
          /* Print Orders List */
          hasPrintOrders ? (
            <View style={styles.pastOrdersContainer}>
              <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Your Print Orders</Text>
              {printOrders.map((pOrd) => {
                const isDelivered = pOrd.status === 'DELIVERED';
                const dateStr = pOrd.createdAt
                  ? new Date(pOrd.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

                return (
                  <View key={pOrd._id || pOrd.printOrderNumber} style={styles.pastOrderCard}>
                    <View style={styles.orderHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {pOrd.thumbnailUrl || pOrd.fileUrl ? (
                          <Image
                            source={{ uri: pOrd.thumbnailUrl || pOrd.fileUrl }}
                            style={styles.printOrderThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.printOrderIcon}>
                            <Ionicons name="document-text" size={24} color={COLORS.purple} />
                          </View>
                        )}
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.orderNumberText}>#{pOrd.printOrderNumber}</Text>
                          <Text style={styles.orderDateText}>{dateStr}</Text>
                        </View>
                      </View>
                      <View style={styles.statusAndArrowRow}>
                        <View
                          style={[
                            styles.orderStatusBadge,
                            isDelivered ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#F3E8FF' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.orderStatusText,
                              isDelivered ? { color: '#15803D' } : { color: COLORS.purple },
                            ]}
                          >
                            {isDelivered ? '✓ Delivered' : '⚡ Printing'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.orderItemRow}>
                      <Text style={styles.itemBullet}>🖨️</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {pOrd.originalFileName}
                      </Text>
                      <Text style={styles.itemPrice}>₹{pOrd.totalAmount}</Text>
                    </View>

                    <Text style={styles.printSpecsSub}>
                      {pOrd.pageCount} pgs • {pOrd.isColor ? 'Color' : 'B&W'} • {pOrd.isDoubleSided ? 'Double Sided' : 'Single Sided'} • {pOrd.paperQuality} • {pOrd.numberOfCopies} {pOrd.numberOfCopies > 1 ? 'copies' : 'copy'}
                    </Text>

                    <View style={styles.orderFooterRow}>
                      <Text style={styles.orderTotalText}>Total: ₹{pOrd.totalAmount}</Text>
                      <View style={styles.footerButtonsGroup}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleOpenPrintDetail(pOrd)}
                          style={styles.viewDetailsBtn}
                        >
                          <Text style={styles.viewDetailsBtnText}>Details ›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setActiveScreen('Blinkit_Print')}
                          style={styles.reorderBtn}
                        >
                          <Ionicons name="print-outline" size={14} color={COLORS.white} />
                          <Text style={styles.reorderBtnText}>Repeat Print</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.onboardingBannerContainer}>
              <Ionicons name="print-outline" size={54} color={COLORS.purple} style={{ marginBottom: 12 }} />
              <Text style={[TYPOGRAPHY.headingLg, styles.onboardingHeading]}>No Print Orders Yet</Text>
              <Text style={[TYPOGRAPHY.bodySm, styles.onboardingSubtext]}>
                Get documents, college assignments, and resumes printed & delivered to your doorstep in 10 minutes!
              </Text>
              <TouchableOpacity
                onPress={() => setActiveScreen('Blinkit_Print')}
                style={[styles.reorderBtn, { marginTop: 12 }]}
              >
                <Ionicons name="print-outline" size={16} color={COLORS.white} />
                <Text style={styles.reorderBtnText}>Open Print Store</Text>
              </TouchableOpacity>
            </View>
          )
        ) : hasPastOrders ? (
          /* Real Past Grocery Orders Section */
          <View style={styles.pastOrdersContainer}>
            <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Your Past Orders</Text>
            {orders.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                activeOpacity={0.88}
                onPress={() => handleOpenOrderDetail(ord)}
                style={styles.pastOrderCard}
                accessibilityLabel={`View details for order ${ord.orderNumber}`}
              >
                <View style={styles.orderHeaderRow}>
                  <View>
                    <Text style={styles.orderNumberText}>{ord.orderNumber}</Text>
                    <Text style={styles.orderDateText}>{ord.date}</Text>
                  </View>
                  <View style={styles.statusAndArrowRow}>
                    <View style={styles.orderStatusBadge}>
                      <Text style={styles.orderStatusText}>{ord.status}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.purple} style={{ marginLeft: 6 }} />
                  </View>
                </View>

                <View style={styles.divider} />

                {ord.items.map((item, idx) => (
                  <View key={`${ord.id}_${idx}`} style={styles.orderItemRow}>
                    <Text style={styles.itemBullet}>•</Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name} × {item.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                ))}

                <View style={styles.orderFooterRow}>
                  <Text style={styles.orderTotalText}>Total: ₹{ord.totalAmount}</Text>
                  <View style={styles.footerButtonsGroup}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenOrderDetail(ord)}
                      style={styles.viewDetailsBtn}
                    >
                      <Text style={styles.viewDetailsBtnText}>Details ›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleRepeatOrder(ord)}
                      style={styles.reorderBtn}
                    >
                      <AppIcon name="shopping-bag" size={14} color={COLORS.white} />
                      <Text style={styles.reorderBtnText}>Repeat Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Empty / Onboarding State Banner with Seamless Transparent WormUp Illustration */
          <View style={styles.onboardingBannerContainer}>
            <Image
              source={require('../../../assets/wormup_reorder_illustration.png')}
              style={styles.reorderIllustrationImage}
              resizeMode="contain"
            />

            <Text style={[TYPOGRAPHY.headingLg, styles.onboardingHeading]}>
              Reordering will be easy
            </Text>
            <Text style={[TYPOGRAPHY.bodySm, styles.onboardingSubtext]}>
              Items you order will show up here so you can buy them again easily
            </Text>
          </View>
        )}

        {/* Dynamic Bestsellers Section from MongoDB */}
        <View style={styles.bestsellersSection}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>
            Bestsellers
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productRail}
          >
            {popularProducts.map((prod) => (
              <BlinkitProductCard
                key={prod.id}
                product={prod}
                variant="horizontal"
              />
            ))}
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
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  onboardingBannerContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  reorderIllustrationImage: {
    width: 240,
    height: 200,
    marginBottom: 16,
  },
  onboardingHeading: {
    textAlign: 'center',
    color: COLORS.navy,
    fontWeight: '700',
    marginBottom: 6,
  },
  onboardingSubtext: {
    textAlign: 'center',
    color: COLORS.textMuted,
    maxWidth: 290,
    lineHeight: 18,
  },
  pastOrdersContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pastOrderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderDateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderStatusBadge: {
    backgroundColor: '#E6F9F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemBullet: {
    marginRight: 6,
    color: COLORS.hotPink,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusAndArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  footerButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8F6FE',
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.25)',
  },
  viewDetailsBtnText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reorderBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bestsellersSection: {
    marginTop: 16,
    paddingLeft: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: COLORS.navy,
    fontWeight: '700',
  },
  productRail: {
    paddingRight: 16,
  },
  orderTypeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  orderTypeTabActive: {
    backgroundColor: COLORS.navy,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTypeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  orderTypeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  printOrderThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  printOrderIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printSpecsSub: {
    fontSize: 11.5,
    color: COLORS.purple,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
});
