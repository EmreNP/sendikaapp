// Home Screen - Main Dashboard - Birebir Front/React Tasarımından React Native Çevirisi
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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { HamburgerMenu } from '../components/HamburgerMenu';
import ApiService from '../services/api';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, Announcement, News } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Dinamik Layout Hesaplayıcı - Tüm öğeler ekrana otomatik sığar
const calculateDynamicLayout = () => {
  const statusBarHeight = 24; // Ortalama status bar
  const tabBarHeight = 60; // Bottom tab bar
  const headerHeight = 84; // Top navigation height
  const safeBottomPadding = 16;
  
  // Kullanılabilir ekran yüksekliği
  const availableHeight = screenHeight - statusBarHeight - tabBarHeight - headerHeight - safeBottomPadding;
  
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
    iconSize: Math.floor((screenWidth - 64) / 3 * 0.65), // İkon container boyutu
    iconPadding: 6,
    
    // Announcements
    announcementHeight: Math.floor(availableHeight * announcementRatio),
    announcementPadding: { vertical: 8, horizontal: 16 },
    
    // Membership banner
    membershipBannerHeight: 48,
  };
};

const LAYOUT = calculateDynamicLayout();

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

// Front ImageSlider - 3 slayt (front/src/components/ImageSlider.tsx'den birebir)
// İslami / Sendika temalı görseller
const sliderImages = [
  { 
    id: '1', 
    uri: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=400&fit=crop', // Cami/İslami mimari
    title: 'Sendika Etkinliklerimiz', 
    description: 'Üyelerimiz için düzenlenen toplantılar ve seminerler' 
  },
  { 
    id: '2', 
    uri: 'https://images.unsplash.com/photo-1545167496-5a7bf7a7b3a8?w=800&h=400&fit=crop', // Toplantı/Konferans
    title: 'Yönetim Kurulu', 
    description: 'Sendikamızın önderliğinde güçlü birliktelik' 
  },
  { 
    id: '3', 
    uri: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&h=400&fit=crop', // İslami geometrik desen
    title: 'Hak ve Adalet Mücadelemiz', 
    description: 'Din görevlilerinin haklarını savunuyoruz' 
  },
];

// Front QuickAccessGrid - 6 buton (front/src/components/QuickAccessGrid.tsx'den birebir)
// icon mapping: lucide-react -> Feather (birebir renk kodları)
// Frontend renkleri: blue-600 #2563eb, blue-700 #1d4ed8, indigo-600 #4f46e5, indigo-700 #4338ca, cyan-600 #0891b2, cyan-700 #0e7490
const quickAccessItems = [
  { id: '1', title: 'Üyelik', icon: 'user-plus', route: 'Membership', colors: ['#2563eb', '#1d4ed8'] as [string, string] },
  { id: '2', title: 'DİBBYS', icon: 'dibbys', route: 'DIBBYS', colors: ['#ffffff', '#ffffff'] as [string, string], isDibbys: true },
  { id: '3', title: 'Haberler', icon: 'book-open', route: 'News', colors: ['#4f46e5', '#4338ca'] as [string, string] },
  { id: '4', title: 'Bize Ulaşın', icon: 'phone', route: 'Contact', colors: ['#64748b', '#475569'] as [string, string] },
  { id: '5', title: 'Müktesep Hesaplama', icon: 'percent', route: 'Muktesep', colors: ['#2563eb', '#1d4ed8'] as [string, string] },
  { id: '6', title: 'Anlaşmalı', icon: 'home', route: 'PartnerInstitutions', colors: ['#64748b', '#475569'] as [string, string] },
];

// Mock Duyurular - API boş ise kullanılacak
const mockAnnouncements: Announcement[] = [
  {
    id: 'mock-1',
    title: 'Ramazan Ayı Öncesi Toplu Sözleşme Görüşmesi',
    content: 'Sendikamız, Ramazan ayı öncesinde din görevlilerinin özlük hakları için Diyanet İşleri Başkanlığı ile toplu sözleşme görüşmelerini başlattı. Tüm üyelerimizi bu süreçte yanımızda olmaya davet ediyoruz.',
    priority: 'urgent',
    isPublished: true,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Konya Şubesi Yeni Hizmet Binası Açılışı',
    content: 'Sendikamızın Konya Şubesi yeni hizmet binası 15 Şubat 2026 tarihinde açılacaktır. Tüm üyelerimizi açılış törenine bekliyoruz.',
    priority: 'high',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Din Görevlileri İçin Yeni Eğitim Programı',
    content: 'Üyelerimiz için hazırlanan yeni mesleki gelişim eğitim programı başvuruları başlamıştır. Online ve yüz yüze eğitim seçenekleri mevcuttur.',
    priority: 'normal',
    isPublished: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

// Mock Haberler - API boş ise kullanılacak
const mockNews: News[] = [
  {
    id: 'mock-news-1',
    title: 'Türk Diyanet Vakıf-Sen Genel Başkanı Konya\'yı Ziyaret Etti',
    content: 'Genel Başkanımız Nurettin Karabulut, Konya Şubemizi ziyaret ederek üyelerimizle bir araya geldi.',
    summary: 'Genel Başkanımızın Konya ziyareti büyük ilgi gördü.',
    category: 'Etkinlik',
    imageUrl: 'https://images.unsplash.com/photo-1577741314755-048d8525d31e?w=600&h=400&fit=crop',
    isPublished: true,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'mock-news-2',
    title: 'Din Görevlileri İçin Maaş Artışı Kararı',
    content: 'Toplu sözleşme görüşmeleri sonucunda din görevlilerinin maaşlarına yüzde 30 zam yapılması kararlaştırıldı.',
    summary: 'Maaş artışı tüm din görevlilerini kapsayacak.',
    category: 'Duyuru',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock-news-3',
    title: 'Kur\'an-ı Kerim Kursu Sertifika Töreni',
    content: 'Şubemiz tarafından düzenlenen Kur\'an-ı Kerim kursunu başarıyla tamamlayan kursiyerlere sertifikaları takdim edildi.',
    summary: '150 kursiyer sertifikalarını aldı.',
    category: 'Eğitim',
    imageUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&h=400&fit=crop',
    isPublished: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, isPendingDetails } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAnnouncementSlide, setCurrentAnnouncementSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto slide for ImageSlider (front: 5000ms interval)
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % sliderImages.length;
      setCurrentSlide(nextSlide);
      sliderRef.current?.scrollToIndex({ index: nextSlide, animated: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide]);

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
      const [announcementsRes, newsRes] = await Promise.all([
        ApiService.getAnnouncements().catch(() => []),
        ApiService.getNews().catch(() => []),
      ]);
      // API verisi varsa kullan, yoksa mock data kullan
      const fetchedAnnouncements = announcementsRes.slice(0, 5);
      const fetchedNews = newsRes.slice(0, 3);
      setAnnouncements(fetchedAnnouncements.length > 0 ? fetchedAnnouncements : mockAnnouncements);
      setNews(fetchedNews.length > 0 ? fetchedNews : mockNews);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Hata durumunda mock data kullan
      setAnnouncements(mockAnnouncements);
      setNews(mockNews);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleQuickAccess = (route: string) => {
    if (route === 'Membership') {
      navigation.navigate('Membership' as any);
    } else if (route === 'DIBBYS') {
      // DİBBYS direkt login sayfasına yönlendir
      Linking.openURL('http://dibbys.diyanet.gov.tr/Login.aspx?enc=HAd1rtUZbsmBBo0sEDuy4U2vPzpkTelv19DifeZ3rEY%3d');
    } else if (route === 'News') {
      navigation.navigate('AllNews' as any);
    } else if (route === 'Contact') {
      navigation.navigate('Contact' as any);
    } else if (route === 'Muktesep') {
      navigation.navigate('Muktesep' as any);
    } else if (route === 'PartnerInstitutions') {
      navigation.navigate('PartnerInstitutions' as any);
    }
  };

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

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Front ImageSlider - rounded-2xl, shadow, overlay
  const renderSliderItem = ({ item }: { item: typeof sliderImages[0] }) => (
    <View style={styles.slideContainer}>
      <Image source={{ uri: item.uri }} style={styles.slideImage} />
      {/* Gradient overlay - from-black/70 via-black/30 to-transparent */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.slideOverlay}
      />
      <View style={styles.slideTextContainer}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </View>
  );

  // Slider pagination dots
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

  // Front QuickAccessGrid - white card with gradient icon
  const renderQuickAccessItem = (item: typeof quickAccessItems[0]) => {
    const isDibbys = (item as any).isDibbys;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.quickAccessCard}
        onPress={() => handleQuickAccess(item.route)}
        activeOpacity={0.8}
      >
        {isDibbys ? (
          // DİBBYS özel - logo göster
          <View style={styles.quickAccessIconDibbys}>
            <Image 
              source={{ uri: 'https://dibbys.diyanet.gov.tr/assets/images/dibbys-logo.png' }} 
              style={styles.dibbysLogo}
              resizeMode="contain"
            />
          </View>
        ) : (
          <LinearGradient
            colors={item.colors}
            style={styles.quickAccessIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={item.icon as any} size={Math.floor(LAYOUT.iconSize * 0.5)} color="#ffffff" />
            {/* Shine overlay - from-white/20 to-transparent */}
            <View style={styles.iconShine} />
          </LinearGradient>
        )}
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
        onPress={() => navigation.navigate('AllAnnouncements' as any)}
        activeOpacity={0.9}
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
              {(currentAnnouncement as any).summary || currentAnnouncement.content}
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
              resizeMode="contain"
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
        {/* Sağ İkonlar: Bildirim + Hamburger Menu */}
        <View style={styles.headerRightIcons}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Feather name="bell" size={22} color="#475569" />
          </TouchableOpacity>
          <HamburgerMenu
            onDistrictRepClick={() => navigation.navigate('DistrictRepresentative' as any)}
            onMembershipClick={() => navigation.navigate('Membership' as any)}
            onNotificationsClick={() => {}} 
            onAboutClick={() => navigation.navigate('About' as any)}
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
            onPress={() => navigation.navigate('Membership' as any)}
            activeOpacity={0.8}
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

        {/* Image Slider - Front: rounded-2xl, shadow-xl, px-4 pt-3 pb-2 */}
        <View style={styles.sliderWrapper}>
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
                const sliderWidth = screenWidth - 32;
                const index = Math.round(e.nativeEvent.contentOffset.x / sliderWidth);
                setCurrentSlide(index);
              }}
            />
            {renderPagination()}
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
              onPress={() => navigation.navigate('AllAnnouncements' as any)}
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
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    justifyContent: 'center',
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
    padding: 4,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: LAYOUT.sliderPadding.horizontal,
    paddingTop: LAYOUT.sliderPadding.top,
    paddingBottom: LAYOUT.sliderPadding.bottom,
  },
  sliderContainer: {
    height: LAYOUT.sliderHeight,
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
  slideContainer: {
    width: screenWidth - 32,
    height: LAYOUT.sliderHeight,
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
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
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
    bottom: 12,
    left: 0,
    right: 0,
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
    paddingHorizontal: LAYOUT.quickAccessPadding.horizontal,
    paddingVertical: LAYOUT.quickAccessPadding.vertical,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessCard: {
    width: (screenWidth - 32 - 24) / 3, // 3 columns with gap
    alignItems: 'center',
    paddingVertical: LAYOUT.iconPadding,
    paddingHorizontal: 4,
  },
  quickAccessIcon: {
    width: LAYOUT.iconSize,
    height: LAYOUT.iconSize,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LAYOUT.iconPadding,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  quickAccessIconDibbys: {
    width: LAYOUT.iconSize,
    height: LAYOUT.iconSize,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LAYOUT.iconPadding,
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
    width: Math.floor(LAYOUT.iconSize * 0.75),
    height: Math.floor(LAYOUT.iconSize * 0.75),
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
    fontSize: 12,
    color: '#374151', // text-gray-700
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  // Announcements Section - Front birebir
  announcementSection: {
    paddingHorizontal: LAYOUT.announcementPadding.horizontal,
    paddingVertical: LAYOUT.announcementPadding.vertical,
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
    height: LAYOUT.announcementHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementEmpty: {
    height: LAYOUT.announcementHeight * 0.7,
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
    minHeight: LAYOUT.announcementHeight * 0.75,
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
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
