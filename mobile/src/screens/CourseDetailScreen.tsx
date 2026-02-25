// Course Detail Screen
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
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
import type { RootStackParamList, Training, Lesson, LessonContent } from '../types';

type CourseDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>;
  route: RouteProp<RootStackParamList, 'CourseDetail'>;
};

const BOTTOM_BAR_H = 82;

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { trainingId: courseId } = route.params;
  const { height: screenHeight } = useWindowDimensions();

  const [training, setTraining] = useState<Training | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const DESCRIPTION_WORD_LIMIT = 40;

  // Content/tab state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [allContents, setAllContents] = useState<LessonContent[]>([]);
  const [lessonAllCache, setLessonAllCache] = useState<Record<string, LessonContent[]>>({});
  const [lessonContentIdsByLesson, setLessonContentIdsByLesson] = useState<Record<string, string[]>>({});
  const [loadingContents, setLoadingContents] = useState(false);
  const [activeTab, setActiveTab] = useState<'all'|'videos'|'documents'|'tests'>('all');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [stickyHeight, setStickyHeight] = useState(180);
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [didAutoSelectLesson, setDidAutoSelectLesson] = useState(false);
  const loadRequestRef = useRef(0);

  const storageKey = `@sendika_completed_${courseId}`;

  // Handle completedContentId passed back from TestScreen
  useEffect(() => {
    const completedContentId = route.params?.completedContentId;
    if (completedContentId) {
      markAsCompleted(completedContentId);
      // Clear the param so it doesn't re-trigger
      navigation.setParams({ completedContentId: undefined } as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.completedContentId]);

  // Memoized progress — evaluated per-lesson, independent of active filter
  const progress = useMemo(() => {
    const done = allContents.filter(c => completedItems.has(c.id)).length;
    const total = allContents.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isAllDone = total > 0 && done === total;
    const isStarted = done > 0 && !isAllDone;
    return { done, total, pct, isAllDone, isStarted };
  }, [allContents, completedItems]);

  // Exact min-height: enough to push header off-screen, no excess scroll
  const contentMinHeight = Math.max(0, screenHeight - stickyHeight - BOTTOM_BAR_H);

  useEffect(() => {
    // Invalidate any in-flight loadContents calls from previous course
    loadRequestRef.current += 1;
    setSelectedLesson(null);
    setContents([]);
    setAllContents([]);
    setLessonAllCache({});
    setLessonContentIdsByLesson({});
    setCompletedLoaded(false);
    fetchCourseDetails();
    loadCompletedItems();
    setDidAutoSelectLesson(false);
  }, [courseId]);

  // hide full desc when training changes
  useEffect(() => {
    setShowFullDesc(false);
  }, [training]);

  useEffect(() => {
    // When course + lesson selection changes, load contents for the selected lesson
    if (selectedLesson) {
      loadContents(selectedLesson.id, activeTab);
    }
  }, [selectedLesson, activeTab]);

  useEffect(() => {
    if (lessons.length === 0) return;

    let isMounted = true;
    const prefetchLessonsInBackground = async () => {
      try {
        const missingLessons = lessons.filter((lesson) => !lessonAllCache[lesson.id]);
        if (missingLessons.length === 0) return;

        const entries = await Promise.all(
          missingLessons.map(async (lesson) => {
            const data = await ApiService.getLessonContents(lesson.id);
            return [lesson.id, data || []] as const;
          }),
        );

        if (!isMounted) return;
        setLessonAllCache((prev) => {
          const next = { ...prev };
          for (const [lessonId, data] of entries) {
            next[lessonId] = data;
          }
          return next;
        });
        setLessonContentIdsByLesson((prev) => {
          const next = { ...prev };
          for (const [lessonId, data] of entries) {
            next[lessonId] = data.map((item) => item.id);
          }
          return next;
        });
      } catch (err) {
        logger.error('Error prefetching lesson contents:', err);
      }
    };

    prefetchLessonsInBackground();

    return () => {
      isMounted = false;
    };
  }, [lessons]);

  useEffect(() => {
    if (!completedLoaded || lessons.length === 0 || didAutoSelectLesson) return;

    let isMounted = true;
    const pickInitialLesson = async () => {
      try {
        // Route param has priority
        if (route.params.lessonId) {
          const target = lessons.find((l) => l.id === route.params.lessonId);
          if (target && isMounted) {
            setSelectedLesson(target);
            setDidAutoSelectLesson(true);
            return;
          }
        }

        const localCache = { ...lessonAllCache };
        const missingLessons = lessons.filter((lesson) => !localCache[lesson.id]);

        if (missingLessons.length > 0) {
          const fetched = await Promise.all(
            missingLessons.map(async (lesson) => {
              const data = await ApiService.getLessonContents(lesson.id);
              return [lesson.id, data || []] as const;
            }),
          );

          for (const [lessonId, data] of fetched) {
            localCache[lessonId] = data;
          }

          if (isMounted) {
            setLessonAllCache((prev) => ({ ...prev, ...Object.fromEntries(fetched) }));
            setLessonContentIdsByLesson((prev) => ({
              ...prev,
              ...Object.fromEntries(fetched.map(([lessonId, data]) => [lessonId, data.map((item) => item.id)])),
            }));
          }
        }

        for (const lesson of lessons) {
          const data = localCache[lesson.id] || [];

          const total = data.length;
          const done = data.filter((item) => completedItems.has(item.id)).length;
          if (total === 0 || done < total) {
            if (isMounted) {
              setSelectedLesson(lesson);
              setDidAutoSelectLesson(true);
            }
            return;
          }
        }

        if (isMounted) {
          setSelectedLesson(lessons[0] || null);
          setDidAutoSelectLesson(true);
        }
      } catch (err) {
        logger.error('Error selecting initial lesson:', err);
        if (isMounted) {
          setSelectedLesson(lessons[0] || null);
          setDidAutoSelectLesson(true);
        }
      }
    };

    pickInitialLesson();

    return () => {
      isMounted = false;
    };
  }, [completedLoaded, lessons, didAutoSelectLesson, completedItems, route.params.lessonId]);

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

      // Immediate selection for better perceived performance
      const immediateLesson = route.params.lessonId
        ? lessonsData.find((l: Lesson) => l.id === route.params.lessonId)
        : lessonsData[0];
      if (immediateLesson) {
        setSelectedLesson(immediateLesson);
      }
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

  const loadContents = async (lessonId: string, tab: 'all'|'videos'|'documents'|'tests') => {
    const requestId = ++loadRequestRef.current;

    try {
      setLoadingContents(true);
      logger.info(`Loading contents for lesson ${lessonId}, tab: ${tab}`);

      const filterByTab = (items: LessonContent[], currentTab: 'all'|'videos'|'documents'|'tests'): LessonContent[] => {
        if (currentTab === 'all') return items;
        if (currentTab === 'videos') return items.filter((item) => item.type === 'video');
        if (currentTab === 'documents') return items.filter((item) => item.type === 'document');
        return items.filter((item) => item.type === 'test');
      };

      // Cache-first per lesson: only one backend request for all tabs of a lesson
      const allData = lessonAllCache[lessonId] ?? await ApiService.getLessonContents(lessonId);

      // Drop stale response if a newer lesson/tab request already started
      if (requestId !== loadRequestRef.current) {
        return;
      }

      if (!lessonAllCache[lessonId]) {
        setLessonAllCache((prev) => ({ ...prev, [lessonId]: allData || [] }));
      }

      setAllContents(allData || []);
      setLessonContentIdsByLesson((prev) => ({
        ...prev,
        [lessonId]: (allData || []).map((item) => item.id),
      }));
      setContents(filterByTab(allData || [], tab));
    } catch (err) {
      if (requestId !== loadRequestRef.current) {
        return;
      }
      logger.error('Error loading contents:', err);
      setContents([]);
      setAllContents([]);
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoadingContents(false);
      }
    }
  };

  const loadCompletedItems = async () => {
    try {
      // First check course-scoped key
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCompletedItems(new Set(parsed));
        setCompletedLoaded(true);
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
    } finally {
      setCompletedLoaded(true);
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
        stickyHeaderIndices={lessons.length > 0 ? [1] : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
        }
      >
        {/* 0: Header – scrolls away naturally */}
        <View>
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

          <TouchableOpacity style={styles.backOverlay} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>{training.title}</Text>
            {training.description ? (
              <>
                <Text style={[styles.description, { marginTop: 12 }]}>
                  {showFullDesc
                    ? training.description
                    : (() => {
                        const words = training.description.split(' ');
                        if (words.length <= DESCRIPTION_WORD_LIMIT) return training.description;
                        return words.slice(0, DESCRIPTION_WORD_LIMIT).join(' ') + '...';
                      })()}
                </Text>
                {training.description.split(' ').length > DESCRIPTION_WORD_LIMIT && (
                  <TouchableOpacity onPress={() => setShowFullDesc(prev => !prev)}>
                    <Text style={styles.showMoreText}>
                      {showFullDesc ? 'Daha az göster' : 'Daha fazla göster'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        </View>

        {/* 1: Sticky – lesson selector + progress + tabs */}
        {lessons.length === 0 ? (
          <View style={styles.emptyLessons}>
            <Feather name="inbox" size={32} color="#94a3b8" />
            <Text style={styles.emptyText}>Henüz ders eklenmemiş</Text>
          </View>
        ) : (
          <View style={styles.stickySection} onLayout={(e) => setStickyHeight(e.nativeEvent.layout.height)}>
            {/* Horizontal lesson selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}
            >
              {lessons.map((lesson) => {
                const lessonIds = lessonContentIdsByLesson[lesson.id] || [];
                const total = lessonIds.length;
                const done = lessonIds.filter((id) => completedItems.has(id)).length;
                const isLessonDone = total > 0 && done === total;
                const isSelected = selectedLesson?.id === lesson.id;

                return (
                  <TouchableOpacity
                    key={lesson.id}
                    onPress={() => { setSelectedLesson(lesson); setActiveTab('all'); }}
                    style={[styles.lessonSelector, isSelected ? styles.lessonSelectorActive : {}]}
                  >
                    <View style={styles.lessonTitleRow}>
                      <Text style={[styles.lessonTitleText, isSelected ? styles.lessonTitleTextActive : null]} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      {isLessonDone ? <Feather name="check-circle" size={14} color="#16a34a" /> : null}
                    </View>
                    <Text style={styles.lessonMetaText}>{total} içerik</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>İçerik</Text>
                <Text style={styles.progressPct}>{progress.pct}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress.pct}%` }]} />
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              {(['all', 'videos', 'documents', 'tests'] as const).map((tab) => {
                const labels = { all: 'Tümü', videos: 'Videolar', documents: 'Dokümanlar', tests: 'Testler' };
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : {}]}
                  >
                    <Text style={activeTab === tab ? styles.tabTextActive : styles.tabText}>{labels[tab]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 2: Content list – scrolls */}
        <View style={[styles.contentListSection, lessons.length > 0 && { minHeight: contentMinHeight }]}>
          {loadingContents ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator color="#4338ca" />
            </View>
          ) : contents.length === 0 ? (
            <View style={{ padding: 24 }}>
              <Text style={{ color: '#64748b' }}>Bu derste henüz içerik bulunmuyor.</Text>
            </View>
          ) : (
            contents.map((c: LessonContent) => (
              <TouchableOpacity key={c.id} onPress={async () => {
                try {
                  if (c.type === 'test') {
                    (navigation.navigate as (screen: string, params: object) => void)('Test', {
                      testId: c.id, contentId: c.id,
                      trainingId: courseId,
                      lessonId: selectedLesson?.id,
                    });
                    return;
                  }
                  if (c.type === 'document' && c.url) {
                    await markAsCompleted(c.id);
                    (navigation.navigate as (screen: string, params: object) => void)('Document', {
                      url: c.url, title: c.title, contentId: c.id
                    });
                    return;
                  }
                  if (c.type === 'video' && (c.url || c.videoPath)) {
                    await markAsCompleted(c.id);
                    (navigation.navigate as (screen: string, params: object) => void)('Video', {
                      url: c.url || c.videoPath, videoSource: c.videoSource,
                      title: c.title, contentId: c.id
                    });
                    return;
                  }
                  await toggleComplete(c.id);
                } catch (err) {
                  logger.error('Failed to open content:', err);
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
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={progress.isAllDone ? 1 : 0.8}
          onPress={() => {
            if (progress.isAllDone) return;
            const first = progress.isStarted
              ? allContents.find(c => !completedItems.has(c.id))
              : allContents[0];
            if (!first) return;
            if (first.type === 'test') {
              (navigation.navigate as (screen: string, params: object) => void)('Test', {
                testId: first.id, contentId: first.id,
                trainingId: courseId,
                lessonId: selectedLesson?.id,
              });
            } else if (first.type === 'document' && first.url) {
              markAsCompleted(first.id);
              (navigation.navigate as (screen: string, params: object) => void)('Document', {
                url: first.url, title: first.title, contentId: first.id
              });
            } else if (first.type === 'video' && (first.url || first.videoPath)) {
              markAsCompleted(first.id);
              (navigation.navigate as (screen: string, params: object) => void)('Video', {
                url: first.url || first.videoPath, videoSource: first.videoSource,
                title: first.title, contentId: first.id
              });
            }
          }}
        >
          <LinearGradient
            colors={progress.isAllDone ? ['#16a34a', '#15803d'] : progress.isStarted ? ['#ea580c', '#c2410c'] : ['#4338ca', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Feather
              name={progress.isAllDone ? 'check-circle' : progress.isStarted ? 'pause-circle' : 'play'}
              size={20}
              color="#ffffff"
            />
            <Text style={styles.startButtonText}>
              {progress.isAllDone ? 'Tamamlandı' : progress.isStarted ? 'Eğitime Devam Et' : 'Eğitime Başla'}
            </Text>
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
  stickySection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontWeight: '600',
    color: '#0f172a',
  },
  progressPct: {
    color: '#64748b',
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4338ca',
  },
  contentListSection: {
    padding: 16,
    paddingBottom: 32,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  showMoreText: {
    color: '#4338ca',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  lessonSelector: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 8,
    minWidth: 120,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonTitleText: {
    flex: 1,
    fontWeight: '600',
    color: '#0f172a',
  },
  lessonTitleTextActive: {
    color: '#312e81',
  },
  lessonMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  lessonSelectorActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
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
