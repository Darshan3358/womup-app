import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { AppIcon } from '../../components/common/AppIcon';
import { useApp } from '../../context/AppContext';
import {
  PrintingService,
  PrintServicesConfig,
  PrintQuoteResult,
  PrintOrderItem,
} from '../../services/printingService';

interface SelectedDocument {
  name: string;
  size: string;
  pageCount: number;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
  remoteUrl?: string;
  rawFile?: any;
}

const generateCompactThumbnail = (file: any): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !file) return resolve('');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new (window as any).Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height *= maxDim / width;
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width *= maxDim / height;
                height = maxDim;
              }
            }
            canvas.width = Math.round(width);
            canvas.height = Math.round(height);
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch (err) {
            resolve('');
          }
        };
        img.onerror = () => resolve('');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } catch (e) {
      resolve('');
    }
  });
};

export const BlinkitPrintScreen: React.FC = () => {
  const { user, selectedAddress, setCurrentOrder, setActiveScreen, orders } = useApp();

  const [config, setConfig] = useState<PrintServicesConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Upload & Configurator State
  const [selectedDoc, setSelectedDoc] = useState<SelectedDocument | null>(null);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Print Preferences
  const [pageCount, setPageCount] = useState(5);
  const [numberOfCopies, setNumberOfCopies] = useState(1);
  const [isColor, setIsColor] = useState(false);
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  const [paperQuality, setPaperQuality] = useState('70 GSM Standard');
  const [binding, setBinding] = useState('none');

  // Real-time calculated quote
  const [quote, setQuote] = useState<PrintQuoteResult | null>(null);
  const [recentPrintOrders, setRecentPrintOrders] = useState<PrintOrderItem[]>([]);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // History Filter & Detail Modal State
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState('All');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<PrintOrderItem | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Fetch dynamic Print Store config from MongoDB Atlas backend
  useEffect(() => {
    let isMounted = true;
    PrintingService.fetchConfig()
      .then((data) => {
        if (isMounted && data) {
          setConfig(data);
          if (data.paperQualities?.[0]) {
            setPaperQuality(data.paperQualities[0].label);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingConfig(false);
      });

    // Fetch user's existing print orders
    refreshPrintOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshPrintOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const list = await PrintingService.fetchMyPrintOrders();
      if (list && Array.isArray(list)) {
        setRecentPrintOrders(list);
      }
    } catch (e) {
      console.warn('Error fetching print orders', e);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  // 2. Real-time quote recalculation whenever parameters change
  useEffect(() => {
    let isMounted = true;
    PrintingService.calculateQuote({
      pageCount,
      numberOfCopies,
      isColor,
      isDoubleSided,
      paperQuality,
      binding,
    }).then((res) => {
      if (isMounted && res) setQuote(res);
    });

    return () => {
      isMounted = false;
    };
  }, [pageCount, numberOfCopies, isColor, isDoubleSided, paperQuality, binding]);

  // 3. File picker trigger
  const handleUploadFiles = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        promptDocumentSelection();
      }
    } else {
      promptDocumentSelection();
    }
  };

  const handleWebFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const isImage = file.type?.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(file.name);

      let previewUrl = '';
      if (typeof window !== 'undefined' && window.URL && file) {
        try {
          previewUrl = window.URL.createObjectURL(file);
        } catch (e) {}
      }

      const estimatedPages = isImage ? 1 : Math.max(1, Math.min(50, Math.round(file.size / 60000) || 4));

      const newDoc: SelectedDocument = {
        name: file.name,
        size: `${sizeMB} MB`,
        pageCount: estimatedPages,
        fileType: file.type || (isImage ? 'image/png' : 'application/pdf'),
        previewUrl,
        thumbnailUrl: previewUrl,
        rawFile: file,
      };

      setSelectedDoc(newDoc);
      setPageCount(estimatedPages);
      setIsConfigModalVisible(true);

      // Generate compact thumbnail for database persistence
      if (isImage) {
        generateCompactThumbnail(file).then((compact) => {
          if (compact) {
            setSelectedDoc((prev) => (prev ? { ...prev, thumbnailUrl: compact } : null));
          }
        });
      }

      // Async background upload to Cloudinary/server if available
      PrintingService.uploadDocumentFile(file).then((res) => {
        if (res?.secure_url) {
          setSelectedDoc((prev) => (prev ? { ...prev, remoteUrl: res.secure_url, thumbnailUrl: res.secure_url } : null));
        }
      });
    }
  };

  const promptDocumentSelection = () => {
    Alert.alert(
      'Select Document / Image to Print',
      'Choose a sample document or upload from your device:',
      [
        {
          text: '📸 Screenshot / Photo (1 page)',
          onPress: () => {
            const mockPreview = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80';
            setSelectedDoc({
              name: 'Screenshot 2026-09-08 at 10.56.33 PM.png',
              size: '1.4 MB',
              pageCount: 1,
              previewUrl: mockPreview,
              thumbnailUrl: mockPreview,
              fileType: 'image/png',
            });
            setPageCount(1);
            setIsConfigModalVisible(true);
          },
        },
        {
          text: '📄 College_Assignment.pdf (5 pages)',
          onPress: () => {
            setSelectedDoc({ name: 'College_Assignment.pdf', size: '1.4 MB', pageCount: 5, fileType: 'application/pdf' });
            setPageCount(5);
            setIsConfigModalVisible(true);
          },
        },
        {
          text: '📑 Resume_Final_2026.pdf (2 pages)',
          onPress: () => {
            setSelectedDoc({ name: 'Resume_Final_2026.pdf', size: '0.8 MB', pageCount: 2, fileType: 'application/pdf' });
            setPageCount(2);
            setIsConfigModalVisible(true);
          },
        },
        {
          text: '📁 Project_Report_20_Pages.pdf (20 pages)',
          onPress: () => {
            setSelectedDoc({ name: 'Project_Report_20_Pages.pdf', size: '3.2 MB', pageCount: 20, fileType: 'application/pdf' });
            setPageCount(20);
            setIsConfigModalVisible(true);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // 4. Create print order and send to MongoDB Atlas
  const handleConfirmPrintOrder = async () => {
    if (!selectedDoc) return;
    setIsSubmitting(true);

    try {
      const created = await PrintingService.createPrintOrder({
        fileName: selectedDoc.name,
        pageCount,
        numberOfCopies,
        isColor,
        isDoubleSided,
        paperQuality,
        binding,
        fileUrl: selectedDoc.remoteUrl || selectedDoc.previewUrl || '',
        thumbnailUrl: selectedDoc.thumbnailUrl || selectedDoc.remoteUrl || '',
        fileType: selectedDoc.fileType || '',
        fileSize: selectedDoc.size,
        deliveryAddress: selectedAddress?.areaLandmark || 'Home — Prahlad Nagar, Ahmedabad',
        storageKey: selectedDoc.remoteUrl || `s3://wormup-prints/${Date.now()}-${selectedDoc.name}`,
      });

      const orderNumber = created?.data?.printOrderNumber || `PRINT-${Date.now().toString().slice(-6)}`;
      const totalCost = quote?.totalAmount || 15;

      // Optimistically add to recent orders list so it appears immediately!
      const newOrderForList: PrintOrderItem = {
        _id: created?.data?._id || `print_${Date.now()}`,
        printOrderNumber: orderNumber,
        originalFileName: selectedDoc.name,
        thumbnailUrl: selectedDoc.thumbnailUrl || selectedDoc.previewUrl,
        fileUrl: selectedDoc.remoteUrl || selectedDoc.previewUrl,
        fileType: selectedDoc.fileType,
        fileSize: selectedDoc.size,
        pageCount,
        numberOfCopies,
        isColor,
        isDoubleSided,
        paperQuality,
        binding,
        pricePerPage: quote?.ratePerPage || 3,
        totalAmount: totalCost,
        deliveryAddress: selectedAddress?.areaLandmark || 'Home — Prahlad Nagar, Ahmedabad',
        status: 'PRINTING',
        createdAt: new Date().toISOString(),
      };

      setSelectedHistoryFilter('All');
      setRecentPrintOrders((prev) => [newOrderForList, ...prev.filter(o => o.printOrderNumber !== orderNumber)]);

      setIsConfigModalVisible(false);
      setIsSubmitting(false);

      // Immediately refresh live orders from MongoDB in background
      refreshPrintOrders();

      // Create an Order representation for tracking screen
      const printOrderObj = {
        id: `print_${Date.now()}`,
        orderNumber,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'PLACED' as any,
        items: [
          {
            productId: 'print_service_item',
            name: `${selectedDoc.name} (${pageCount} pgs × ${numberOfCopies} ${numberOfCopies > 1 ? 'copies' : 'copy'}, ${isColor ? 'Color' : 'B&W'})`,
            quantity: numberOfCopies,
            price: totalCost,
          },
        ],
        itemCount: numberOfCopies,
        subtotal: totalCost,
        discount: 0,
        shoppingCoinsUsed: 0,
        deliveryFee: 0,
        totalAmount: totalCost,
        deliveryAddress: selectedAddress,
        deliverySlot: 'Express (10 minutes)',
        paymentMethod: 'Cash on Delivery / Online',
        deliveryPartner: undefined,
      };

      setCurrentOrder(printOrderObj);

      Alert.alert(
        'Print Order Placed! 🎉',
        `Your document has been saved to the database and is printing.\nOrder ID: ${orderNumber}\nDelivery: Express in 10 minutes to ${selectedAddress.areaLandmark || 'your address'}.`,
        [
          {
            text: 'Track Order',
            onPress: () => setActiveScreen('C24_OrderTracking'),
          },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err?.message || 'Could not place print order. Please try again.');
    }
  };

  const handleReorder = (order: PrintOrderItem) => {
    setSelectedDoc({
      name: order.originalFileName,
      size: order.fileSize || '1.2 MB',
      pageCount: order.pageCount,
      previewUrl: order.thumbnailUrl || order.fileUrl,
      thumbnailUrl: order.thumbnailUrl,
      fileType: order.fileType,
      remoteUrl: order.fileUrl,
    });
    setPageCount(order.pageCount);
    setNumberOfCopies(order.numberOfCopies);
    setIsColor(order.isColor);
    setIsDoubleSided(order.isDoubleSided);
    setPaperQuality(order.paperQuality);
    setBinding(order.binding || 'none');
    setIsDetailModalVisible(false);
    setIsConfigModalVisible(true);
  };

  const basePrice = config?.basePrice || 3;
  const deliveryTime = config?.deliveryTime || '10 minutes';

  // Filter orders based on tab selection
  const filteredOrders = recentPrintOrders.filter((ord) => {
    if (selectedHistoryFilter === 'All') return true;
    if (selectedHistoryFilter === 'Processing') {
      return ord.status === 'UPLOADED' || ord.status === 'PROCESSING';
    }
    if (selectedHistoryFilter === 'Printing') {
      return ord.status === 'PRINTING';
    }
    if (selectedHistoryFilter === 'Ready') {
      return ord.status === 'READY';
    }
    if (selectedHistoryFilter === 'Delivered') {
      return ord.status === 'DELIVERED';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Hidden Web file input */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef as any}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}

      {/* Header: Prints in 10 minutes */}
      <BlinkitHeader
        variant="gradient"
        etaLabel="Prints in"
        etaTime={deliveryTime}
        searchPlaceholder='Search "stapler, binders"'
        showCategoryTabs={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Background Ripple & Centered Title Block */}
        <View style={styles.titleBlock}>
          <View style={styles.rippleOuter} />
          <View style={styles.rippleInner} />

          <Text style={styles.pageTitle}>Worm Up Print Store</Text>
          <Text style={styles.pageSubtitle}>
            Secure doorstep document printing in {deliveryTime}
          </Text>
        </View>

        {/* Documents Card with 3D Stack Illustration */}
        <View style={styles.documentsCard}>
          <View style={styles.docCardTopRow}>
            {/* Left Specifications */}
            <View style={styles.docLeft}>
              <Text style={styles.docCardTitle}>Documents & Reports</Text>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Text style={styles.diamondBullet}>◆</Text>
                  <Text style={styles.bulletText}>Price starting at ₹{basePrice}/page</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.diamondBullet}>◆</Text>
                  <Text style={styles.bulletText}>Paper quality: 70 & 80 GSM Bond</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.diamondBullet}>◆</Text>
                  <Text style={styles.bulletText}>Single & Double side prints</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.diamondBullet}>◆</Text>
                  <Text style={styles.bulletText}>Staple & Spiral binding available</Text>
                </View>
              </View>
            </View>

            {/* Right Stacked 3D Document Illustration */}
            <View style={styles.docIllustrationWrapper}>
              <Image
                source={require('../../../assets/print_documents_stack.png')}
                style={styles.docIllustrationImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Upload Files CTA */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleUploadFiles}
            style={styles.uploadButtonWrapper}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadButtonGradient}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>Upload Files to Print</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Trust Row: 3 Brand Badge Columns */}
        <View style={styles.trustRowContainer}>
          {/* Safe & Secure */}
          <View style={styles.trustCol}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="shield" size={20} color={COLORS.purple} />
            </View>
            <Text style={styles.trustTitle}>Safe & Secure</Text>
            <Text style={styles.trustSubtext}>Data auto-purged{'\n'}post delivery</Text>
          </View>

          {/* Fast Delivery */}
          <View style={styles.trustCol}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="zap" size={20} color={COLORS.purple} />
            </View>
            <Text style={styles.trustTitle}>Fast Delivery</Text>
            <Text style={styles.trustSubtext}>Doorstep in{'\n'}{deliveryTime}</Text>
          </View>

          {/* Lowest Prices */}
          <View style={styles.trustCol}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="tag" size={20} color={COLORS.purple} />
            </View>
            <Text style={styles.trustTitle}>Best Pricing</Text>
            <Text style={styles.trustSubtext}>Starting at{'\n'}₹{basePrice}/page</Text>
          </View>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningEmoji}>🔒</Text>
          <Text style={styles.warningText}>
            100% Confidential: All customer files are transmitted over TLS 1.3 and permanently purged after delivery.
          </Text>
        </View>

        {/* ─────────────────────────────────────────────────────────────
            MY PRINT ORDERS & HISTORY (Fetched live from MongoDB Atlas)
        ───────────────────────────────────────────────────────────── */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Print History & Orders</Text>
              <Text style={styles.historySubtitle}>Real-time print jobs saved in your database</Text>
            </View>
            <TouchableOpacity onPress={refreshPrintOrders} style={styles.refreshButton}>
              {isRefreshingOrders ? (
                <ActivityIndicator size="small" color={COLORS.purple} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={14} color={COLORS.purple} style={{ marginRight: 4 }} />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {['All', 'Processing', 'Printing', 'Ready', 'Delivered'].map((filter) => {
              const isActive = selectedHistoryFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedHistoryFilter(filter)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Order Cards or Empty State */}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <View style={styles.emptyHistoryIconCircle}>
                <Ionicons name="print-outline" size={32} color={COLORS.purple} />
              </View>
              <Text style={styles.emptyHistoryTitle}>No Print Orders in '{selectedHistoryFilter}'</Text>
              <Text style={styles.emptyHistorySub}>
                Upload files above to place an express 10-minute print order!
              </Text>
            </View>
          ) : (
            filteredOrders.map((ord: PrintOrderItem) => {
              const isDelivered = ord.status === 'DELIVERED';
              const dateStr = ord.createdAt
                ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <View key={ord._id || ord.printOrderNumber} style={styles.historyCard}>
                  {/* Top Row: File Thumbnail/Icon + Meta + Price */}
                  <View style={styles.historyCardTop}>
                    {ord.thumbnailUrl || ord.fileUrl ? (
                      <Image
                        source={{ uri: ord.thumbnailUrl || ord.fileUrl }}
                        style={styles.historyCardThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.historyCardIcon}>
                        <Ionicons name="document-text" size={26} color={COLORS.purple} />
                      </View>
                    )}

                    <View style={styles.historyCardInfo}>
                      <Text style={styles.historyCardFileName} numberOfLines={1}>
                        {ord.originalFileName}
                      </Text>
                      <Text style={styles.historyCardSpecs}>
                        {ord.pageCount} {ord.pageCount > 1 ? 'pages' : 'page'} • {ord.isColor ? 'Color' : 'B&W'} • {ord.isDoubleSided ? 'Double' : 'Single'}
                      </Text>
                      <Text style={styles.historyCardCopies}>
                        {ord.numberOfCopies} {ord.numberOfCopies > 1 ? 'copies' : 'copy'} • {ord.paperQuality || '70 GSM'}
                      </Text>
                    </View>

                    <View style={styles.historyCardPriceCol}>
                      <Text style={styles.historyCardPrice}>₹{ord.totalAmount}</Text>
                      <View
                        style={[
                          styles.historyStatusPill,
                          isDelivered ? styles.statusDelivered : styles.statusPrinting,
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyStatusText,
                            isDelivered ? styles.statusDeliveredText : styles.statusPrintingText,
                          ]}
                        >
                          {isDelivered ? '✓ Delivered' : '⚡ Printing'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Date & Order ID Row */}
                  <View style={styles.historyCardMetaRow}>
                    <Text style={styles.historyMetaNumber}>#{ord.printOrderNumber}</Text>
                    <Text style={styles.historyMetaDate}>{dateStr}</Text>
                  </View>

                  {/* Action Buttons: View Details & Reorder */}
                  <View style={styles.historyCardActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedOrderForDetail(ord);
                        setIsDetailModalVisible(true);
                      }}
                      style={styles.detailsBtn}
                    >
                      <Ionicons name="information-circle-outline" size={15} color={COLORS.navy} style={{ marginRight: 4 }} />
                      <Text style={styles.detailsBtnText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleReorder(ord)}
                      style={styles.reorderBtn}
                    >
                      <Ionicons name="reload-outline" size={15} color={COLORS.white} style={{ marginRight: 4 }} />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────
          PRINT CONFIGURATOR & QUOTE MODAL SHEET
      ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isConfigModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsConfigModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.configCard}>
            {/* Top Bar with Document info and close */}
            <View style={styles.configHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.configTitle}>Print Options</Text>
                <Text style={styles.configSubtitle} numberOfLines={1}>
                  {selectedDoc?.name || 'Document'} • {selectedDoc?.size || '1.2 MB'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsConfigModalVisible(false)}
                style={styles.closeCircleBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            {/* Document / Image Preview Banner */}
            <View style={styles.modalDocPreviewBanner}>
              {selectedDoc?.previewUrl || selectedDoc?.thumbnailUrl ? (
                <View style={styles.imagePreviewRow}>
                  <Image
                    source={{ uri: selectedDoc.previewUrl || selectedDoc.thumbnailUrl }}
                    style={styles.modalImageThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.previewMeta}>
                    <View style={styles.badgeRow}>
                      <View style={styles.imageTypeBadge}>
                        <Ionicons name="image" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.imageTypeBadgeText}>IMAGE FILE</Text>
                      </View>
                      <View style={styles.readyPill}>
                        <Text style={styles.readyPillText}>✓ 300 DPI Print Ready</Text>
                      </View>
                    </View>
                    <Text style={styles.previewNameText} numberOfLines={1}>
                      {selectedDoc.name}
                    </Text>
                    <Text style={styles.previewSizeText}>
                      Size: {selectedDoc.size} • {pageCount} {pageCount > 1 ? 'Pages' : 'Page'} • High Resolution
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePreviewRow}>
                  <View style={styles.docIconBox}>
                    <Ionicons name="document-text" size={26} color={COLORS.hotPink} />
                  </View>
                  <View style={styles.previewMeta}>
                    <View style={styles.badgeRow}>
                      <View style={styles.docTypeBadge}>
                        <Ionicons name="document-attach" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.imageTypeBadgeText}>PDF DOCUMENT</Text>
                      </View>
                      <View style={styles.readyPill}>
                        <Text style={styles.readyPillText}>✓ Verified</Text>
                      </View>
                    </View>
                    <Text style={styles.previewNameText} numberOfLines={1}>
                      {selectedDoc?.name || 'Document.pdf'}
                    </Text>
                    <Text style={styles.previewSizeText}>
                      {selectedDoc?.size || '1.2 MB'} • {pageCount} {pageCount > 1 ? 'Pages' : 'Page'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* 1. Page Count & Copies Steppers */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionLabel}>Pages & Copies</Text>
                <View style={styles.steppersRow}>
                  {/* Pages Stepper */}
                  <View style={styles.stepperBox}>
                    <Text style={styles.stepperLabel}>Total Pages</Text>
                    <View style={styles.stepperControl}>
                      <TouchableOpacity
                        onPress={() => setPageCount(Math.max(1, pageCount - 1))}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="remove" size={16} color={COLORS.navy} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{pageCount}</Text>
                      <TouchableOpacity
                        onPress={() => setPageCount(pageCount + 1)}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="add" size={16} color={COLORS.navy} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Copies Stepper */}
                  <View style={styles.stepperBox}>
                    <Text style={styles.stepperLabel}>Copies / Sets</Text>
                    <View style={styles.stepperControl}>
                      <TouchableOpacity
                        onPress={() => setNumberOfCopies(Math.max(1, numberOfCopies - 1))}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="remove" size={16} color={COLORS.navy} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{numberOfCopies}</Text>
                      <TouchableOpacity
                        onPress={() => setNumberOfCopies(numberOfCopies + 1)}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="add" size={16} color={COLORS.navy} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. Color Options */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionLabel}>Color Mode</Text>
                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    onPress={() => setIsColor(false)}
                    style={[styles.choiceChip, !isColor && styles.choiceChipActive]}
                  >
                    <Ionicons name="contrast-outline" size={16} color={!isColor ? COLORS.hotPink : COLORS.textMuted} />
                    <Text style={[styles.choiceChipText, !isColor && styles.choiceChipTextActive]}>
                      Black & White (₹3/pg)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsColor(true)}
                    style={[styles.choiceChip, isColor && styles.choiceChipActive]}
                  >
                    <Ionicons name="color-palette-outline" size={16} color={isColor ? COLORS.hotPink : COLORS.textMuted} />
                    <Text style={[styles.choiceChipText, isColor && styles.choiceChipTextActive]}>
                      Full Color (₹10/pg)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Sides Option */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionLabel}>Print Sides</Text>
                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    onPress={() => setIsDoubleSided(false)}
                    style={[styles.choiceChip, !isDoubleSided && styles.choiceChipActive]}
                  >
                    <Ionicons name="document-outline" size={16} color={!isDoubleSided ? COLORS.hotPink : COLORS.textMuted} />
                    <Text style={[styles.choiceChipText, !isDoubleSided && styles.choiceChipTextActive]}>
                      Single Sided
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsDoubleSided(true)}
                    style={[styles.choiceChip, isDoubleSided && styles.choiceChipActive]}
                  >
                    <Ionicons name="copy-outline" size={16} color={isDoubleSided ? COLORS.hotPink : COLORS.textMuted} />
                    <Text style={[styles.choiceChipText, isDoubleSided && styles.choiceChipTextActive]}>
                      Back to Back (Double Side)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. Paper Quality */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionLabel}>Paper Quality (GSM)</Text>
                <View style={styles.verticalOptionsCol}>
                  {(config?.paperQualities || [
                    { id: '70gsm', label: '70 GSM Standard', extraPricePerPage: 0, description: 'Standard crisp paper' },
                    { id: '80gsm', label: '80 GSM Premium Bond', extraPricePerPage: 1, description: 'Thicker paper, zero see-through' },
                    { id: '100gsm', label: '100 GSM Executive Gloss', extraPricePerPage: 3, description: 'Ultra-thick paper for certificates & CVs' },
                  ]).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setPaperQuality(item.label)}
                      style={[styles.radioRow, paperQuality === item.label && styles.radioRowActive]}
                    >
                      <Ionicons
                        name={paperQuality === item.label ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={paperQuality === item.label ? COLORS.hotPink : COLORS.border}
                      />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.radioLabel, paperQuality === item.label && styles.radioLabelActive]}>
                          {item.label} {item.extraPricePerPage > 0 ? `(+₹${item.extraPricePerPage}/pg)` : ''}
                        </Text>
                        <Text style={styles.radioSubtext}>{item.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 5. Binding Options */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionLabel}>Finishing & Binding</Text>
                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    onPress={() => setBinding('none')}
                    style={[styles.choiceChip, binding === 'none' && styles.choiceChipActive]}
                  >
                    <Text style={[styles.choiceChipText, binding === 'none' && styles.choiceChipTextActive]}>
                      None (Loose)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setBinding('staple')}
                    style={[styles.choiceChip, binding === 'staple' && styles.choiceChipActive]}
                  >
                    <Text style={[styles.choiceChipText, binding === 'staple' && styles.choiceChipTextActive]}>
                      Corner Stapled (+₹5)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setBinding('spiral')}
                    style={[styles.choiceChip, binding === 'spiral' && styles.choiceChipActive]}
                  >
                    <Text style={[styles.choiceChipText, binding === 'spiral' && styles.choiceChipTextActive]}>
                      Spiral Binding (+₹25)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Live Price Calculation Breakdown */}
              <View style={styles.calculationBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>
                    {pageCount} pgs × ₹{quote?.ratePerPage || 3} ({isColor ? 'Color' : 'B&W'}) × {numberOfCopies} {numberOfCopies > 1 ? 'copies' : 'copy'}
                  </Text>
                  <Text style={styles.calcValue}>
                    ₹{(pageCount * (quote?.ratePerPage || 3) * numberOfCopies)}
                  </Text>
                </View>

                {quote?.bindingPrice && quote.bindingPrice > 0 ? (
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Binding ({quote.binding}) × {numberOfCopies}</Text>
                    <Text style={styles.calcValue}>+₹{quote.bindingPrice * numberOfCopies}</Text>
                  </View>
                ) : null}

                <View style={styles.calcDivider} />

                <View style={styles.calcTotalRow}>
                  <View>
                    <Text style={styles.calcTotalTitle}>Total Estimate</Text>
                    <Text style={styles.calcEtaText}>⚡ Delivering in {deliveryTime}</Text>
                  </View>
                  <Text style={styles.calcTotalAmount}>₹{quote?.totalAmount || 15}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom CTA to place print order */}
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isSubmitting}
              onPress={handleConfirmPrintOrder}
              style={styles.confirmBtnWrapper}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="print-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmBtnText}>
                      Proceed to Print Order (₹{quote?.totalAmount || 15})
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          PRINT ORDER DETAILS MODAL (View Details)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>Print Order Details</Text>
                <Text style={styles.detailSubtitle}>#{selectedOrderForDetail?.printOrderNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDetailModalVisible(false)}
                style={styles.closeCircleBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Document Overview with Thumbnail/Icon */}
              <View style={styles.detailDocBanner}>
                {selectedOrderForDetail?.thumbnailUrl || selectedOrderForDetail?.fileUrl ? (
                  <Image
                    source={{ uri: selectedOrderForDetail.thumbnailUrl || selectedOrderForDetail.fileUrl }}
                    style={styles.detailDocThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.detailDocIcon}>
                    <Ionicons name="document-text" size={30} color={COLORS.purple} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.detailFileName} numberOfLines={2}>
                    {selectedOrderForDetail?.originalFileName}
                  </Text>
                  <Text style={styles.detailFileMeta}>
                    {selectedOrderForDetail?.pageCount} {selectedOrderForDetail?.pageCount && selectedOrderForDetail.pageCount > 1 ? 'pages' : 'page'} • {selectedOrderForDetail?.numberOfCopies} {selectedOrderForDetail?.numberOfCopies && selectedOrderForDetail.numberOfCopies > 1 ? 'copies' : 'copy'}
                  </Text>
                  <Text style={styles.detailFileMetaSub}>
                    {selectedOrderForDetail?.paperQuality} • {selectedOrderForDetail?.isColor ? 'Color' : 'Black & White'}
                  </Text>
                </View>
              </View>

              {/* Status Timeline */}
              <View style={styles.timelineBox}>
                <Text style={styles.timelineHeader}>Order Progression</Text>
                <View style={styles.timelineRow}>
                  <View style={styles.stepDotActive} />
                  <Text style={styles.stepTextActive}>Order Placed & Confirmed ✓</Text>
                </View>
                <View style={styles.stepLineActive} />
                <View style={styles.timelineRow}>
                  <View style={styles.stepDotActive} />
                  <Text style={styles.stepTextActive}>Document Transferred Securely ✓</Text>
                </View>
                <View style={styles.stepLineActive} />
                <View style={styles.timelineRow}>
                  <View style={styles.stepDotActive} />
                  <Text style={styles.stepTextActive}>
                    {selectedOrderForDetail?.status === 'DELIVERED' ? 'High-Speed Laser Printing Completed ✓' : 'Laser Printing in Progress (10 mins) ⚡'}
                  </Text>
                </View>
                <View style={styles.stepLineActive} />
                <View style={styles.timelineRow}>
                  <View style={selectedOrderForDetail?.status === 'DELIVERED' ? styles.stepDotActive : styles.stepDotPending} />
                  <Text style={selectedOrderForDetail?.status === 'DELIVERED' ? styles.stepTextActive : styles.stepTextPending}>
                    {selectedOrderForDetail?.status === 'DELIVERED' ? 'Delivered to Doorstep ✓' : 'Express Doorstep Delivery in 10 mins'}
                  </Text>
                </View>
              </View>

              {/* Specifications Card */}
              <View style={styles.specsBox}>
                <Text style={styles.specsTitle}>Print Specifications</Text>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Color Mode</Text>
                  <Text style={styles.specValue}>{selectedOrderForDetail?.isColor ? 'Full Color (₹10/pg)' : 'Black & White (₹3/pg)'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Print Sides</Text>
                  <Text style={styles.specValue}>{selectedOrderForDetail?.isDoubleSided ? 'Back to Back (Double Sided)' : 'Single Sided'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Paper Quality</Text>
                  <Text style={styles.specValue}>{selectedOrderForDetail?.paperQuality || '70 GSM Standard'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Finishing & Binding</Text>
                  <Text style={styles.specValue}>
                    {selectedOrderForDetail?.binding === 'staple'
                      ? 'Corner Stapled (+₹5)'
                      : selectedOrderForDetail?.binding === 'spiral'
                      ? 'Spiral Ring Binding (+₹25)'
                      : 'No Binding (Loose Sheets)'}
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Total Copies</Text>
                  <Text style={styles.specValue}>{selectedOrderForDetail?.numberOfCopies} Set(s)</Text>
                </View>
              </View>

              {/* Price Breakdown */}
              <View style={styles.detailPricingBox}>
                <Text style={styles.specsTitle}>Price Breakdown</Text>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Print Pages Charges</Text>
                  <Text style={styles.specValue}>
                    ₹{selectedOrderForDetail?.totalAmount ? selectedOrderForDetail.totalAmount - (selectedOrderForDetail.bindingPrice || 0) : 0}
                  </Text>
                </View>
                {selectedOrderForDetail?.bindingPrice && selectedOrderForDetail.bindingPrice > 0 ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Binding Extra</Text>
                    <Text style={styles.specValue}>+₹{selectedOrderForDetail.bindingPrice}</Text>
                  </View>
                ) : null}
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Delivery Fee</Text>
                  <Text style={[styles.specValue, { color: '#059669' }]}>FREE (Express 10 mins)</Text>
                </View>
                <View style={styles.calcDivider} />
                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { fontWeight: '800', color: COLORS.navy }]}>Total Paid</Text>
                  <Text style={[styles.specValue, { fontSize: 18, fontWeight: '900', color: COLORS.hotPink }]}>
                    ₹{selectedOrderForDetail?.totalAmount}
                  </Text>
                </View>
              </View>

              {/* Delivery Address */}
              <View style={styles.addressBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="location" size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
                  <Text style={styles.addressTitle}>Delivery Destination</Text>
                </View>
                <Text style={styles.addressText}>
                  {selectedOrderForDetail?.deliveryAddress || 'Home — Prahlad Nagar, Ahmedabad'}
                </Text>
              </View>
            </ScrollView>

            {/* Reorder CTA button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                if (selectedOrderForDetail) handleReorder(selectedOrderForDetail);
              }}
              style={styles.confirmBtnWrapper}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtnGradient}
              >
                <Ionicons name="reload-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>Reorder This Print Job</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
    position: 'relative',
  },
  rippleOuter: {
    position: 'absolute',
    width: 240,
    height: 120,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.15)',
    top: -10,
  },
  rippleInner: {
    position: 'absolute',
    width: 180,
    height: 90,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.18)',
    top: 5,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  documentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E6F9',
    padding: 18,
    marginBottom: 24,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  docCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  docLeft: {
    flex: 1,
    paddingRight: 8,
  },
  docCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 12,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diamondBullet: {
    fontSize: 8,
    color: COLORS.hotPink,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  docIllustrationWrapper: {
    width: 100,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIllustrationImage: {
    width: 100,
    height: 105,
  },
  uploadButtonWrapper: {
    borderRadius: 14,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trustRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  trustCol: {
    flex: 1,
    alignItems: 'center',
  },
  trustIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E6F9',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 3,
  },
  trustSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  warningBanner: {
    backgroundColor: '#FCE1F5',
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.3)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warningEmoji: {
    fontSize: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.navy,
    lineHeight: 17,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 28,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  configSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  optionSection: {
    marginBottom: 18,
  },
  optionSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepperBox: {
    flex: 1,
    backgroundColor: '#F8F6FE',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E6F9',
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D1E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F4FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E6F9',
  },
  choiceChipActive: {
    backgroundColor: '#FCE1F5',
    borderColor: COLORS.hotPink,
  },
  choiceChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.navy,
  },
  choiceChipTextActive: {
    color: COLORS.hotPink,
    fontWeight: '800',
  },
  verticalOptionsCol: {
    gap: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E6F9',
  },
  radioRowActive: {
    backgroundColor: '#FCE1F5',
    borderColor: COLORS.hotPink,
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  radioLabelActive: {
    color: COLORS.hotPink,
  },
  radioSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  calculationBox: {
    backgroundColor: '#F8F6FE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(131, 100, 230, 0.25)',
    marginVertical: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    flex: 1,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#E2E6F9',
    marginVertical: 8,
  },
  calcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTotalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  calcEtaText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  calcTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.hotPink,
  },
  confirmBtnWrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 14,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Document / Image Preview Banner in Modal
  modalDocPreviewBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalImageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  docIconBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  imageTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  docTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  imageTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  readyPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readyPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  previewNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  previewSizeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Print History & Active Orders Section
  historySection: {
    marginTop: 24,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },
  historySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  filterPillsRow: {
    paddingBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyHistoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  emptyHistorySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // History Card
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    shadowColor: '#8364E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCardThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  historyCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardInfo: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 6,
  },
  historyCardFileName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.navy,
  },
  historyCardSpecs: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyCardCopies: {
    fontSize: 11,
    color: COLORS.purple,
    fontWeight: '600',
    marginTop: 2,
  },
  historyCardPriceCol: {
    alignItems: 'flex-end',
  },
  historyCardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.navy,
    marginBottom: 4,
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
  },
  statusPrinting: {
    backgroundColor: '#F3E8FF',
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusDeliveredText: {
    color: '#15803D',
  },
  statusPrintingText: {
    color: COLORS.purple,
  },
  historyCardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyMetaNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  historyMetaDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  historyCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 8,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Detail Modal Styles
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  detailSubtitle: {
    fontSize: 12,
    color: COLORS.purple,
    fontWeight: '700',
    marginTop: 2,
  },
  detailDocBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  detailDocThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#EEF2F6',
  },
  detailDocIcon: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  detailFileMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  detailFileMetaSub: {
    fontSize: 11,
    color: COLORS.purple,
    fontWeight: '600',
    marginTop: 2,
  },
  timelineBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
  },
  timelineHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  stepDotPending: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    marginRight: 10,
  },
  stepLineActive: {
    width: 2,
    height: 12,
    backgroundColor: '#10B981',
    marginLeft: 4,
    marginVertical: 1,
  },
  stepTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  stepTextPending: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  specsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  specLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  specValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.navy,
  },
  detailPricingBox: {
    backgroundColor: '#F8F6FE',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.25)',
  },
  addressBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.navy,
    lineHeight: 18,
  },
});

