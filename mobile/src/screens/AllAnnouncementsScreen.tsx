// All Announcements Screen - Redesigned to match front web design
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { stripHtmlTags } from '../components/HtmlContent';
import { CardSkeleton } from '../components/SkeletonLoader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Announcement } from '../types';

type AllAnnouncementsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AllAnnouncements'>;
};

export const AllAnnouncementsScreen: React.FC<AllAnnouncementsScreenProps> = ({
  navigation,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_LIMIT = 25;

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setErrorMessage(null);
      const { items, total, hasMore: more } = await ApiService.getAnnouncements({ page: pageNum, limit: PAGE_LIMIT });
      if (pageNum === 1) {
        setAnnouncements(items);
      } else {
        setAnnouncements(prev => [...prev, ...items]);
      }
      setTotalCount(total);
      setHasMore(more);
      setPage(pageNum);
    } catch (error) {
      logger.error('Error fetching announcements:', error);
      if (pageNum === 1) {
        setErrorMessage(getUserFriendlyErrorMessage(error, 'Duyurular yüklenemedi.'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnnouncements(1);
    setRefreshing(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchAnnouncements(page + 1);
    }
  }, [loadingMore, hasMore, page]);

  const formatDate = (dateInput: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined | null) => {
    if (!dateInput) return '';
    let dateString: string | Date;
    if (typeof dateInput === 'object' && 'seconds' in dateInput) {
      dateString = new Date((dateInput.seconds ?? dateInput._seconds ?? 0) * 1000);
    } else {
      dateString = dateInput as string | Date;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateInput: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined | null) => {
    if (!dateInput) return '';
    let dateString: string | Date;
    if (typeof dateInput === 'object' && 'seconds' in dateInput) {
      dateString = new Date((dateInput.seconds ?? dateInput._seconds ?? 0) * 1000);
    } else {
      dateString = dateInput as string | Date;
    }
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnnouncementPress = useCallback(async (item: Announcement) => {
    if (item.externalUrl) {
      const supported = await Linking.canOpenURL(item.externalUrl);
      if (supported) {
        Linking.openURL(item.externalUrl);
      } else {
        Alert.alert('Hata', 'Harici bağlantı açılamıyor.');
      }
      return;
    }

    navigation.navigate('AnnouncementDetail', { announcementId: item.id });
  }, [navigation]);

  const renderAnnouncementItem = useCallback(({ item }: { item: Announcement }) => {
    const isFeatured = !!item.isFeatured;
    const isExternal = !!item.externalUrl;
    const plainContent = item.content ? stripHtmlTags(item.content) : '';
    const previewContent = plainContent || (isExternal ? `Kaynak: ${item.externalUrl}` : '');

    return (
      <TouchableOpacity
        style={[styles.announcementCard, isFeatured && styles.featuredAnnouncementCard]}
        onPress={() => handleAnnouncementPress(item)}
        activeOpacity={0.9}
        accessibilityLabel={`Duyuru: ${item.title}`}
        accessibilityRole="button"
        accessibilityHint={isExternal ? 'Harici bağlantıyı açmak için dokunun' : 'Duyuru detayını görmek için dokunun'}
      >
        <View style={styles.announcementContent}>
          <View style={styles.announcementLeft}>
            {isExternal && (
              <View style={styles.externalBadge}>
                <Feather name="external-link" size={12} color="#2563eb" />
                <Text style={styles.externalBadgeText}>Harici Bağlantı</Text>
              </View>
            )}

            <Text style={styles.announcementTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={styles.announcementSummary} numberOfLines={2}>
              {previewContent}
            </Text>

            <View style={styles.announcementMeta}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={14} color="#6b7280" />
                <Text style={styles.metaText}>{formatDate(item.createdAt || '')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color="#6b7280" />
                <Text style={styles.metaText}>{formatTime(item.createdAt || '')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.announcementRight}>
            <Feather name={isExternal ? 'external-link' : 'chevron-right'} size={20} color={isExternal ? '#2563eb' : '#9ca3af'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleAnnouncementPress]);

  const keyExtractor = useCallback((item: Announcement) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#4f46e5', '#4338ca']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Duyurular</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <CardSkeleton count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#4f46e5', '#4338ca']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyurular</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <FlatList
        data={announcements}
        renderItem={renderAnnouncementItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
        }
        ListHeaderComponent={
          announcements.length > 0 ? (
            <Text style={styles.listHeader}>
              {totalCount > 0 ? `${totalCount} duyuru mevcut` : `${announcements.length} duyuru mevcut`}
            </Text>
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color="#4338ca" />
              ) : (
                <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton} activeOpacity={0.7}>
                  <Feather name="plus-circle" size={18} color="#4338ca" style={{ marginRight: 8 }} />
                  <Text style={styles.loadMoreText}>Daha Fazla Yükle</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name={errorMessage ? 'alert-circle' : 'bell'} size={48} color={errorMessage ? '#ef4444' : '#4338ca'} />
            </View>
            <Text style={styles.emptyTitle}>{errorMessage ? 'Bir Hata Oluştu' : 'Henüz Duyuru Yok'}</Text>
            {errorMessage ? <Text style={styles.emptyText}>{errorMessage}</Text> : null}
            <Text style={styles.emptyText}>
              {errorMessage ? 'Lütfen tekrar deneyin.' : 'Yeni duyurular eklendiğinde burada görünecektir.'}
            </Text>
            {errorMessage && (
              <TouchableOpacity onPress={onRefresh} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#4338ca', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Tekrar Dene</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  announcementCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  featuredAnnouncementCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  announcementContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  announcementLeft: {
    flex: 1,
  },
  announcementRight: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  externalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  externalBadgeText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 22,
  },
  announcementSummary: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 10,
    lineHeight: 18,
    flex: 1,
  },
  announcementMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(67, 56, 202, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(67, 56, 202, 0.15)',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338ca',
  },
});
