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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { HtmlContent, stripHtmlTags } from '../components/HtmlContent';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsDetail();
  }, [newsId]);

  const fetchNewsDetail = async () => {
    try {
      setErrorMessage(null);
      const foundNews = await ApiService.getNewsItem(newsId);
      setNewsItem(foundNews || null);
    } catch (error) {
      console.error('Error fetching news detail:', error);
      setErrorMessage(getUserFriendlyErrorMessage(error, 'Haber detayı yüklenemedi.'));
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
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      </SafeAreaView>
    );
  }

  if (!newsItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorText}>{errorMessage || 'Haber bulunamadı'}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#4338ca', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backBtnGradient}
            >
              <Feather name="arrow-left" size={18} color="#ffffff" />
              <Text style={styles.backBtnText}>Geri Dön</Text>
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
        {newsItem.imageUrl ? (
          <Image source={{ uri: newsItem.imageUrl }} style={styles.headerImage} />
        ) : (
          <LinearGradient
            colors={['#0f172a', '#312e81', '#4338ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerImage, styles.placeholderImage]}
          >
            <Feather name="file-text" size={56} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        )}

        {/* Back Button Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          {newsItem.category && (
            <LinearGradient
              colors={['#4338ca', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.categoryBadge}
            >
              <Text style={styles.categoryText}>{newsItem.category}</Text>
            </LinearGradient>
          )}

          {/* Title */}
          <Text style={styles.title}>{newsItem.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color="#64748b" />
              <Text style={styles.metaText}>{formatDate(newsItem.createdAt || '')}</Text>
            </View>
            {newsItem.author && (
              <View style={styles.metaItem}>
                <Feather name="user" size={14} color="#64748b" />
                <Text style={styles.metaText}>{newsItem.author}</Text>
              </View>
            )}
          </View>

          {/* Summary */}
          {newsItem.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{stripHtmlTags(newsItem.summary || '')}</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.bodyContainer}>
            <HtmlContent html={newsItem.content || newsItem.summary || 'İçerik mevcut değil.'} />
          </View>
        </View>
      </ScrollView>
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
  backBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  backBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
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
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#4338ca',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryText: {
    fontSize: 15,
    color: '#0f172a',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  bodyContainer: {
    marginBottom: 24,
  },
  tagsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
    marginTop: 8,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '500',
  },
});
