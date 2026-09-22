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
import io, { Socket } from 'socket.io-client';
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

interface RiderChatModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  riderId: string;
  riderName: string;
}

const RIDER_QUICK_REPLIES = [
  'I have arrived at your building',
  'Please share the 4-digit PIN',
  'On my way, 2 minutes away',
  'At your doorstep, please open',
  'Could you confirm your flat number?',
];

export const RiderChatModal: React.FC<RiderChatModalProps> = ({
  visible,
  onClose,
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  riderId,
  riderName,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // 1. Initialize Socket Connection to Tracking Gateway
  useEffect(() => {
    if (!visible || !orderId) return;

    const socket = io('http://localhost:5050/tracking', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    const cleanId = orderId.replace(/^#/, '');

    socket.on('connect', () => {
      socket.emit('join_order', { orderId: cleanId });
      if (orderNumber) {
        socket.emit('join_order', { orderId: orderNumber.replace(/^#/, '') });
      }
    });

    const handleChatReceive = (msg: any) => {
      if (!msg) return;
      const incomingId = msg.orderId?.replace(/^#/, '');
      if (incomingId === cleanId || incomingId === orderNumber?.replace(/^#/, '')) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTypingStatus = (data: any) => {
      if (!data) return;
      if (data.userRole === 'CUSTOMER' && data.isTyping) {
        setIsCustomerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsCustomerTyping(false), 3000);
      } else if (data.userRole === 'CUSTOMER' && !data.isTyping) {
        setIsCustomerTyping(false);
      }
    };

    socket.on('chat_receive', handleChatReceive);
    socket.on('chat_typing_status', handleTypingStatus);

    return () => {
      socket.off('chat_receive', handleChatReceive);
      socket.off('chat_typing_status', handleTypingStatus);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [visible, orderId, orderNumber]);

  // 2. Fetch Chat History via REST API
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
        console.warn('Could not fetch chat history for rider:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [visible, orderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const cleanId = orderId.replace(/^#/, '');
    const clientMsg: ChatMessageItem = {
      _id: `temp_rider_${Date.now()}`,
      orderId: cleanId,
      senderId: riderId || 'rider_current',
      senderRole: 'RIDER',
      senderName: riderName || 'Delivery Partner',
      message: text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, clientMsg]);
    setInputText('');

    // Emit via WebSocket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat_send', {
        orderId: cleanId,
        senderId: clientMsg.senderId,
        senderRole: 'RIDER',
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
          senderRole: 'RIDER',
          senderName: clientMsg.senderName,
          message: text,
        }),
      }).catch((e) => console.warn('REST fallback rider send failed:', e));
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat_typing', {
        orderId: orderId.replace(/^#/, ''),
        userId: riderId || 'rider_current',
        userRole: 'RIDER',
        isTyping: text.length > 0,
      });
    }
  };

  const handleCall = () => {
    const clean = (customerPhone || '').replace(/[^0-9+]/g, '');
    if (clean) {
      Linking.openURL(`tel:${clean}`).catch(() => {});
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessageItem }) => {
    const isMe = item.senderRole === 'RIDER';
    const isAdmin = item.senderRole === 'ADMIN';

    if (isAdmin) {
      return (
        <View style={styles.adminMsgRow}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield" size={12} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={styles.adminBadgeText}>Worm Up Dispatch: {item.message}</Text>
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
          <View style={styles.customerBubbleAvatar}>
            <Ionicons name="person" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleRider : styles.bubbleCustomer]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextRider : styles.bubbleTextCustomer]}>
            {item.message}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeRider : styles.bubbleTimeCustomer]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerProfile}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#1E293B" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {customerName}
              </Text>
              <Text style={styles.headerSub}>
                Order {orderNumber || orderId} • Customer Chat
              </Text>
            </View>
          </View>

          {customerPhone ? (
            <TouchableOpacity onPress={handleCall} style={styles.callBtn} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#10B981" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Messages Feed */}
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
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
                <Ionicons name="chatbubbles-outline" size={42} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Direct Chat with Customer</Text>
                <Text style={styles.emptySubtitle}>
                  Update the customer on your arrival, ask for directions, or request delivery PIN.
                </Text>
              </View>
            }
          />
        )}

        {/* Customer Typing Indicator */}
        {isCustomerTyping && (
          <View style={styles.typingBar}>
            <Text style={styles.typingText}>{customerName} is typing...</Text>
          </View>
        )}

        {/* Quick Delivery Replies */}
        <View style={styles.quickChipsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={RIDER_QUICK_REPLIES}
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

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${customerName.split(' ')[0]}...`}
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
  backBtn: {
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
  customerBubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#64748B',
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
  bubbleRider: {
    backgroundColor: '#4338CA',
    borderBottomRightRadius: 2,
  },
  bubbleCustomer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextRider: {
    color: '#FFFFFF',
  },
  bubbleTextCustomer: {
    color: '#0F172A',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeRider: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  bubbleTimeCustomer: {
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
    color: '#4338CA',
  },
  quickChipsContainer: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
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
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
