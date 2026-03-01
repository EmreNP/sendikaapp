// Home Screen - Main Dashboard - Birebir Front/React Tasarımından React Native Çevirisi
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
  RefreshControl,
  FlatList,
  Animated,
  Linking,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { OfflineBanner } from '../components/OfflineBanner';
import ApiService from '../services/api';
import { cacheNews, cacheAnnouncements, getCachedNews, getCachedAnnouncements } from '../services/offlineCache';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { stripHtmlTags } from '../components/HtmlContent';
import { logger } from '../utils/logger';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, Announcement, News } from '../types';

// Dinamik Layout Hesaplayıcı - Tüm öğeler ekrana otomatik sığar
const calculateDynamicLayout = (sw: number, sh: number) => {
  const statusBarHeight = 24; // Ortalama status bar
  const tabBarHeight = 60; // Bottom tab bar
  const headerHeight = 84; // Top navigation height
  const safeBottomPadding = 16;
  
  // Kullanılabilir ekran yüksekliği
  const availableHeight = sh - statusBarHeight - tabBarHeight - headerHeight - safeBottomPadding;
  
  // Bileşen oranları (toplam = 100%)
  const sliderRatio = 0.32; // %32 - Hero slider (biraz büyütüldü)
  const quickAccessRatio = 0.33; // %33 - 6'lı menü
  const announcementRatio = 0.35; // %35 - Duyurular
  
  return {
    // Slider
    sliderHeight: Math.floor(availableHeight * sliderRatio),
    sliderPadding: { top: 10, bottom: 8, horizontal: 16 },
    
    // Quick Access
    quickAccessHeight: Math.floor(availableHeight * quickAccessRatio),
    quickAccessPadding: { vertical: 8, horizontal: 16 },
    iconSize: Math.floor((sw - 64) / 3 * 0.65), // İkon container boyutu
    iconPadding: 6,
    
    // Announcements
    announcementHeight: Math.floor(availableHeight * announcementRatio),
    announcementPadding: { vertical: 8, horizontal: 16 },
    
    // Membership banner
    membershipBannerHeight: 48,
  };
};

// Initial dimensions for StyleSheet (fallback)
const _initDim = Dimensions.get('window');
const DEFAULT_LAYOUT = calculateDynamicLayout(_initDim.width, _initDim.height);
const _initScreenWidth = _initDim.width;

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

// Bundled fallback slider images
const FALLBACK_SLIDER_IMAGES = [
  require('../../assets/images/slider/slide_1.jpg'),
  require('../../assets/images/slider/slide_2.jpg'),
  require('../../assets/images/slider/slide_3.jpg'),
];

// Front ImageSlider - 3 slayt (front/src/components/ImageSlider.tsx'den birebir)
// İslami / Sendika temalı görseller - artık bundled
const sliderImages = [
  { 
    id: '1', 
    source: FALLBACK_SLIDER_IMAGES[0],
    title: 'Sendika Etkinliklerimiz', 
    description: 'Üyelerimiz için düzenlenen toplantılar ve seminerler' 
  },
  { 
    id: '2', 
    source: FALLBACK_SLIDER_IMAGES[1],
    title: 'Yönetim Kurulu', 
    description: 'Sendikamızın önderliğinde güçlü birliktelik' 
  },
  { 
    id: '3', 
    source: FALLBACK_SLIDER_IMAGES[2],
    title: 'Hak ve Adalet Mücadelemiz', 
    description: 'Din görevlilerinin haklarını savunuyoruz' 
  },
];

// Front QuickAccessGrid - 6 buton (front/src/components/QuickAccessGrid.tsx'den birebir)
// icon mapping: lucide-react -> Feather (birebir renk kodları)
// Frontend renkleri: blue-600 #2563eb, blue-700 #1d4ed8, indigo-600 #4f46e5, indigo-700 #4338ca, cyan-600 #0891b2, cyan-700 #0e7490
// Sıralama: 1-Bize Ulaşın, 2-Haberler, 3-Anlaşmalı Kurumlar, 4-5-6 Rastgele
const quickAccessItems = [
  { id: '1', title: 'Bize Ulaşın', icon: 'phone', route: 'Contact', colors: ['#64748b', '#475569'] as [string, string] },
  { id: '2', title: 'Haberler', icon: 'book-open', route: 'News', colors: ['#4f46e5', '#4338ca'] as [string, string] },
  { id: '3', title: 'Anlaşmalı Kurumlar', icon: 'home', route: 'PartnerInstitutions', colors: ['#64748b', '#475569'] as [string, string] },
  { id: '4', title: 'Hutbeler', icon: 'book', route: 'Hutbeler', colors: ['#2563eb', '#1d4ed8'] as [string, string] },
  { id: '5', title: 'Müktesep Hesaplama', icon: 'percent', route: 'Muktesep', colors: ['#2563eb', '#1d4ed8'] as [string, string] },
  { id: '6', title: 'DİBBYS', icon: 'database', route: 'DIBBYS', colors: ['#0891b2', '#0e7490'] as [string, string] },
];

// Fallback yok — API boş dönerse boş liste gösterilir



export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, isPendingDetails } = useAuth();

  // Status bar'ı light arka plan için dark-content'e ayarla
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
    }, [])
  );

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const LAYOUT = useMemo(() => calculateDynamicLayout(screenWidth, screenHeight), [screenWidth, screenHeight]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAnnouncementSlide, setCurrentAnnouncementSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);
  const [sliderNews, setSliderNews] = useState<News[]>([]);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    fetchData();
  }, []);

  // Auto slide for ImageSlider (front: 5000ms interval)
  useEffect(() => {
    if (sliderNews.length === 0) return;
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % sliderNews.length;
      setCurrentSlide(nextSlide);
      sliderRef.current?.scrollToIndex({ index: nextSlide, animated: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, sliderNews.length]);

  // Auto slide for Announcements (front: 5000ms interval)
  useEffect(() => {
    if (announcements.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAnnouncementSlide((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length, currentAnnouncementSlide]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [announcementsData, newsData, featuredNewsData] = await Promise.all([
        ApiService.getAnnouncements({ limit: 5 }).catch(() => ({ items: [], total: 0, hasMore: false })),
        ApiService.getNews({ isPublished: true, limit: 20 }).catch(() => ({ items: [], total: 0, hasMore: false })),
        ApiService.getNews({ isFeatured: true, isPublished: true, limit: 5 }).catch(() => ({ items: [], total: 0, hasMore: false })),
      ]);
      // API verisi varsa kullan, yoksa boş liste göster
      const fetchedAnnouncements = announcementsData.items.slice(0, 5);
      const fetchedNews = newsData.items.slice(0, 3);
      setAnnouncements(fetchedAnnouncements);
      setNews(fetchedNews);
      
      // Slider için öne çıkan haberleri al (isFeatured=true)
      setSliderNews(featuredNewsData.items.length > 0 ? featuredNewsData.items : newsData.items.slice(0, 3));

      // Cache successful data for offline use
      if (fetchedAnnouncements.length > 0) await cacheAnnouncements(fetchedAnnouncements);
      if (fetchedNews.length > 0) await cacheNews(newsData.items);
    } catch (error) {
      logger.error('Error fetching data:', error);
      // Try loading from cache for offline use
      const cachedNewsData = await getCachedNews();
      const cachedAnnouncementsData = await getCachedAnnouncements();
      
      if (cachedAnnouncementsData && cachedAnnouncementsData.length > 0) {
        setAnnouncements(cachedAnnouncementsData);
      } else {
        setAnnouncements([]);
      }
      
      if (cachedNewsData && cachedNewsData.length > 0) {
        setNews(cachedNewsData.slice(0, 3));
        setSliderNews(cachedNewsData.slice(0, 3));
      } else {
        setNews([]);
        setSliderNews([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleQuickAccess = useCallback(async (route: string) => {
    if (route === 'Hutbeler') {
      const url = 'https://dinhizmetleri.diyanet.gov.tr/kategoriler/yayinlarimiz/hutbeler/t%C3%BCrk%C3%A7e';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Bağlantı açılamıyor.');
      }
    } else if (route === 'DIBBYS') {
      // DİBBYS direkt login sayfasına yönlendir
      const url = 'https://dibbys.diyanet.gov.tr/Login.aspx?enc=HAd1rtUZbsmBBo0sEDuy4U2vPzpkTelv19DifeZ3rEY%3d';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Bağlantı açılamıyor.');
      }
    } else if (route === 'News') {
      navigation.navigate('AllNews');
    } else if (route === 'Contact') {
      navigation.navigate('Contact');
    } else if (route === 'Muktesep') {
      navigation.navigate('Muktesep');
    } else if (route === 'PartnerInstitutions') {
      navigation.navigate('PartnerInstitutions');
    }
  }, [navigation]);

  // Front AnnouncementSection'dan - Öncelik renkleri
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: '#fee2e2', text: '#b91c1c' };
      case 'high': return { bg: '#ffedd5', text: '#c2410c' };
      case 'normal': return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'low': return { bg: '#f3f4f6', text: '#374151' };
      default: return { bg: '#dbeafe', text: '#1d4ed8' };
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Önemli';
      case 'normal': return 'Duyuru';
      case 'low': return 'Bilgi';
      default: return 'Duyuru';
    }
  };

  type AnyDate = string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined | null;
  const toDate = (d: AnyDate): Date => {
    if (!d) return new Date();
    if (typeof d === 'object' && 'seconds' in d) return new Date(((d as any).seconds ?? (d as any)._seconds ?? 0) * 1000);
    return new Date(d as string | Date);
  };
  const formatDate = (date: AnyDate) => {
    const d = toDate(date);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (date: AnyDate) => {
    const d = toDate(date);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Front ImageSlider - rounded-2xl, shadow, overlay (Haberlerden)
  const renderSliderItem = useCallback(({ item }: { item: News }) => (
    <TouchableOpacity 
      style={[styles.slideContainer, { width: screenWidth - 32, height: LAYOUT.sliderHeight }]}
      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
      activeOpacity={0.9}
      accessibilityLabel={`Haber: ${item.title}`}
      accessibilityRole="button"
      accessibilityHint="Haber detayını görmek için dokunun"
    >
      <Image 
        source={item.imageUrl ? { uri: item.imageUrl } : FALLBACK_SLIDER_IMAGES[0]} 
        style={styles.slideImage} 
      />
      {/* Gradient overlay - bottom to top, concentrated at bottom for title readability */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.38, 0.72, 1]}
        style={styles.slideOverlay}
      />
      <View style={styles.slideTextContainer}>
        <Text style={styles.slideTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  ), [screenWidth, LAYOUT.sliderHeight, navigation]);

  const sliderKeyExtractor = useCallback((item: News) => item.id, []);

  // Slider pagination dots
  const renderPagination = () => (
    <View style={styles.pagination}>
      {sliderNews.map((_, index) => (
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

  // Front QuickAccessGrid - white card with gradient icon
  const renderQuickAccessItem = (item: typeof quickAccessItems[0]) => {
    // Responsive genişlik: En az 100px, ideal 3 sütun
    // Math.floor ile sub-pixel taşmayı önle (3x2 grid bozulmasını engeller)
    const cardWidth = Math.floor(Math.max(100, (screenWidth - 32 - 24) / 3));
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.quickAccessCard, { width: cardWidth }]}
        onPress={() => handleQuickAccess(item.route)}
        activeOpacity={0.8}
        accessibilityLabel={item.title}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={item.colors}
          style={styles.quickAccessIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={item.icon as keyof typeof Feather.glyphMap} size={Math.floor(LAYOUT.iconSize * 0.5)} color="#ffffff" />
          {/* Shine overlay - from-white/20 to-transparent */}
          <View style={styles.iconShine} />
        </LinearGradient>
        <Text style={styles.quickAccessTitle} numberOfLines={2}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  // Front AnnouncementSection - single announcement slider
  const renderAnnouncementSlider = () => {
    if (isLoading) {
      return (
        <View style={styles.announcementLoading}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      );
    }

    if (announcements.length === 0) {
      return (
        <View style={styles.announcementEmpty}>
          <Text style={styles.emptyText}>Henüz duyuru bulunmuyor</Text>
        </View>
      );
    }

    const currentAnnouncement = announcements[currentAnnouncementSlide];
    const priorityColors = getPriorityColor(currentAnnouncement.priority || 'normal');

    return (
      <TouchableOpacity
        style={styles.announcementCard}
        onPress={() => navigation.navigate('AllAnnouncements')}
        activeOpacity={0.9}
        accessibilityLabel={`Duyuru: ${currentAnnouncement.title}`}
        accessibilityRole="button"
        accessibilityHint="Tüm duyuruları görmek için dokunun"
      >
        <View style={styles.announcementContent}>
          <View style={styles.announcementLeft}>
            {/* Priority badge */}
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
              <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                {getPriorityLabel(currentAnnouncement.priority || 'normal')}
              </Text>
            </View>
            
            <Text style={styles.announcementTitle} numberOfLines={2}>
              {currentAnnouncement.title}
            </Text>
            
            <Text style={styles.announcementSummary} numberOfLines={3}>
              {stripHtmlTags((currentAnnouncement as Announcement).summary || currentAnnouncement.content || '')}
            </Text>
            
            <View style={styles.announcementMeta}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={14} color="#6b7280" />
                <Text style={styles.metaText}>
                  {formatDate(currentAnnouncement.createdAt || new Date())}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color="#6b7280" />
                <Text style={styles.metaText}>
                  {formatTime(currentAnnouncement.createdAt || new Date())}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.announcementRight}>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Front TopNavigation - logo ve marka */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.topNavigation}
      >
        <View style={styles.brandSection}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')}
              style={styles.logo}
              contentFit="cover"
            />
          </View>
          {/* Marka İsmi */}
          <View style={styles.brandText}>
            <Text style={styles.brandName}>Türk Diyanet Vakıf-sen</Text>
            <View style={styles.brandSubtitle}>
              <View style={styles.subtitleLine} />
              <Text style={styles.subtitleText}>KONYA</Text>
            </View>
          </View>
        </View>
        {/* Sağ İkon: Hamburger Menu */}
        <View style={styles.headerRightIcons}>
          <HamburgerMenu
            onMembershipClick={() => navigation.navigate('Membership')}
            onNotificationsClick={() => navigation.navigate('Notifications')} 
            onAboutClick={() => navigation.navigate('About')}
            onProfileClick={() => navigation.navigate('Profile')}
          />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
        }
      >
        {/* Membership Status Banner */}
        {isPendingDetails && (
          <TouchableOpacity
            style={styles.membershipBanner}
            onPress={() => navigation.navigate('Membership')}
            activeOpacity={0.8}
            accessibilityLabel="Üyeliğinizi tamamlayın"
            accessibilityRole="button"
            accessibilityHint="Üyelik başvurunuzu tamamlamak için dokunun"
          >
            <LinearGradient
              colors={['#fef3c7', '#fde68a']}
              style={styles.membershipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.membershipContent}>
                <View style={styles.membershipIconContainer}>
                  <Feather name="clipboard" size={20} color="#d97706" />
                </View>
                <View style={styles.membershipText}>
                  <Text style={styles.membershipTitle}>Üyeliğinizi Tamamlayın</Text>
                  <Text style={styles.membershipSubtitle}>
                    Aşama 2'yi tamamlayarak eğitimlere erişim sağlayın
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={24} color="#d97706" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Image Slider - Front: rounded-2xl, shadow-xl, px-4 pt-3 pb-2 (Haberlerden) */}
        <View style={styles.sliderWrapper}>
          <View style={styles.sliderContainer}>
            {isLoading ? (
              <View style={styles.sliderLoading}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : sliderNews.length > 0 ? (
              <>
                <FlatList
                  ref={sliderRef}
                  data={sliderNews}
                  renderItem={renderSliderItem}
                  keyExtractor={sliderKeyExtractor}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews={true}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                  )}
                  onMomentumScrollEnd={(e) => {
                    const sliderWidth = screenWidth - 32;
                    const index = Math.round(e.nativeEvent.contentOffset.x / sliderWidth);
                    setCurrentSlide(index);
                  }}
                />
                {renderPagination()}
              </>
            ) : (
              <View style={styles.sliderEmpty}>
                <Text style={styles.emptyText}>Henüz öne çıkan haber bulunmuyor</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Access Grid - Front: px-4 py-3, grid-cols-3, gap-3 */}
        <View style={styles.quickAccessSection}>
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map(renderQuickAccessItem)}
          </View>
        </View>

        {/* Announcements Section - Front: px-4 py-3, single slider */}
        <View style={styles.announcementSection}>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementTitleRow}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.announcementIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="volume-2" size={18} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.announcementSectionTitle}>Duyurular</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('AllAnnouncements')}
              accessibilityLabel="Tüm duyuruları gör"
              accessibilityRole="button"
            >
              <Text style={styles.seeAllText}>Tümü</Text>
              <Feather name="arrow-right" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {renderAnnouncementSlider()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Premium slate background
  },
  // TopNavigation - Kurumsal Mavi Tasarım
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  brandText: {
    gap: 4,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitleLine: {
    width: 20,
    height: 2,
    backgroundColor: '#2563eb',
    borderRadius: 1,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
  },
  menuButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Membership banner
  membershipBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  membershipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  membershipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  membershipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  membershipText: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  membershipSubtitle: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  // Image Slider - Premium Design
  sliderWrapper: {
    paddingHorizontal: DEFAULT_LAYOUT.sliderPadding.horizontal,
    paddingTop: DEFAULT_LAYOUT.sliderPadding.top,
    paddingBottom: DEFAULT_LAYOUT.sliderPadding.bottom,
  },
  sliderContainer: {
    height: DEFAULT_LAYOUT.sliderHeight,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  sliderLoading: {
    height: DEFAULT_LAYOUT.sliderHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  sliderEmpty: {
    height: DEFAULT_LAYOUT.sliderHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  slideContainer: {
    width: _initScreenWidth - 32,
    height: DEFAULT_LAYOUT.sliderHeight,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slideTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 36,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  slideDescription: {
    fontSize: 13,
    color: '#f1f5f9',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  seeAllBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeAllBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Quick Access - Premium Grid Design
  quickAccessSection: {
    paddingHorizontal: DEFAULT_LAYOUT.quickAccessPadding.horizontal,
    paddingVertical: DEFAULT_LAYOUT.quickAccessPadding.vertical,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessCard: {
    width: Math.floor((_initScreenWidth - 32 - 24) / 3), // 3 columns with gap
    alignItems: 'center',
    paddingVertical: DEFAULT_LAYOUT.iconPadding,
    paddingHorizontal: 2,
  },
  quickAccessIcon: {
    width: DEFAULT_LAYOUT.iconSize,
    height: DEFAULT_LAYOUT.iconSize,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DEFAULT_LAYOUT.iconPadding,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  quickAccessIconDibbys: {
    width: DEFAULT_LAYOUT.iconSize,
    height: DEFAULT_LAYOUT.iconSize,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DEFAULT_LAYOUT.iconPadding,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dibbysLogo: {
    width: Math.floor(DEFAULT_LAYOUT.iconSize * 0.75),
    height: Math.floor(DEFAULT_LAYOUT.iconSize * 0.75),
  },
  iconShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  quickAccessTitle: {
    fontSize: 13,
    color: '#374151', // text-gray-700
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 17,
    paddingHorizontal: 2,
  },
  // Announcements Section - Front birebir
  announcementSection: {
    paddingHorizontal: DEFAULT_LAYOUT.announcementPadding.horizontal,
    paddingVertical: DEFAULT_LAYOUT.announcementPadding.vertical,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  announcementIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  announcementSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
  },
  seeAllText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  announcementLoading: {
    height: DEFAULT_LAYOUT.announcementHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementEmpty: {
    height: DEFAULT_LAYOUT.announcementHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementCard: {
    backgroundColor: 'rgba(255,255,255,0.85)', // bg-white/85
    borderRadius: 16, // rounded-2xl
    padding: 14,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    minHeight: DEFAULT_LAYOUT.announcementHeight * 0.75,
  },
  announcementContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  announcementLeft: {
    flex: 1,
  },
  announcementRight: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 22,
  },
  announcementSummary: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 10,
    lineHeight: 18,
    flex: 1,
  },
  announcementMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
