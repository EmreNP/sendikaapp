// Courses Screen - Training List - Redesigned to match front web design
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
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

// Color palette for training cards
const colorPalette = [
  { colors: ['#2563eb', '#1d4ed8'], light: '#eff6ff' },
  { colors: ['#059669', '#047857'], light: '#ecfdf5' },
  { colors: ['#d97706', '#b45309'], light: '#fffbeb' },
  { colors: ['#7c3aed', '#6d28d9'], light: '#f5f3ff' },
  { colors: ['#e11d48', '#be123c'], light: '#fff1f2' },
];

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
              onPress={() => navigation.navigate('Membership' as any)}
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

  const renderTrainingItem = ({ item, index }: { item: Training; index: number }) => {
    const palette = colorPalette[index % colorPalette.length];
    
    return (
      <TouchableOpacity
        style={styles.trainingCard}
        onPress={() => navigation.navigate('CourseDetail', { trainingId: item.id })}
        activeOpacity={0.9}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.trainingImage} />
        ) : (
          <LinearGradient
            colors={palette.colors as [string, string]}
            style={[styles.trainingImage, styles.placeholderImage]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="book-open" size={48} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
        )}
        <View style={styles.trainingContent}>
          <View style={[styles.trainingBadge, { backgroundColor: palette.light }]}>
            <Text style={[styles.trainingBadgeText, { color: palette.colors[0] }]}>
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
              <Feather name="clock" size={14} color="#64748b" />
              <Text style={styles.metaText}>{item.duration || '60'} dk</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="users" size={14} color="#64748b" />
              <Text style={styles.metaText}>{(item as any).enrolledCount || 0} Katılımcı</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="book-open" size={48} color="#4338ca" />
            </View>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  trainingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  trainingImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainingContent: {
    padding: 16,
  },
  trainingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  trainingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  trainingDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  trainingMeta: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
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
});
