// Home Screen - Main Dashboard
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, Announcement, News } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

// Slider Images
const sliderImages = [
  { id: '1', uri: 'https://picsum.photos/800/400?random=1', title: 'Sendikamıza Hoş Geldiniz' },
  { id: '2', uri: 'https://picsum.photos/800/400?random=2', title: 'Eğitim Programları' },
  { id: '3', uri: 'https://picsum.photos/800/400?random=3', title: 'Haberler ve Duyurular' },
];

// Quick Access Items
const quickAccessItems = [
  { id: '1', title: 'Eğitimler', icon: '📚', route: 'Courses', color: COLORS.primary },
  { id: '2', title: 'Şubeler', icon: '🏢', route: 'Branches', color: COLORS.secondary },
  { id: '3', title: 'Haberler', icon: '📰', route: 'News', color: '#10B981' },
  { id: '4', title: 'İletişim', icon: '✉️', route: 'Contact', color: '#8B5CF6' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, isPendingDetails } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % sliderImages.length;
      setCurrentSlide(nextSlide);
      sliderRef.current?.scrollToIndex({ index: nextSlide, animated: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const fetchData = async () => {
    try {
      const [announcementsRes, newsRes] = await Promise.all([
        ApiService.getAnnouncements(),
        ApiService.getNews(),
      ]);
      setAnnouncements(announcementsRes.slice(0, 3));
      setNews(newsRes.slice(0, 3));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleQuickAccess = (route: string) => {
    if (route === 'Courses') {
      navigation.navigate('Courses');
    } else if (route === 'Branches') {
      navigation.navigate('Branches');
    } else if (route === 'News') {
      navigation.navigate('AllNews' as any);
    } else if (route === 'Contact') {
      navigation.navigate('Contact' as any);
    }
  };

  const renderSliderItem = ({ item }: { item: typeof sliderImages[0] }) => (
    <View style={styles.slideContainer}>
      <Image source={{ uri: item.uri }} style={styles.slideImage} />
      <View style={styles.slideOverlay}>
        <Text style={styles.slideTitle}>{item.title}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {sliderImages.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            currentSlide === index && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderQuickAccessItem = (item: typeof quickAccessItems[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.quickAccessItem}
      onPress={() => handleQuickAccess(item.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.quickAccessIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.quickAccessEmoji}>{item.icon}</Text>
      </View>
      <Text style={styles.quickAccessTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderAnnouncementItem = (item: Announcement) => (
    <TouchableOpacity
      key={item.id}
      style={styles.announcementItem}
      onPress={() => navigation.navigate('AllAnnouncements' as any)}
      activeOpacity={0.7}
    >
      <View style={styles.announcementBadge}>
        <Text style={styles.announcementBadgeText}>Duyuru</Text>
      </View>
      <Text style={styles.announcementTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.announcementDate}>
        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>
              {user?.firstName || 'Kullanıcı'} {user?.lastName || ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Membership Status Banner */}
        {isPendingDetails && (
          <TouchableOpacity
            style={styles.membershipBanner}
            onPress={() => navigation.navigate('Membership' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.membershipContent}>
              <Text style={styles.membershipIcon}>📋</Text>
              <View style={styles.membershipText}>
                <Text style={styles.membershipTitle}>Üyeliğinizi Tamamlayın</Text>
                <Text style={styles.membershipSubtitle}>
                  Aşama 2'yi tamamlayarak eğitimlere erişim sağlayın
                </Text>
              </View>
            </View>
            <Text style={styles.membershipArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Image Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={sliderRef}
            data={sliderImages}
            renderItem={renderSliderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setCurrentSlide(index);
            }}
          />
          {renderPagination()}
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map(renderQuickAccessItem)}
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Duyurular</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllAnnouncements' as any)}>
              <Text style={styles.seeAll}>Tümünü Gör →</Text>
            </TouchableOpacity>
          </View>
          {announcements.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.announcementsScroll}
            >
              {announcements.map(renderAnnouncementItem)}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Henüz duyuru yok</Text>
            </View>
          )}
        </View>

        {/* Recent News */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Haberler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllNews' as any)}>
              <Text style={styles.seeAll}>Tümünü Gör →</Text>
            </TouchableOpacity>
          </View>
          {news.length > 0 ? (
            news.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.newsItem}
                onPress={() => navigation.navigate('NewsDetail' as any, { newsId: item.id })}
                activeOpacity={0.7}
              >
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                )}
                <View style={styles.newsContent}>
                  <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.newsDate}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Henüz haber yok</Text>
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
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  greeting: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 20,
  },
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warning + '15',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  membershipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  membershipIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  membershipText: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  membershipSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  membershipArrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  sliderContainer: {
    height: 200,
    marginBottom: SPACING.lg,
  },
  slideContainer: {
    width: screenWidth,
    height: 200,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  slideTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.textWhite,
    width: 24,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
  },
  quickAccessItem: {
    width: (screenWidth - SPACING.lg * 2 - SPACING.md * 2) / 4,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOW.sm,
  },
  quickAccessEmoji: {
    fontSize: 24,
  },
  quickAccessTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  announcementsScroll: {
    paddingHorizontal: SPACING.lg,
  },
  announcementItem: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    ...SHADOW.sm,
  },
  announcementBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  announcementBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  announcementTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  announcementDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  newsItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  newsImage: {
    width: 100,
    height: 80,
    resizeMode: 'cover',
  },
  newsContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  newsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  newsDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
