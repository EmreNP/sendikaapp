// Announcement Detail Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { HtmlContent } from '../components/HtmlContent';
import { DetailSkeleton } from '../components/SkeletonLoader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, Announcement } from '../types';

type AnnouncementDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AnnouncementDetail'>;
  route: RouteProp<RootStackParamList, 'AnnouncementDetail'>;
};

type AnyDate =
  | string
  | Date
  | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number }
  | undefined
  | null;

export const AnnouncementDetailScreen: React.FC<AnnouncementDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { announcementId } = route.params;
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncementDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId]);

  const fetchAnnouncementDetail = async () => {
    try {
      setErrorMessage(null);
      const found = await ApiService.getAnnouncementItem(announcementId);
      setAnnouncement(found || null);
    } catch (error) {
      logger.error('Error fetching announcement detail:', error);
      setErrorMessage(getUserFriendlyErrorMessage(error, 'Duyuru detayı yüklenemedi.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncementDetail();
  };

  const toDate = (d: AnyDate): Date => {
    if (!d) return new Date();
    if (typeof d === 'object' && 'seconds' in d) {
      return new Date(((d.seconds ?? d._seconds ?? 0) as number) * 1000);
    }
    return new Date(d as string | Date);
  };

  const formatDateTime = (d: AnyDate) => {
    const date = toDate(d);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!announcement) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorText}>{errorMessage || 'Duyuru bulunamadı'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4338ca']}
          />
        }
      >
        {/* Header Image / Placeholder */}
        {announcement.imageUrl ? (
          <Image source={{ uri: announcement.imageUrl }} style={styles.headerImage} />
        ) : (
          <LinearGradient
            colors={['#0f172a', '#312e81', '#4338ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerImage, styles.placeholderImage]}
          >
            <Feather name="bell" size={56} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        )}

        {/* Back Button Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{announcement.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color="#64748b" />
              <Text style={styles.metaText}>{formatDateTime(announcement.createdAt || '')}</Text>
            </View>
            {announcement.externalUrl ? (
              <View style={styles.metaItem}>
                <Feather name="external-link" size={14} color="#2563eb" />
                <Text style={styles.metaLinkText}>Harici Bağlantı</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bodyContainer}>
            <HtmlContent html={announcement.content || 'İçerik mevcut değil.'} />
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
    textAlign: 'center',
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
    aspectRatio: 16 / 9,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    lineHeight: 30,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  metaLinkText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  bodyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
});
