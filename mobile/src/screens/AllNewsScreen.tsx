// All News Screen
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
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, News } from '../types';

type AllNewsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AllNews'>;
};

export const AllNewsScreen: React.FC<AllNewsScreenProps> = ({ navigation }) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await ApiService.getNews();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderNewsItem = ({ item, index }: { item: News; index: number }) => {
    const isFeature = index === 0;
    
    if (isFeature) {
      return (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
          activeOpacity={0.8}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredImage, styles.placeholderImage]}>
              <Text style={styles.placeholderEmoji}>📰</Text>
            </View>
          )}
          <View style={styles.featuredOverlay}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>ÖNE ÇIKAN</Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.featuredDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
        ) : (
          <View style={[styles.newsImage, styles.smallPlaceholder]}>
            <Text style={styles.smallPlaceholderEmoji}>📰</Text>
          </View>
        )}
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          {item.summary && (
            <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
          )}
          <Text style={styles.newsDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Haberler</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Haberler</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📰</Text>
            <Text style={styles.emptyTitle}>Henüz Haber Yok</Text>
            <Text style={styles.emptyText}>
              Yeni haberler eklendiğinde burada görünecektir.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
  featuredCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  featuredImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  featuredBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  featuredTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  featuredDate: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  newsImage: {
    width: 120,
    height: 100,
    resizeMode: 'cover',
  },
  smallPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallPlaceholderEmoji: {
    fontSize: 32,
  },
  newsContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  newsDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
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
