// Courses Screen - Training List
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
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

export const CoursesScreen: React.FC<CoursesScreenProps> = ({ navigation }) => {
  const { canAccessTrainings, isPendingDetails } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (canAccessTrainings) {
      fetchTrainings();
    } else {
      setLoading(false);
    }
  }, [canAccessTrainings]);

  const fetchTrainings = async () => {
    try {
      const data = await ApiService.getTrainings();
      setTrainings(data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!canAccessTrainings) return;
    setRefreshing(true);
    await fetchTrainings();
    setRefreshing(false);
  };

  if (!canAccessTrainings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Eğitimler</Text>
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIcon}>
            <Text style={styles.lockedEmoji}>🔒</Text>
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
              onPress={() => navigation.navigate('Membership' as any)}
            >
              <Text style={styles.membershipButtonText}>Üyeliği Tamamla</Text>
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
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderTrainingItem = ({ item }: { item: Training }) => (
    <TouchableOpacity
      style={styles.trainingCard}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
      activeOpacity={0.7}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.trainingImage} />
      ) : (
        <View style={[styles.trainingImage, styles.placeholderImage]}>
          <Text style={styles.placeholderEmoji}>📚</Text>
        </View>
      )}
      <View style={styles.trainingContent}>
        <View style={styles.trainingBadge}>
          <Text style={styles.trainingBadgeText}>
            {item.lessonsCount || 0} Ders
          </Text>
        </View>
        <Text style={styles.trainingTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.trainingDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.trainingMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{item.duration || '60'} dk</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaText}>{item.enrolledCount || 0} Katılımcı</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eğitimler</Text>
        <Text style={styles.headerSubtitle}>{trainings.length} eğitim mevcut</Text>
      </View>

      <FlatList
        data={trainings}
        renderItem={renderTrainingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>Henüz Eğitim Yok</Text>
            <Text style={styles.emptyText}>
              Yeni eğitimler eklendiğinde burada görünecektir.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
  trainingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  trainingImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  trainingContent: {
    padding: SPACING.md,
  },
  trainingBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  trainingBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  trainingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  trainingDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  trainingMeta: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  lockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  lockedEmoji: {
    fontSize: 36,
  },
  lockedTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  lockedText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  membershipButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  membershipButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
