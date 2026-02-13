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
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { HtmlContent, stripHtmlTags } from '../components/HtmlContent';
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority?: string): [string, string] => {
    switch (priority) {
      case 'high':
        return ['#ef4444', '#dc2626'];
      case 'medium':
        return ['#f59e0b', '#d97706'];
      default:
        return ['#2563eb', '#1d4ed8'];
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'Önemli';
      case 'medium':
        return 'Orta';
      default:
        return 'Normal';
    }
  };

  const getPriorityIcon = (priority?: string): 'alert-triangle' | 'alert-circle' | 'bell' => {
    switch (priority) {
      case 'high':
        return 'alert-triangle';
      case 'medium':
        return 'alert-circle';
      default:
        return 'bell';
    }
  };

  const toggleAnnouncement = useCallback((id: string) => {
    setSelectedAnnouncement(prev => prev === id ? null : id);
  }, []);

  const renderAnnouncementItem = useCallback(({ item }: { item: Announcement }) => {
    const isExpanded = selectedAnnouncement === item.id;
    const priorityColors = getPriorityColor(item.priority);
    const plainContent = item.content ? stripHtmlTags(item.content) : '';

    return (
      <TouchableOpacity
        style={[styles.announcementCard, isExpanded && styles.announcementCardExpanded]}
        onPress={() => toggleAnnouncement(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={priorityColors}
            style={styles.priorityIndicator}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={isExpanded ? undefined : 2}>
                {item.title}
              </Text>
              <Feather 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={18} 
                color="#94a3b8" 
              />
            </View>

            {/* Kapalıyken kısa özet (HTML tag'larından temizlenmiş) */}
            {!isExpanded && plainContent.length > 0 && (
              <Text style={styles.previewText} numberOfLines={2}>
                {plainContent}
              </Text>
            )}

            <View style={styles.cardMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[0] + '15' }]}>
                <Feather name={getPriorityIcon(item.priority)} size={12} color={priorityColors[0]} style={{ marginRight: 4 }} />
                <Text style={[styles.priorityText, { color: priorityColors[0] }]}>
                  {getPriorityLabel(item.priority)}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <Feather name="calendar" size={12} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.cardDate}>{formatDate(item.createdAt || '')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Açıldığında görsel ve HTML içerik */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.announcementImage} />
            )}
            {item.content && <HtmlContent html={item.content} />}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedAnnouncement]);

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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementCardExpanded: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  announcementImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  priorityIndicator: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 12,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  previewText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginTop: 6,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
    backgroundColor: '#fafafa',
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
