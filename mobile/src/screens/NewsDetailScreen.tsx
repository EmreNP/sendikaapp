// News Detail Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, News } from '../types';

type NewsDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewsDetail'>;
  route: RouteProp<RootStackParamList, 'NewsDetail'>;
};

export const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { newsId } = route.params;
  const [newsItem, setNewsItem] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsDetail();
  }, [newsId]);

  const fetchNewsDetail = async () => {
    try {
      const allNews = await ApiService.getNews();
      const foundNews = allNews.find((n: News) => n.id === newsId);
      setNewsItem(foundNews || null);
    } catch (error) {
      console.error('Error fetching news detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    if (!newsItem) return;
    try {
      await Share.share({
        message: `${newsItem.title}\n\nBu haberi uygulamadan okuyun.`,
        title: newsItem.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!newsItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorText}>Haber bulunamadı</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        {newsItem.imageUrl ? (
          <Image source={{ uri: newsItem.imageUrl }} style={styles.headerImage} />
        ) : (
          <View style={[styles.headerImage, styles.placeholderImage]}>
            <Text style={styles.placeholderEmoji}>📰</Text>
          </View>
        )}

        {/* Back Button Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          {newsItem.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{newsItem.category}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{newsItem.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formatDate(newsItem.createdAt)}</Text>
            </View>
            {newsItem.author && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>✍️</Text>
                <Text style={styles.metaText}>{newsItem.author}</Text>
              </View>
            )}
          </View>

          {/* Summary */}
          {newsItem.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{newsItem.summary}</Text>
            </View>
          )}

          {/* Content */}
          <Text style={styles.bodyText}>
            {newsItem.content || newsItem.summary || 'İçerik mevcut değil.'}
          </Text>

          {/* Tags */}
          {newsItem.tags && newsItem.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsTitle}>Etiketler</Text>
              <View style={styles.tagsList}>
                {newsItem.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    padding: SPACING.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  backBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  headerImage: {
    width: '100%',
    height: 280,
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
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 18,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  content: {
    padding: SPACING.lg,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  summaryContainer: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  summaryText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  bodyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: SPACING.lg,
  },
  tagsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
    marginTop: SPACING.md,
  },
  tagsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
