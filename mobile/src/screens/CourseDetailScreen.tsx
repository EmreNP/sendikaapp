// Course Detail Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
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
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const [trainingsData, lessonsData] = await Promise.all([
        ApiService.getTrainings(),
        ApiService.getLessons(courseId),
      ]);
      const foundTraining = trainingsData.find((t: Training) => t.id === courseId);
      setTraining(foundTraining || null);
      setLessons(lessonsData || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
      Alert.alert('Hata', 'Eğitim detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
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
      <ScrollView showsVerticalScrollIndicator={false}>
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

          {/* Lessons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ders İçeriği</Text>
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    expandedLesson === lesson.id ? styles.lessonCardExpanded : undefined
                  ]}
                  onPress={() => toggleLesson(lesson.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.lessonHeader}>
                    <LinearGradient
                      colors={['#4338ca', '#1e40af']}
                      style={styles.lessonNumber}
                    >
                      <Text style={styles.lessonNumberText}>{index + 1}</Text>
                    </LinearGradient>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <View style={styles.lessonMeta}>
                        <Feather name="clock" size={12} color="#94a3b8" />
                        <Text style={styles.lessonDuration}>
                          {lesson.duration || 15} dakika
                        </Text>
                      </View>
                    </View>
                    <Feather 
                      name={expandedLesson === lesson.id ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color="#94a3b8" 
                    />
                  </View>
                  {expandedLesson === lesson.id && lesson.content && (
                    <View style={styles.lessonContent}>
                      <Text style={styles.lessonContentText}>{lesson.content}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyLessons}>
                <Feather name="inbox" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>Henüz ders eklenmemiş</Text>
              </View>
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
