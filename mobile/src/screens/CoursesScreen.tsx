// Courses Screen - Training List - Redesigned to match front web design
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, Training } from '../types';

const { width } = Dimensions.get('window');

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

  // Accordion / lessons state per training
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null);
  const [lessonsMap, setLessonsMap] = useState<Record<string, any[]>>({});
  const [loadingLessons, setLoadingLessons] = useState<string | null>(null);

  const loadLessons = async (trainingId: string) => {
    if (lessonsMap[trainingId]) return; // already loaded
    try {
      setLoadingLessons(trainingId);
      const lessons = await ApiService.getLessons(trainingId);
      
      // Her lesson için içerik sayılarını hesapla - tek API çağrısı ile (all)
      const lessonsWithCounts = await Promise.all(
        lessons.map(async (lesson: any) => {
          try {
            // Tek çağrıda tüm içerikleri al, type'a göre say
            const allContents = await ApiService.getLessonContents(lesson.id).catch(() => []);
            
            return {
              ...lesson,
              videoCount: allContents.filter((c: any) => c.type === 'video').length,
              documentCount: allContents.filter((c: any) => c.type === 'document').length,
              testCount: allContents.filter((c: any) => c.type === 'test').length,
            };
          } catch (err) {
            logger.error(`Error loading contents for lesson ${lesson.id}:`, err);
            return {
              ...lesson,
              videoCount: 0,
              documentCount: 0,
              testCount: 0,
            };
          }
        })
      );
      
      setLessonsMap(prev => ({ ...prev, [trainingId]: lessonsWithCounts }));
    } catch (err) {
      logger.error('Error loading lessons:', err);
      Alert.alert('Hata', getUserFriendlyErrorMessage(err, 'Dersler yüklenemedi.'));
    } finally {
      setLoadingLessons(null);
    }
  };

  useEffect(() => {
    if (canAccessTrainings) {
      fetchTrainings();
    } else {
      setLoading(false);
    }
  }, [canAccessTrainings]);

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
            {isPendingDetails
              ? 'Eğitimlere erişebilmek için üyelik bilgilerinizi tamamlamanız gerekmektedir.'
              : 'Üyelik başvurunuz onay bekliyor. Onaylandıktan sonra eğitimlere erişebilirsiniz.'}
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

  const renderTrainingItem = useCallback(({ item, index }: { item: Training; index: number }) => {
    const palette = colorPalette[index % colorPalette.length];
    const isExpanded = expandedTrainingId === item.id;
    const lessons = lessonsMap[item.id] || [];
    const isLoadingThisLessons = loadingLessons === item.id;
    const icon = getTrainingIcon(item.title);

    // Gerçek değerler - API'den gelen lessons sayısı
    const totalLessons = lessons.length > 0 ? lessons.length : 0;
    
    // Her ders için video, döküman ve test sayılarını hesapla
    const calculateProgress = () => {
      if (lessons.length === 0) return { completed: 0, total: 0, percent: 0, videoCount: 0, docCount: 0, testCount: 0 };
      
      let totalVideos = 0;
      let totalDocs = 0;
      let totalTests = 0;
      let completedItems = 0;
      let totalItems = 0;

      lessons.forEach((lesson: any) => {
        // loadLessons fonksiyonunda zaten hesapladık, direkt kullan
        const lessonVideos = lesson.videoCount || 0;
        const lessonDocs = lesson.documentCount || 0;
        const lessonTests = lesson.testCount || 0;
        
        totalVideos += lessonVideos;
        totalDocs += lessonDocs;
        totalTests += lessonTests;
        
        const lessonItems = lessonVideos + lessonDocs + lessonTests;
        totalItems += lessonItems;
        
        // Eğer lesson completed bilgisi varsa kullan
        if (lesson.completed || lesson.progress === 100) {
          completedItems += lessonItems;
        } else if (lesson.progress) {
          completedItems += Math.floor((lessonItems * lesson.progress) / 100);
        }
      });

      const progressPercent = totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0;
      
      return {
        completed: completedItems,
        total: totalItems,
        percent: progressPercent,
        videoCount: totalVideos,
        docCount: totalDocs,
        testCount: totalTests
      };
    };

    const stats = calculateProgress();

    return (
      <View style={styles.trainingCard}>
        {/* Training Header - Clickable */}
        <TouchableOpacity
          style={styles.trainingHeader}
          onPress={() => {
            if (isExpanded) {
              setExpandedTrainingId(null);
            } else {
              setExpandedTrainingId(item.id);
              loadLessons(item.id);
            }
          }}
          activeOpacity={0.7}
        >
          {/* Icon Container */}
          <LinearGradient
            colors={palette.gradient as [string, string]}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={icon as keyof typeof Feather.glyphMap} size={28} color="#ffffff" />
          </LinearGradient>

          {/* Content */}
          <View style={styles.trainingContent}>
            <Text style={styles.trainingTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.trainingDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            {/* İstatistikler Satırı */}
            <View style={styles.trainingStats}>
              {totalLessons > 0 && (
                <Text style={styles.categoryText}>{totalLessons} alt kategori</Text>
              )}
              {isExpanded && stats.total > 0 && (
                <>
                  <Text style={styles.statsDivider}>•</Text>
                  <View style={styles.statsRow}>
                    <Feather name="play-circle" size={12} color="#64748b" />
                    <Text style={styles.statsText}>{stats.videoCount} video</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Feather name="file-text" size={12} color="#64748b" />
                    <Text style={styles.statsText}>{stats.docCount} döküman</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Feather name="clipboard" size={12} color="#64748b" />
                    <Text style={styles.statsText}>{stats.testCount} test</Text>
                  </View>
                </>
              )}
            </View>
            
            {/* Progress Bar - Sadece expanded olduğunda */}
            {isExpanded && stats.total > 0 && (
              <View style={styles.trainingProgressContainer}>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${stats.percent}%`,
                        backgroundColor: stats.percent >= 65 ? '#f59e0b' : stats.percent > 0 ? '#ef4444' : '#e2e8f0'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.trainingProgressText}>
                  {stats.percent > 0 ? (
                    <>
                      <Feather name="award" size={11} color="#2563eb" /> %{stats.percent} Tamamlandı
                    </>
                  ) : (
                    <>
                      <Feather name="circle" size={11} color="#94a3b8" /> Başlanmadı
                    </>
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Chevron */}
          {isLoadingThisLessons ? (
            <ActivityIndicator size="small" color="#94a3b8" style={styles.chevron} />
          ) : (
            <Feather
              name="chevron-down"
              size={20}
              color="#94a3b8"
              style={[
                styles.chevron,
                { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] },
              ]}
            />
          )}
        </TouchableOpacity>

        {/* Lessons Accordion */}
        {isExpanded && (
          <View style={styles.lessonsContainer}>
            {isLoadingThisLessons ? (
              <View style={styles.lessonsLoading}>
                <ActivityIndicator size="small" color={palette.text} />
                <Text style={[styles.lessonsLoadingText, { color: palette.text }]}>
                  Dersler yükleniyor...
                </Text>
              </View>
            ) : lessons.length === 0 ? (
              <View style={styles.lessonsEmpty}>
                <Text style={styles.lessonsEmptyText}>
                  Bu eğitimde henüz ders bulunmuyor.
                </Text>
              </View>
            ) : (
              lessons.map((lesson, lessonIndex) => {
                // loadLessons'da hesapladığımız sayıları direkt kullan
                const videoCount = lesson.videoCount || 0;
                const docCount = lesson.documentCount || 0;
                const testCount = lesson.testCount || 0;
                
                // Progress hesaplama
                const lessonProgress = lesson.progress || 0;
                const completed = lesson.completed || lessonProgress === 100;
                const progressPercent = lessonProgress;
                
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    onPress={() => navigation.navigate('CourseDetail', { trainingId: item.id, lessonId: lesson.id })}
                    style={styles.lessonCard}
                    activeOpacity={0.7}
                  >
                    {/* Orta: İçerik */}
                    <View style={styles.lessonMainContent}>
                      <Text style={styles.lessonCardTitle} numberOfLines={2}>
                        {lesson.title}
                      </Text>
                      {lesson.description && (
                        <Text style={styles.lessonCardDescription} numberOfLines={1}>
                          {lesson.description}
                        </Text>
                      )}
                      
                      {/* İkon Satırı */}
                      <View style={styles.lessonMeta}>
                        <View style={styles.metaItem}>
                          <Feather name="play-circle" size={14} color="#64748b" />
                          <Text style={styles.metaText}>{videoCount} video</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Feather name="file-text" size={14} color="#64748b" />
                          <Text style={styles.metaText}>{docCount} döküman</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Feather name="clipboard" size={14} color="#64748b" />
                          <Text style={styles.metaText}>{testCount} test</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${progressPercent}%`,
                                backgroundColor: progressPercent >= 65 ? '#f59e0b' : progressPercent > 0 ? '#ef4444' : '#e2e8f0'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {progressPercent > 0 ? (
                            <>
                              <Feather name="award" size={11} color="#2563eb" /> %{progressPercent} Tamamlandı
                            </>
                          ) : (
                            <>
                              <Feather name="circle" size={11} color="#94a3b8" /> Başlanmadı
                            </>
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Sağ: Chevron - lesson'ın durumuna göre ikon */}
                    {completed ? (
                      <View style={styles.completedBadge}>
                        <Feather name="check-circle" size={20} color="#10b981" />
                      </View>
                    ) : (
                      <Feather name="chevron-right" size={20} color="#cbd5e1" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  }, [expandedTrainingId, lessonsMap, loadingLessons, navigation]);

  const keyExtractor = useCallback((item: Training) => item.id, []);

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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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
  trainingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#64748b',
  },
  statsDivider: {
    fontSize: 12,
    color: '#cbd5e1',
    marginHorizontal: 4,
  },
  trainingProgressContainer: {
    gap: 6,
    marginTop: 8,
  },
  trainingProgressText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
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
  chevron: {
    marginLeft: 8,
  },
  lessonsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 12,
  },
  lessonsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  lessonsLoadingText: {
    fontSize: 14,
  },
  lessonsEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  lessonsEmptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonMainContent: {
    flex: 1,
    gap: 8,
  },
  lessonCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 22,
  },
  lessonCardDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
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
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  membershipButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
