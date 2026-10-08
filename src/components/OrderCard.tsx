import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export interface OrderCardItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  weight?: string;
  variant?: string;
  image?: ImageSourcePropType;
  imageUrl?: string;
}

export interface OrderCardProps {
  order?: any;
  orderId?: string;
  orderNumber?: string;
  status?: string;
  placedAt?: Date | string;
  date?: string;
  items?: OrderCardItem[];
  totalPaid?: number;
  coinsEarned?: number;
  riderName?: string;
  riderRating?: number;
  onPressDetails?: () => void;
  onPressReorder?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  orderId,
  orderNumber,
  status,
  placedAt,
  date,
  items,
  totalPaid,
  coinsEarned,
  riderName,
  riderRating,
  onPressDetails,
  onPressReorder,
}) => {
  // Resolve props from either explicit props or order object
  const finalId = orderId || order?.id || order?._id || '';
  const finalOrderNumber = orderNumber || order?.orderNumber || '#W000000';
  const rawStatus = (status || order?.status || 'PLACED').toUpperCase();
  const finalTotal = totalPaid ?? order?.totalAmount ?? 0;
  const finalItems: OrderCardItem[] = items || order?.items || [];
  const finalDate = date || order?.date || (placedAt ? new Date(placedAt).toLocaleDateString() : 'Just now');
  const finalCoins = coinsEarned ?? order?.coinsDiscount ?? 0;
  const finalRider = riderName || order?.deliveryPartner?.name || order?.deliveryPartnerId?.fullName;

  // Total items count
  const totalItemCount =
    finalItems.length > 0
      ? finalItems.reduce((acc, it) => acc + (it.quantity || 1), 0)
      : order?.itemCount || 1;

  // Status Styling Configuration
  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'DELIVERED':
        return {
          label: 'DELIVERED',
          bg: 'rgba(16, 185, 129, 0.12)',
          text: '#10B981',
          dot: '#10B981',
        };
      case 'CANCELLED':
      case 'REJECTED':
        return {
          label: 'CANCELLED',
          bg: 'rgba(239, 68, 68, 0.12)',
          text: '#EF4444',
          dot: '#EF4444',
        };
      case 'PACKING':
      case 'PREPARING':
      case 'CONFIRMED':
        return {
          label: 'PACKING',
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#F59E0B',
          dot: '#F59E0B',
        };
      case 'OUT_FOR_DELIVERY':
      case 'DISPATCHED':
        return {
          label: 'OUT FOR DELIVERY',
          bg: 'rgba(59, 130, 246, 0.12)',
          text: '#3B82F6',
          dot: '#3B82F6',
        };
      case 'PLACED':
      default:
        return {
          label: 'PLACED',
          bg: 'rgba(139, 92, 246, 0.12)',
          text: '#8B5CF6',
          dot: '#8B5CF6',
        };
    }
  };

  const statusConfig = getStatusConfig(rawStatus);

  // Helper to resolve product image
  const resolveItemImage = (it: OrderCardItem): ImageSourcePropType => {
    if (it.image) return it.image;
    if (it.imageUrl) return { uri: it.imageUrl };
    const n = (it.name || '').toLowerCase();
    if (n.includes('apple')) {
      return { uri: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80' };
    }
    if (n.includes('tomato')) {
      return { uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' };
    }
    if (n.includes('milk') || n.includes('amul')) {
      return { uri: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' };
    }
    if (n.includes('paneer')) {
      return { uri: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80' };
    }
    return require('../../assets/order_again_box.png');
  };

  const displayedItems = finalItems.length > 0 ? finalItems.slice(0, 2) : [];
  const remainingCount = finalItems.length > 2 ? finalItems.length - 2 : 0;

  return (
    <View style={styles.cardContainer}>
      {/* 1. Header Row */}
      <View style={styles.headerSection}>
        {/* Row 1: Order Number + Status Badge */}
        <View style={styles.headerTopRow}>
          <Text style={styles.orderNumberText} numberOfLines={1}>
            {finalOrderNumber}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
            <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Row 2: Date & Meta Info */}
        <View style={styles.headerMetaRow}>
          <Text style={styles.metaText}>
            {finalDate} · {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {/* 2. Product Rows (Max 2 displayed + "+N more") */}
      <View style={styles.productsSection}>
        {displayedItems.length > 0 ? (
          displayedItems.map((item, idx) => {
            const itemImage = resolveItemImage(item);
            const variantText = item.variant || item.weight || (item.name.toLowerCase().includes('apple') ? '500 g' : '1 unit');

            return (
              <View key={idx} style={[styles.productRow, idx > 0 && styles.productRowBorder]}>
                {/* 60x60 Product Thumbnail */}
                <View style={styles.imageBox}>
                  <Image source={itemImage} style={styles.productImage} resizeMode="cover" />
                </View>

                {/* 3-line Text Column: Name / Variant+Qty / Price */}
                <View style={styles.productInfoCol}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productVariant}>
                    {variantText} × {item.quantity || 1}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.productRow}>
            <View style={styles.imageBox}>
              <Image
                source={require('../../assets/order_again_box.png')}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.productInfoCol}>
              <Text style={styles.productName}>Fresh Grocery Items</Text>
              <Text style={styles.productVariant}>1 bundle × 1</Text>
              <Text style={styles.productPrice}>₹{finalTotal}</Text>
            </View>
          </View>
        )}

        {/* Multi-item remaining count label */}
        {remainingCount > 0 && (
          <View style={styles.moreItemsRow}>
            <Text style={styles.moreItemsText}>
              + {remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}
      </View>

      {/* 3. Rider Info / Coins Banner (Optional Polish) */}
      {finalRider && rawStatus === 'DELIVERED' && (
        <View style={styles.riderBanner}>
          <Ionicons name="bicycle-outline" size={13} color="#62677A" />
          <Text style={styles.riderBannerText}>
            Delivered by {finalRider} {riderRating ? `· ⭐ ${riderRating}` : ''}
          </Text>
        </View>
      )}

      {/* 4. Emphasized Total Row */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total Paid</Text>
        <Text style={styles.totalAmount}>₹{finalTotal}</Text>
      </View>

      {/* 5. Balanced Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressDetails}
          style={styles.detailsBtn}
        >
          <Ionicons name="document-text-outline" size={15} color="#101A4D" style={{ marginRight: 6 }} />
          <Text style={styles.detailsBtnText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPressReorder}
          style={styles.repeatOrderBtn}
        >
          <Ionicons name="repeat-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.repeatOrderBtnText}>Repeat Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EAF1',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F8',
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101A4D',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerMetaRow: {
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#62677A',
  },
  productsSection: {
    paddingVertical: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  productRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F1F3F8',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101A4D',
    marginBottom: 2,
  },
  productVariant: {
    fontSize: 12,
    fontWeight: '500',
    color: '#62677A',
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101A4D',
  },
  moreItemsRow: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  riderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 8,
  },
  riderBannerText: {
    fontSize: 11,
    color: '#62677A',
    fontWeight: '500',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F8',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F8',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#62677A',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E9EAF1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101A4D',
  },
  repeatOrderBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EC4A9D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOrderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
