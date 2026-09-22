import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Socket } from 'socket.io-client';
import { COLORS } from '../../theme/colors';

export interface ChatMessageItem {
  _id: string;
  orderId: string;
  senderId: string;
  senderRole: 'CUSTOMER' | 'RIDER' | 'ADMIN';
  senderName: string;
  message: string;
  createdAt: string;
}

interface S27_ChatModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  partnerName: string;
  partnerPhone: string;
  partnerVehicle: string;
  customerId: string;
  customerName: string;
  liveStatus: string;
  socket: Socket | null;
}

const QUICK_REPLIES = [
  'I am at the gate / lobby',
  'Please ring the doorbell',
  'Which floor are you on?',
  'Left at security gate',
  'Please call when you arrive',
];

export const S27_ChatModal: React.FC<S27_ChatModalProps> = ({
  visible,
  onClose,
  orderId,
  orderNumber,
  partnerName,
  partnerPhone,
  partnerVehicle,
  customerId,
  customerName,
  liveStatus,
  socket,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  const isDelivered = liveStatus === 'DELIVERED';

  // 1. Fetch chat history via REST API
  useEffect(() => {
    if (!visible || !orderId) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const cleanId = orderId.replace(/^#/, '');
        const res = await fetch(`http://localhost:5050/api/v1/chat/${encodeURIComponent(cleanId)}/history`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setMessages(json.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch chat history:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [visible, orderId]);

  // 2. Listen for real-time WebSocket chat events
  useEffect(() => {
    if (!socket || !visible) return;

    const handleChatReceive = (msg: any) => {
      if (!msg) return;
      const cleanOrderId = orderId?.replace(/^#/, '');
      const incomingOrderId = msg.orderId?.replace(/^#/, '');

      if (incomingOrderId === cleanOrderId || incomingOrderId === orderNumber?.replace(/^#/, '')) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTypingStatus = (data: any) => {
      if (!data) return;
      if (data.userRole === 'RIDER' && data.isTyping) {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
      } else if (data.userRole === 'RIDER' && !data.isTyping) {
        setIsPartnerTyping(false);
      }
    };

    socket.on('chat_receive', handleChatReceive);
    socket.on('chat_typing_status', handleTypingStatus);

    return () => {
      socket.off('chat_receive', handleChatReceive);
      socket.off('chat_typing_status', handleTypingStatus);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, visible, orderId, orderNumber]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isDelivered) return;

    const cleanId = orderId.replace(/^#/, '');
    const clientMsg: ChatMessageItem = {
      _id: `temp_${Date.now()}`,
      orderId: cleanId,
      senderId: customerId || 'cust_current',
      senderRole: 'CUSTOMER',
      senderName: customerName || 'Customer',
      message: text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, clientMsg]);
    setInputText('');

    // Emit via WebSocket
    if (socket && socket.connected) {
      socket.emit('chat_send', {
        orderId: cleanId,
        senderId: clientMsg.senderId,
        senderRole: 'CUSTOMER',
        senderName: clientMsg.senderName,
        message: text,
      });
    } else {
      // REST fallback
      fetch(`http://localhost:5050/api/v1/chat/${encodeURIComponent(cleanId)}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: clientMsg.senderId,
          senderRole: 'CUSTOMER',
          senderName: clientMsg.senderName,
          message: text,
        }),
      }).catch((e) => console.warn('REST fallback send failed:', e));
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (socket && socket.connected) {
      socket.emit('chat_typing', {
        orderId: orderId.replace(/^#/, ''),
        userId: customerId || 'cust_current',
        userRole: 'CUSTOMER',
        isTyping: text.length > 0,
      });
    }
  };

  const handleCall = () => {
    const cleanNumber = (partnerPhone || '').replace(/[^0-9+]/g, '');
    if (cleanNumber) {
      Linking.openURL(`tel:${cleanNumber}`).catch(() => {});
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessageItem }) => {
    const isMe = item.senderRole === 'CUSTOMER';
    const isAdmin = item.senderRole === 'ADMIN';

    if (isAdmin) {
      return (
        <View style={styles.adminMsgRow}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield" size={12} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={styles.adminBadgeText}>Worm Up Support: {item.message}</Text>
          </View>
        </View>
      );
    }

    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={styles.partnerBubbleAvatar}>
            <Ionicons name="bicycle" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleCustomer : styles.bubblePartner]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextCustomer : styles.bubbleTextPartner]}>
            {item.message}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeCustomer : styles.bubbleTimePartner]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerProfile}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#6366F1" />
              <View style={styles.onlineDot} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.partnerNameText} numberOfLines={1}>
                {partnerName}
              </Text>
              <Text style={styles.partnerSubText}>
                {partnerVehicle} • Live Order Chat
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleCall} style={styles.callHeaderBtn} activeOpacity={0.8}>
            <Ionicons name="call" size={18} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Live Delivery Status Mini-Banner */}
        <View style={styles.orderBanner}>
          <Text style={styles.orderBannerText}>
            Order <Text style={{ fontWeight: '700' }}>{orderNumber}</Text> • Status:{' '}
            <Text style={{ fontWeight: '700', color: isDelivered ? '#059669' : '#2563EB' }}>
              {liveStatus}
            </Text>
          </Text>
        </View>

        {/* Chat Messages Feed */}
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, idx) => item._id || String(idx)}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyFeed}>
                <Ionicons name="chatbubbles-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Chat with your Delivery Partner</Text>
                <Text style={styles.emptySubtitle}>
                  Ask about your delivery, gate directions, or doorstep handover.
                </Text>
              </View>
            }
          />
        )}

        {/* Partner Typing Indicator */}
        {isPartnerTyping && (
          <View style={styles.typingBar}>
            <Text style={styles.typingText}>{partnerName} is typing...</Text>
          </View>
        )}

        {/* Quick Reply Chips (Only if active) */}
        {!isDelivered && (
          <View style={styles.quickChipsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={QUICK_REPLIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleSendMessage(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            />
          </View>
        )}

        {/* Input Bar or Completed Banner */}
        {isDelivered ? (
          <View style={styles.deliveredLockBar}>
            <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
            <Text style={styles.deliveredLockText}>
              Order delivered & verified. Chat is now archived.
            </Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={`Message ${partnerName.split(' ')[0]}...`}
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={handleTyping}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  partnerNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  partnerSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  callHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  orderBanner: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  orderBannerText: {
    fontSize: 11,
    color: '#475569',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyFeed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  partnerBubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleCustomer: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 2,
  },
  bubblePartner: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextCustomer: {
    color: '#FFFFFF',
  },
  bubbleTextPartner: {
    color: '#0F172A',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeCustomer: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  bubbleTimePartner: {
    color: '#94A3B8',
  },
  adminMsgRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  typingBar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6366F1',
  },
  quickChipsContainer: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  deliveredLockBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#ECFDF5',
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  deliveredLockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 6,
  },
});
