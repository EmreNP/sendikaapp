// Notifications Screen - Kullanıcı Bildirimleri (Sadece okunmamışlar)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import {
  getReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setUnreadCount,
} from '../services/notificationStorage';
import { ListItemSkeleton } from '../components/SkeletonLoader';

const { width: screenWidth } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'news';
  contentId?: string;
  contentName?: string;
  imageUrl?: string;
  createdAt: string;
  read?: boolean;
}

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCountState] = useState(0);

  useEffect(() => {
    loadReadIds();
  }, []);

  const loadReadIds = async () => {
    const ids = await getReadNotificationIds();
    setReadIds(ids);
    fetchNotifications(1, ids);
  };

  const filterUnread = (allItems: Notification[], readSet: Set<string>) => {
    const unread = allItems.filter(n => !readSet.has(n.id));
    setNotifications(unread);
    setUnreadCountState(unread.length);
    setUnreadCount(unread.length);
  };

  const fetchNotifications = async (pageNum = 1, currentReadIds?: Set<string>) => {
    try {
      setIsLoading(pageNum === 1);
      if (pageNum === 1) setErrorMessage(null);
      const response = await ApiService.getNotifications({ page: pageNum, limit: 50 });
      
      if (response?.notifications) {
        const rIds = currentReadIds || readIds;
        if (pageNum === 1) {
          setAllNotifications(response.notifications);
          filterUnread(response.notifications, rIds);
        } else {
          const combined = [...allNotifications, ...response.notifications];
          setAllNotifications(combined);
          filterUnread(combined, rIds);
        }
        setHasMore(response.pagination.page < response.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      if (pageNum === 1) {
        setErrorMessage(getUserFriendlyErrorMessage(error, 'Bildirimler yüklenemedi.'));
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const ids = await getReadNotificationIds();
    setReadIds(ids);
    await fetchNotifications(1, ids);
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchNotifications(page + 1);
    }
  }, [isLoading, hasMore, page]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    const newReadIds = new Set(readIds);
    newReadIds.add(notification.id);
    setReadIds(newReadIds);
    
    // Remove from visible list
    const updated = notifications.filter(n => n.id !== notification.id);
    setNotifications(updated);
    setUnreadCountState(updated.length);
    setUnreadCount(updated.length);

    // Navigate
    if (notification.type === 'news' && notification.contentId) {
      navigation.navigate('NewsDetail' as never, { newsId: notification.contentId } as never);
    } else if (notification.type === 'news') {
      navigation.navigate('AllNews' as never);
    } else if (notification.type === 'announcement') {
      navigation.navigate('AllAnnouncements' as never);
    }
  }, [readIds, notifications, navigation]);

  const handleMarkAllAsRead = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Tümünü Okundu İşaretle',
      `${notifications.length} bildirimi okundu olarak işaretlemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Okundu İşaretle',
          onPress: async () => {
            const ids = notifications.map(n => n.id);
            await markAllNotificationsAsRead(ids);
            const newReadIds = new Set(readIds);
            ids.forEach(id => newReadIds.add(id));
            setReadIds(newReadIds);
            setNotifications([]);
            setUnreadCountState(0);
            setUnreadCount(0);
          },
        },
      ]
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return { bg: '#dbeafe', icon: '#2563eb', text: 'Duyuru' };
      case 'news': return { bg: '#fef3c7', icon: '#d97706', text: 'Haber' };
      default: return { bg: '#f3f4f6', icon: '#6b7280', text: 'Bildirim' };
    }
  };

  const renderNotification = useCallback((notification: Notification) => {
    const typeColors = getTypeColor(notification.type);

    return (
      <TouchableOpacity
        key={notification.id}
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.8}
      >
        {/* Unread indicator dot */}
        <View style={styles.unreadDot} />
        
        <View style={styles.notificationLeft}>
          <View style={[styles.notificationIconBg, { backgroundColor: typeColors.bg }]}>
            <Feather 
              name={notification.type === 'news' ? 'book-open' : 'bell'} 
              size={20} 
              color={typeColors.icon} 
            />
          </View>
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeColors.icon }]}>
                {typeColors.text}
              </Text>
            </View>
            <Text style={styles.notificationTime}>{formatDate(notification.createdAt)}</Text>
          </View>

          <Text style={styles.notificationTitle} numberOfLines={2}>
            {notification.title}
          </Text>

          <Text style={styles.notificationBody} numberOfLines={3}>
            {notification.body}
          </Text>

          {notification.imageUrl && (
            <Image 
              source={{ uri: notification.imageUrl }} 
              style={styles.notificationImage}
              contentFit="cover"
            />
          )}

          {notification.contentName && (
            <View style={styles.contentLink}>
              <Feather name="external-link" size={12} color="#2563eb" />
              <Text style={styles.contentLinkText} numberOfLines={1}>
                {notification.contentName}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleNotificationPress]);

  const renderItem = useCallback(({ item }: { item: Notification }) => renderNotification(item), [renderNotification]);
  const keyExtractor = useCallback((item: Notification) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          {notifications.length > 0 && (
            <Text style={styles.headerSubtitle}>{notifications.length} okunmamış</Text>
          )}
        </View>
        {notifications.length > 0 ? (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Feather name="check-circle" size={20} color="#2563eb" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </LinearGradient>

      {/* Content */}
      {isLoading && page === 1 ? (
        <ListItemSkeleton count={6} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Feather name={errorMessage ? 'alert-circle' : 'bell-off'} size={48} color={errorMessage ? '#ef4444' : '#94a3b8'} />
          </View>
          <Text style={styles.emptyTitle}>{errorMessage ? 'Bir Hata Oluştu' : 'Okunmamış Bildirim Yok'}</Text>
          {errorMessage ? <Text style={styles.emptySubtitle}>{errorMessage}</Text> : null}
          <Text style={styles.emptySubtitle}>
            {errorMessage ? 'Lütfen tekrar deneyin.' : 'Tüm bildirimlerinizi okudunuz. Yeni bildirimler geldiğinde burada görünecek.'}
          </Text>
          {errorMessage && (
            <TouchableOpacity onPress={() => fetchNotifications(1)} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#2563eb', borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Tekrar Dene</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoading && page > 1 ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : !hasMore && notifications.length > 0 ? (
              <View style={styles.endContainer}>
                <View style={styles.endLine} />
                <Text style={styles.endText}>Tüm bildirimler gösterildi</Text>
                <View style={styles.endLine} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  notificationLeft: {
    marginRight: 12,
  },
  notificationIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 22,
  },
  notificationBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  contentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  contentLinkText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
    flex: 1,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  endLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  endText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
