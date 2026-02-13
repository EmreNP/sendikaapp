// AboutScreen - Hakkımızda Sayfası (Kurumsal Tasarım)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

type AboutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'About'>;

interface AboutScreenProps {
  navigation: AboutScreenNavigationProp;
}

// Değerler kısmı kaldırıldı - Milli Değerler metni ile değiştirildi

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hakkımızda</Text>
          <Text style={styles.headerSubtitle}>Türk Diyanet Vakıf-Sen Konya</Text>
        </View>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#2563eb', '#1e40af', '#1e3a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroPattern} />
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/logo.png')}
                style={styles.heroLogo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.heroTitle}>Türk Diyanet Vakıf-Sen</Text>
            <Text style={styles.heroSubtitle}>KONYA ŞUBESİ</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroTagline}>
              Hak, Adalet ve Dayanışma İçin
            </Text>
          </LinearGradient>
        </View>

        {/* Stats Section - Kaldırıldı */}

        {/* Mission & Vision */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="target" size={20} color="#2563eb" />
            </View>
            <Text style={styles.sectionTitle}>Misyonumuz</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Din görevlilerinin ve Diyanet İşleri Başkanlığı çalışanlarının hak ve çıkarlarını korumak, 
              iş güvencesini sağlamak ve adil çalışma koşullarını oluşturmak. Üyelerimizin sosyal, 
              ekonomik ve mesleki gelişimlerine katkıda bulunarak, güçlü bir dayanışma ortamı yaratmak.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="eye" size={20} color="#2563eb" />
            </View>
            <Text style={styles.sectionTitle}>Vizyonumuz</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Türkiye'nin en etkin, güvenilir ve saygın din görevlileri sendikası olmak. 
              Profesyonel yönetim anlayışı, şeffaf çalışma prensipleri ve güçlü dayanışma 
              ruhuyla üyelerimize örnek bir hizmet sunmak.
            </Text>
          </View>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="star" size={20} color="#2563eb" />
            </View>
            <Text style={styles.sectionTitle}>Milli ve Manevi Değerlerimiz</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Sendikamız, Türk milletinin binlerce yıllık köklü değerlerini ve İslam'ın evrensel prensiplerine bağlı kalarak hareket eder. Vatan sevgisi, millet bilinci, adalet duygusu, dürüstlük, dayanışma ve merhamet gibi milli ve manevi değerlerimiz, tüm faaliyetlerimizin temelini oluşturur.
              {"\n\n"}
              Din görevlileri olarak, toplumumuzun maneviyat kaynağı olma sorumluluğumuzun bilincindeyiz. Bu bilinçle, üyelerimizin ve toplumumuzun milli birlik ve beraberliğine katkı sunmayı, ahlaki değerlerin yaşatılmasını ve gelecek nesillere aktarılmasını en öncelikli görevlerimiz arasında görüyoruz.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            © 2026 Türk Diyanet Vakıf-Sen Konya Şubesi
          </Text>
          <Text style={styles.footerSubtext}>
            Tüm hakları saklıdır.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroGradient: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  heroLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroDivider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 12,
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    letterSpacing: 0.2,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valueCard: {
    width: (width - 44) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  valueIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  valueDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    alignItems: 'center',
  },
  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
