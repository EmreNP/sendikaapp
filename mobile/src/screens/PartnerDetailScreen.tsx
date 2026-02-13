// Partner Detail Screen - Anlaşmalı Kurum Detayı
// Front'tan birebir çeviri
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, ContractedInstitution, HowToUseStep } from '../types';

type PartnerDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PartnerDetail'>;
type PartnerDetailScreenRouteProp = RouteProp<RootStackParamList, 'PartnerDetail'>;

interface PartnerDetailScreenProps {
  navigation: PartnerDetailScreenNavigationProp;
  route: PartnerDetailScreenRouteProp;
}

export const PartnerDetailScreen: React.FC<PartnerDetailScreenProps> = ({ navigation, route }) => {
  // Support both 'institution' (from PartnerInstitutionsScreen) and legacy 'partner' param
  const params = route.params;
  const institution: ContractedInstitution | undefined = params.institution;
  const legacyPartner = params.partner;

  // Normalize to a common shape
  const partner = institution
    ? {
        name: institution.title,
        category: institution.categoryName || '',
        logoUrl: institution.logoUrl || '',
        coverUrl: institution.coverImageUrl || '',
        discountRate: institution.badgeText || '',
        description: institution.description || '',
        howToUseSteps: institution.howToUseSteps || [],
      }
    : legacyPartner
    ? {
        name: legacyPartner.name,
        category: legacyPartner.category || '',
        logoUrl: legacyPartner.logoUrl || '',
        coverUrl: legacyPartner.coverUrl || legacyPartner.logoUrl || '',
        discountRate: legacyPartner.discountRate || '',
        description: legacyPartner.description || '',
        howToUseSteps: [] as HowToUseStep[],
      }
    : null;

  if (!partner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text style={{ fontSize: 18, color: '#0f172a', marginTop: 16 }}>Kurum bulunamadı</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
            <Text style={{ color: '#4338ca', fontWeight: '600' }}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'Sağlık': return 'heart';
      case 'Eğitim': return 'book-open';
      case 'Seyahat': return 'map';
      case 'Alışveriş': return 'shopping-bag';
      case 'Ev & Yaşam': return 'home';
      default: return 'tag';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Sağlık': return '#ef4444';
      case 'Eğitim': return '#3b82f6';
      case 'Seyahat': return '#22c55e';
      case 'Alışveriş': return '#f59e0b';
      case 'Ev & Yaşam': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Cover Image */}
        <View style={styles.headerWrapper}>
          <Image
            source={{ 
              uri: partner.coverUrl || partner.logoUrl || 'https://via.placeholder.com/800x400/e2e8f0/64748b?text=Kurum+Görseli'
            }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.headerOverlay}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            {partner.category && (
              <View style={styles.categoryBadge}>
                <Feather name={getCategoryIcon(partner.category) as keyof typeof Feather.glyphMap} size={14} color={getCategoryColor(partner.category)} />
                <Text style={[styles.categoryText, { color: getCategoryColor(partner.category) }]}>
                  {partner.category}
                </Text>
              </View>
            )}
            <Text style={styles.partnerName}>{partner.name}</Text>
          </View>

          {/* Discount Badge */}
          <View style={styles.discountContainer}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountValue}>{partner.discountRate}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anlaşma Detayları</Text>
            <Text style={styles.description}>{partner.description}</Text>
          </View>

          {/* How to Use */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nasıl Yararlanırım?</Text>
            <View style={styles.stepsContainer}>
              {partner.howToUseSteps && partner.howToUseSteps.length > 0 ? (
                partner.howToUseSteps.map((step: any, index: number) => (
                  <View key={index} style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.stepNumber || index + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Üyelik Kartınızı Gösterin</Text>
                      <Text style={styles.stepDescription}>
                        Sendika üyelik kartınızı veya mobil uygulamadaki üyelik ekranınızı gösterin
                      </Text>
                    </View>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>İndiriminizi Alın</Text>
                      <Text style={styles.stepDescription}>
                        Ödeme sırasında {partner.discountRate} indiriminiz uygulanacaktır
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
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
  headerWrapper: {
    height: 280,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    position: 'absolute',
    bottom: 64,
    left: 16,
    right: 16,
  },
  partnerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  discountContainer: {
    position: 'absolute',
    bottom: -20,
    right: 16,
  },
  discountBadge: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  discountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    padding: 16,
    paddingTop: 40,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  stepsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
});
