// All News Screen
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { stripHtmlTags } from '../components/HtmlContent';
import { CardSkeleton } from '../components/SkeletonLoader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, News } from '../types';

type AllNewsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AllNews'>;
};

export const AllNewsScreen: React.FC<AllNewsScreenProps> = ({ navigation }) => {
  const { width: screenWidth } = useWindowDimensions();
  const SLIDER_HEIGHT = Math.round(screenWidth * 0.52);
  const [news, setNews] = useState<News[]>([]);
  const [featuredNews, setFeaturedNews] = useState<News[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_LIMIT = 25;

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (featuredNews.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % featuredNews.length;
      setCurrentSlide(next);
      sliderRef.current?.scrollToOffset({ offset: next * (screenWidth - 32), animated: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, featuredNews.length]);

  const fetchNews = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setErrorMessage(null);
      const [{ items, hasMore: more }, featuredData] = await Promise.all([
        ApiService.getNews({ page: pageNum, limit: PAGE_LIMIT }),
        pageNum === 1
          ? ApiService.getNews({ isFeatured: true, isPublished: true, limit: 5 }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: featuredNews }),
      ]);
      if (pageNum === 1) {
        setNews(items);
        setFeaturedNews(featuredData.items.length > 0 ? featuredData.items : items.slice(0, 3));
      } else {
        setNews(prev => [...prev, ...items]);
      }
      setHasMore(more);
      setPage(pageNum);
    } catch (error) {
      logger.error('Error fetching news:', error);
      if (pageNum === 1) {
        setErrorMessage(getUserFriendlyErrorMessage(error, 'Haberler yüklenemedi.'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNews(1);
    setRefreshing(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchNews(page + 1);
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

  const renderSliderItem = useCallback(({ item }: { item: News }) => (
    <TouchableOpacity
      style={[styles.slideContainer, { width: screenWidth - 32, height: SLIDER_HEIGHT }]}
      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
      activeOpacity={0.9}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.slideImage} contentFit="cover" />
      ) : (
        <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.slideImage} />
      )}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.38, 0.72, 1]}
        style={styles.slideOverlay}
      />
      <View style={styles.slideTextContainer}>
        <Text style={styles.slideTitle} numberOfLines={2}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  ), [screenWidth, SLIDER_HEIGHT, navigation]);

  const renderPagination = () => (
    <View style={styles.pagination}>
      {featuredNews.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            currentSlide === index && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderSlider = () => {
    if (featuredNews.length === 0) return null;
    return (
      <>
        <View style={styles.sliderWrapper}>
          <View style={[styles.sliderContainer, { height: SLIDER_HEIGHT }]}>
            <FlatList
              ref={sliderRef}
              data={featuredNews}
              renderItem={renderSliderItem}
              keyExtractor={(item) => `slider-${item.id}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews={true}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
                setCurrentSlide(index);
              }}
            />
            {renderPagination()}
          </View>
        </View>
      </>
    );
  };

  const renderNewsItem = useCallback(({ item }: { item: News }) => {
    return (
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.newsImage} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={['#4338ca', '#312e81']}
            style={[styles.newsImage, styles.smallPlaceholder]}
          >
            <Feather name="file-text" size={24} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        )}
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          {item.summary && (
            <Text style={styles.newsSummary} numberOfLines={2}>{stripHtmlTags(item.summary)}</Text>
          )}
          <View style={styles.newsDateRow}>
            <Feather name="clock" size={12} color="#94a3b8" />
            <Text style={styles.newsDate}>{formatDate(item.createdAt || '')}</Text>
          </View>
        </View>
        <View style={styles.newsArrow}>
          <Feather name="chevron-right" size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const keyExtractor = useCallback((item: News) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#0f172a', '#312e81', '#4338ca']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Haberler</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <CardSkeleton count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0f172a', '#312e81', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Haberler</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={renderSlider}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
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
              <Feather name={errorMessage ? 'alert-circle' : 'file-text'} size={48} color={errorMessage ? '#ef4444' : '#4338ca'} />
            </View>
            <Text style={styles.emptyTitle}>{errorMessage ? 'Bir Hata Oluştu' : 'Henüz Haber Yok'}</Text>
            {errorMessage ? <Text style={styles.emptyText}>{errorMessage}</Text> : null}
            <Text style={styles.emptyText}>
              {errorMessage ? 'Lütfen tekrar deneyin.' : 'Yeni haberler eklendiğinde burada görünecektir.'}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sliderWrapper: {
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sliderContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  slideContainer: {
    flex: 1,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slideTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 36,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 20,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  newsImage: {
    width: 110,
    height: 100,
  },
  smallPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 20,
  },
  newsSummary: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 4,
  },
  newsDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  newsArrow: {
    justifyContent: 'center',
    paddingRight: 12,
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
