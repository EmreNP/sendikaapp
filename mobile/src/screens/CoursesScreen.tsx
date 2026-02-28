// Courses Screen - Training List - Redesigned to match front web design
import React, { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, Training } from '../types';


type CoursesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Courses'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type CoursesScreenProps = {
  navigation: CoursesScreenNavigationProp;
};

// İcon haritası - Statik olarak tanımlanmış
const trainingIcons: Record<string, any> = {
  // İslami/Dini
  'İslami': 'book',
  'Kuran': 'book',
  'Hadis': 'book-open',
  'Fiqh': 'award',
  'Siyer': 'user',
  // Eğitim kategorileri
  'Temel': 'star',
  'Sosyal': 'users',
  'Mesleki': 'briefcase',
  'Hukuk': 'shield',
  'Sağlık': 'heart',
  'Teknoloji': 'cpu',
  'Yönetim': 'settings',
  'Liderlik': 'target',
  'İletişim': 'message-circle',
  'Gelişim': 'trending-up',
  'default': 'book-open',
};

// Ders iconları - Statik
const lessonIcons = ['play-circle', 'file-text', 'video', 'headphones', 'clipboard'];

const getLessonIcon = (index: number): string => {
  return lessonIcons[index % lessonIcons.length];
};
const colorPalette = [
  { gradient: ['#2563eb', '#1d4ed8'], light: '#eff6ff', text: '#2563eb', border: '#dbeafe' },
  { gradient: ['#059669', '#047857'], light: '#ecfdf5', text: '#059669', border: '#d1fae5' },
  { gradient: ['#d97706', '#b45309'], light: '#fffbeb', text: '#d97706', border: '#fef3c7' },
  { gradient: ['#7c3aed', '#6d28d9'], light: '#f5f3ff', text: '#7c3aed', border: '#e9d5ff' },
  { gradient: ['#e11d48', '#be123c'], light: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
];

// İcon seçim fonksiyonu
const getTrainingIcon = (title: string): string => {
  const normalizedTitle = title.toLowerCase();
  for (const key in trainingIcons) {
    if (normalizedTitle.includes(key.toLowerCase())) {
      return trainingIcons[key];
    }
  }
  return trainingIcons.default;
};

export const CoursesScreen: React.FC<CoursesScreenProps> = ({ navigation }) => {
  const { canAccessTrainings, isPendingDetails } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_LIMIT = 25;

  // Kurs ilerleme durumları: { [trainingId]: completedCount }
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  // Her ekran odağa geldiğinde ilerlemeyi güncelle (CourseDetail'den dönüş)
  useFocusEffect(
    useCallback(() => {
      if (trainings.length > 0) {
        loadAllProgress(trainings);
      }
    }, [trainings])
  );

  const loadAllProgress = async (items: Training[]) => {
    try {
      const keys = items.map(t => `@sendika_completed_${t.id}`);
      const entries = await AsyncStorage.multiGet(keys);
      const progress: Record<string, number> = {};
      entries.forEach(([key, value]) => {
        if (value) {
          const trainingId = key.replace('@sendika_completed_', '');
          try {
            const arr = JSON.parse(value) as string[];
            progress[trainingId] = arr.length;
          } catch {
            progress[trainingId] = 0;
          }
        }
      });
      setCourseProgress(progress);
    } catch (err) {
      logger.error('Error loading course progress:', err);
    }
  };


  useEffect(() => {
    if (canAccessTrainings) {
      fetchTrainings();
    } else {
      setLoading(false);
    }
  }, [canAccessTrainings]);

  const keyExtractor = useCallback((item: Training) => item.id, []);

  const fetchTrainings = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setErrorMessage(null);
      const { items, total, hasMore: more } = await ApiService.getTrainings({ page: pageNum, limit: PAGE_LIMIT });
      if (pageNum === 1) {
        setTrainings(items);
      } else {
        setTrainings(prev => [...prev, ...items]);
      }
      setTotalCount(total);
      setHasMore(more);
      setPage(pageNum);
    } catch (error) {
      logger.error('Error fetching trainings:', error);
      if (pageNum === 1) {
        setErrorMessage(getUserFriendlyErrorMessage(error, 'Eğitimler yüklenemedi.'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!canAccessTrainings) return;
    setRefreshing(true);
    await fetchTrainings(1);
    setRefreshing(false);
  }, [canAccessTrainings]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchTrainings(page + 1);
    }
  }, [loadingMore, hasMore, page]);




  const renderTrainingItem = useCallback(({ item, index }: { item: Training; index: number }) => {
    const palette = colorPalette[index % colorPalette.length];
    const icon = getTrainingIcon(item.title);
    const completedCount = courseProgress[item.id] || 0;
    const hasStarted = completedCount > 0;

    return (
      <TouchableOpacity
        style={styles.trainingCard}
        onPress={() => navigation.navigate('CourseDetail', { trainingId: item.id })}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={palette.gradient as [string, string]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={icon as keyof typeof Feather.glyphMap} size={28} color="#ffffff" />
        </LinearGradient>

        <View style={styles.trainingContent}>
          <Text style={styles.trainingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.trainingDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.trainingMeta}>
            {item.lessonsCount != null && item.lessonsCount > 0 && (
              <Text style={styles.categoryText}>{item.lessonsCount} ders</Text>
            )}
            {hasStarted && (
              <View style={styles.progressBadge}>
                <Feather name="check-circle" size={12} color="#059669" />
                <Text style={styles.progressBadgeText}>
                  {completedCount} içerik tamamlandı
                </Text>
              </View>
            )}
          </View>
        </View>

        <Feather name="chevron-right" size={20} color="#94a3b8" />
      </TouchableOpacity>
    );
  }, [navigation, courseProgress]);

  if (!canAccessTrainings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Eğitimler</Text>
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIcon}>
            <Feather name="lock" size={48} color="#4338ca" />
          </View>
          <Text style={styles.lockedTitle}>Eğitimlere Erişim Kısıtlı</Text>
          <Text style={styles.lockedText}>
            {isPendingDetails ? (
              'Eğitimlere erişebilmek için üyelik bilgilerinizi tamamlamanız gerekmektedir.'
            ) : (
              <>Sendika üyeliğiniz henüz onaylanmadı. Eğer zaten üye olduğunuzu düşünüyorsanız <Text
                style={styles.lockedLink}
                accessibilityRole="link"
                onPress={() => navigation.navigate('Contact')}
              >bizimle iletişime geçin</Text>.</>
            )}
          </Text>
          {isPendingDetails && (
            <TouchableOpacity
              style={styles.membershipButton}
              onPress={() => navigation.navigate('Membership' as never)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4338ca', '#1e40af']}
                style={styles.membershipButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="user-plus" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.membershipButtonText}>Üyeliği Tamamla</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Eğitimler</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Eğitimler</Text>
          <Text style={styles.headerSubtitle}>{totalCount > 0 ? `${totalCount} eğitim` : `${trainings.length} eğitim`}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <FlatList
        data={trainings}
        renderItem={renderTrainingItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton} activeOpacity={0.7}>
                  <Feather name="plus-circle" size={18} color="#2563eb" style={{ marginRight: 8 }} />
                  <Text style={styles.loadMoreText}>Daha Fazla Yükle</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name={errorMessage ? 'alert-circle' : 'book-open'} size={48} color={errorMessage ? '#ef4444' : '#94a3b8'} />
            </View>
            <Text style={styles.emptyTitle}>{errorMessage ? 'Bir Hata Oluştu' : 'Henüz Eğitim Yok'}</Text>
            {errorMessage ? <Text style={styles.emptyText}>{errorMessage}</Text> : null}
            <Text style={styles.emptyText}>
              {errorMessage ? 'Lütfen tekrar deneyin.' : 'Yeni eğitimler eklendiğinde burada görünecektir.'}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  trainingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  trainingContent: {
    flex: 1,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
  },
  trainingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  trainingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 24,
  },
  trainingDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  lockedLink: {
    color: '#4338ca',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  membershipButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  membershipButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  membershipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4338ca',
    overflow: 'hidden',
  },
  contactButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4338ca',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
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
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});
