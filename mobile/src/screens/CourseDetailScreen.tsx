// Course Detail Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import { logger } from '../utils/logger';
import { DetailSkeleton } from '../components/SkeletonLoader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, Training, Lesson } from '../types';

type CourseDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>;
  route: RouteProp<RootStackParamList, 'CourseDetail'>;
};

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { trainingId: courseId } = route.params;
  const [training, setTraining] = useState<Training | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Content/tab state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [activeTab, setActiveTab] = useState<'all'|'videos'|'documents'|'tests'>('all');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Course-scoped storage key to prevent unbounded blob growth
  const storageKey = `@sendika_completed_${courseId}`;

  useEffect(() => {
    fetchCourseDetails();
    loadCompletedItems();
  }, [courseId]);

  useEffect(() => {
    // When course + lesson selection changes, load contents for the selected lesson
    if (selectedLesson) {
      loadContents(selectedLesson.id, activeTab);
    }
  }, [selectedLesson, activeTab]);

  // Navigation focus event - reload completed items when returning from Document/Test
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCompletedItems();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchCourseDetails = async () => {
    try {
      const [foundTraining, lessonsData] = await Promise.all([
        ApiService.getTraining(courseId),
        ApiService.getLessons(courseId),
      ]);
      setTraining(foundTraining || null);
      setLessons(lessonsData || []);

      // Set selected lesson: prefer route param, otherwise first lesson
      const initialLesson = route.params.lessonId
        ? lessonsData.find((l: Lesson) => l.id === route.params.lessonId)
        : lessonsData[0];
      setSelectedLesson(initialLesson || null);
    } catch (error) {
      logger.error('Error fetching course details:', error);
      Alert.alert('Hata', 'Eğitim detayları yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCourseDetails();
  }, [courseId]);

  const toggleLesson = useCallback((lessonId: string) => {
    setExpandedLesson(prev => prev === lessonId ? null : lessonId);
  }, []);

  const loadContents = async (lessonId: string, tab: 'all'|'videos'|'documents'|'tests') => {
    try {
      setLoadingContents(true);
      logger.info(`Loading contents for lesson ${lessonId}, tab: ${tab}`);
      if (tab === 'all') {
        const data = await ApiService.getLessonContents(lessonId);
        logger.info(`Loaded ${(data || []).length} contents:`, JSON.stringify(data));
        setContents(data || []);
      } else {
        const type: 'video' | 'document' | 'test' = tab === 'videos' ? 'video' : tab === 'documents' ? 'document' : 'test';
        const data = await ApiService.getLessonContents(lessonId, type);
        logger.info(`Loaded ${(data || []).length} ${type} contents:`, JSON.stringify(data));
        setContents(data || []);
      }
    } catch (err) {
      logger.error('Error loading contents:', err);
      setContents([]);
    } finally {
      setLoadingContents(false);
    }
  };

  const loadCompletedItems = async () => {
    try {
      // First check course-scoped key
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCompletedItems(new Set(parsed));
        return;
      }

      // Migration: check legacy global key and migrate matching items
      const legacyStored = await AsyncStorage.getItem('completedContent');
      if (legacyStored) {
        const legacyParsed: string[] = JSON.parse(legacyStored);
        // We can't perfectly filter by courseId here since IDs are content-level,
        // but we preserve all legacy items for this course on first load
        // and save to the new scoped key
        setCompletedItems(new Set(legacyParsed));
        await AsyncStorage.setItem(storageKey, JSON.stringify(legacyParsed));
        // Clean up legacy key after migration
        await AsyncStorage.removeItem('completedContent');
      }
    } catch (err) {
      logger.error('Error loading completed items:', err);
    }
  };

  const markAsCompleted = useCallback(async (id: string) => {
    try {
      const newSet = new Set(completedItems);
      newSet.add(id);
      setCompletedItems(newSet);
      await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch (err) {
      logger.error('Error marking as completed:', err);
    }
  }, [completedItems, storageKey]);

  const toggleComplete = useCallback(async (id: string) => {
    try {
      const newSet = new Set(completedItems);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setCompletedItems(newSet);
      await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch (err) {
      logger.error('Error toggling complete:', err);
    }
  }, [completedItems, storageKey]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!training) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorText}>Eğitim bulunamadı</Text>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#4338ca', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backButtonGradient}
            >
              <Feather name="arrow-left" size={18} color="#ffffff" />
              <Text style={styles.backButtonTextError}>Geri Dön</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
        }
      >
        {/* Header Image */}
        {training.imageUrl ? (
          <Image source={{ uri: training.imageUrl }} style={styles.headerImage} />
        ) : (
          <LinearGradient
            colors={['#0f172a', '#312e81', '#4338ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerImage, styles.placeholderImage]}
          >
            <Feather name="book-open" size={56} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        )}

        {/* Back Button Overlay */}
        <TouchableOpacity
          style={styles.backOverlay}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{training.title}</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name="book" size={18} color="#4338ca" />
              </View>
              <Text style={styles.statValue}>{lessons.length}</Text>
              <Text style={styles.statLabel}>Ders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name="clock" size={18} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{training.duration || 60}</Text>
              <Text style={styles.statLabel}>Dakika</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name="users" size={18} color="#22c55e" />
              </View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Katılımcı</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Açıklama</Text>
            <Text style={styles.description}>{training.description}</Text>
          </View>

          {/* Lessons selector + Contents (tabs) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ders İçeriği</Text>

            {lessons.length === 0 ? (
              <View style={styles.emptyLessons}>
                <Feather name="inbox" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>Henüz ders eklenmemiş</Text>
              </View>
            ) : (
              <>
                {/* Horizontal lesson selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 2 }}>
                  {lessons.map((lesson, idx) => (
                    <TouchableOpacity
                      key={lesson.id}
                      onPress={() => { setSelectedLesson(lesson); setActiveTab('all'); }}
                      style={[styles.lessonSelector, selectedLesson?.id === lesson.id ? styles.lessonSelectorActive : {}]}
                    >
                      <Text style={[{ fontWeight: 600 }, selectedLesson?.id === lesson.id ? { color: '#312e81' } : { color: '#0f172a' }]}>{lesson.title}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{lesson.duration || 0} dk</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Progress bar for selected lesson */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>İçerik</Text>
                    <Text style={{ color: '#64748b', fontWeight: '700' }}>{contents.length > 0 ? `${Math.round((Array.from(completedItems).length / contents.length) * 100)}%` : '0%'}</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: '#eef2ff', borderRadius: 8, overflow: 'hidden' }}>
                    <View style={{ height: '100%', backgroundColor: '#4338ca', width: `${contents.length ? Math.round((Array.from(completedItems).length / contents.length) * 100) : 0}%` }} />
                  </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                  <TouchableOpacity onPress={() => setActiveTab('all')} style={[styles.tabButton, activeTab === 'all' ? styles.tabButtonActive : {}]}>
                    <Text style={activeTab === 'all' ? styles.tabTextActive : styles.tabText}>Tümü</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveTab('videos')} style={[styles.tabButton, activeTab === 'videos' ? styles.tabButtonActive : {}]}>
                    <Text style={activeTab === 'videos' ? styles.tabTextActive : styles.tabText}>Videolar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveTab('documents')} style={[styles.tabButton, activeTab === 'documents' ? styles.tabButtonActive : {}]}>
                    <Text style={activeTab === 'documents' ? styles.tabTextActive : styles.tabText}>Dokümanlar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveTab('tests')} style={[styles.tabButton, activeTab === 'tests' ? styles.tabButtonActive : {}]}>
                    <Text style={activeTab === 'tests' ? styles.tabTextActive : styles.tabText}>Testler</Text>
                  </TouchableOpacity>
                </View>

                {/* Contents list */}
                {loadingContents ? (
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <ActivityIndicator color="#4338ca" />
                  </View>
                ) : contents.length === 0 ? (
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: '#64748b' }}>Bu derste henüz içerik bulunmuyor.</Text>
                  </View>
                ) : (
                  contents.map((c) => (
                    <TouchableOpacity key={c.id} onPress={async () => {
                      try {
                        if (c.type === 'test') {
                          // navigate to Test screen with completion callback
                          (navigation.navigate as (screen: string, params: object) => void)('Test', { 
                            testId: c.id,
                            contentId: c.id,
                            onComplete: () => markAsCompleted(c.id)
                          });
                          return;
                        }

                        if (c.type === 'document' && c.url) {
                          // Mark document as completed when opened
                          await markAsCompleted(c.id);
                          // open document using WebView-based Document screen
                          (navigation.navigate as (screen: string, params: object) => void)('Document', { 
                            url: c.url, 
                            title: c.title,
                            contentId: c.id
                          });
                          return;
                        }

                        if (c.url) {
                          await Linking.openURL(c.url);
                          // mark as completed when opened
                          await markAsCompleted(c.id);
                        } else {
                          await toggleComplete(c.id);
                        }
                      } catch (err) {
                        logger.error('Failed to open url:', err);
                      }
                    }} style={styles.contentItem} activeOpacity={0.8}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                          <Feather name={c.type === 'video' ? 'play' : c.type === 'document' ? 'file-text' : 'clipboard'} size={18} color="#4338ca" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: '#0f172a' }}>{c.title}</Text>
                          {c.description ? <Text style={{ color: '#64748b', marginTop: 6 }}>{c.description}</Text> : null}
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          {completedItems.has(c.id) ? <Feather name="check-circle" size={20} color="#16a34a" /> : <Feather name="circle" size={20} color="#94a3b8" />}
                        </View>
                      </View>

                      {/* Action row */}
                      {c.type === 'video' && c.url && (
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#64748b' }}>Video dersi başlat</Text>
                          <Feather name="play" size={16} color="#4338ca" />
                        </View>
                      )}

                      {c.type === 'document' && c.url && (
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#64748b' }}>Dokümanı görüntüle</Text>
                          <Feather name="download" size={16} color="#059669" />
                        </View>
                      )}

                      {c.type === 'test' && (
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#64748b' }}>Testi başlat</Text>
                          <Feather name="arrow-right" size={16} color="#b45309" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
          <LinearGradient
            colors={['#4338ca', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Feather name="play" size={20} color="#ffffff" />
            <Text style={styles.startButtonText}>Eğitime Başla</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 24,
  },
  backButtonError: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  backButtonTextError: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    marginTop: -24,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  /* New styles */
  lessonSelector: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 8,
    minWidth: 120,
  },
  lessonSelectorActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  tabButtonActive: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
  },
  tabText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  contentItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonCardExpanded: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  lessonNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#94a3b8',
  },
  lessonContent: {
    padding: 14,
    paddingTop: 0,
    backgroundColor: '#f8fafc',
  },
  lessonContentText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  emptyLessons: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
