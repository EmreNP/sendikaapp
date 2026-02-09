// Muktesep Hesaplama Screen - Front/React Birebir Çevirisi
// front/src/components/MuktesepPage.tsx'den birebir React Native çevirisi
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type MuktesepScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Muktesep'>;

interface MuktesepScreenProps {
  navigation: MuktesepScreenNavigationProp;
}

interface EducationOption {
  id: string;
  title: string;
  points: number;
}

interface CertificateOption {
  id: string;
  title: string;
  points: number;
}

// Front'tan birebir - educationOptions
const educationOptions: EducationOption[] = [
  { id: 'imam-hatip', title: 'İmam Hatip Lisesi', points: 10 },
  { id: 'ilahiyat-onlisans', title: 'İlahiyat Önlisans', points: 5 },
  { id: 'alan-disi-lisans', title: 'Alan Dışı Lisans', points: 5 },
  { id: 'ilahiyat-fakultesi', title: 'İlahiyat Fakültesi', points: 10 },
  { id: 'yuksek-lisans', title: 'Yüksek Lisans', points: 2 },
];

// Front'tan birebir - certificateOptions
const certificateOptions: CertificateOption[] = [
  { id: 'hafizlik', title: 'Hafızlık', points: 8 },
  { id: 'ihtisas', title: 'İhtisas Kursu', points: 5 },
  { id: 'tashih', title: 'Tashih-i Huruf', points: 3 },
  { id: 'yds', title: 'YDS Belgesi', points: 2 },
];

export const MuktesepScreen: React.FC<MuktesepScreenProps> = ({ navigation }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [serviceYears, setServiceYears] = useState('');
  const [mbstsScore, setMbstsScore] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(0);

  // Front'tan birebir - toggleEducation
  const toggleEducation = (id: string) => {
    setSelectedEducation((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Front'tan birebir - toggleCertificate
  const toggleCertificate = (id: string) => {
    setSelectedCertificates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Front'tan birebir - handleCalculate
  const handleCalculate = () => {
    // 1. Education Points
    const educationPoints = selectedEducation.reduce((total, id) => {
      const option = educationOptions.find((opt) => opt.id === id);
      return total + (option?.points || 0);
    }, 0);

    // 2. Certificate Points
    const certificatePoints = selectedCertificates.reduce((total, id) => {
      const option = certificateOptions.find((opt) => opt.id === id);
      return total + (option?.points || 0);
    }, 0);

    // 3. Service Points - Front formülü
    const years = parseInt(serviceYears) || 0;
    let servicePoints = 0;
    if (years <= 10) {
      servicePoints = years * 3;
    } else {
      servicePoints = (10 * 3) + ((years - 10) * 1);
    }

    // 4. MBSTS Points - %40
    const mbsts = parseFloat(mbstsScore) || 0;
    const mbstsPoints = mbsts * 0.40;

    const total = educationPoints + certificatePoints + servicePoints + mbstsPoints;
    setCalculatedScore(total);
    setShowResult(true);

    // Scroll to top
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    Alert.alert('Başarılı', 'Hesaplama tamamlandı!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header - Front: bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 */}
        <LinearGradient
          colors={['#1e3a8a', '#1e40af', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Decorative elements */}
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />

          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Muktesep Hesaplama</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Result Card - Front: showResult && ... */}
          {showResult && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Toplam Puanınız</Text>
              <Text style={styles.resultValue}>{calculatedScore.toFixed(2)}</Text>
              <TouchableOpacity
                style={styles.newCalcButton}
                onPress={() => setShowResult(false)}
              >
                <Text style={styles.newCalcText}>Yeni Hesaplama Yap</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Education Section - Front: Eğitim Durumu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eğitim Durumu</Text>
            <View style={styles.optionsList}>
              {educationOptions.map((option) => {
                const isSelected = selectedEducation.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleEducation(option.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleSelected,
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.optionPoints,
                          isSelected && styles.optionPointsSelected,
                        ]}
                      >
                        {option.points} puan
                      </Text>
                    </View>
                    {isSelected && (
                      <Feather name="check-circle" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Certificates Section - Front: Sertifikalar ve Belgeler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sertifikalar ve Belgeler</Text>
            <View style={styles.optionsList}>
              {certificateOptions.map((option) => {
                const isSelected = selectedCertificates.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleCertificate(option.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleSelected,
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.optionPoints,
                          isSelected && styles.optionPointsSelected,
                        ]}
                      >
                        {option.points} puan
                      </Text>
                    </View>
                    {isSelected && (
                      <Feather name="check-circle" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Service Years Section - Front: Hizmet Süresi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmet Süresi</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Hizmet Yılı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 15 (kaç yıldır çalışıyorsunuz?)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={serviceYears}
                onChangeText={setServiceYears}
              />
            </View>
            {/* Info Box - Front birebir */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Feather name="info" size={18} color="#2563eb" />
                <Text style={styles.infoText}>
                  10 yıla kadar her yıl 3 puan, sonrası her yıl 1 puan
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="hash" size={18} color="#10b981" />
                <Text style={styles.infoText}>
                  Örnek: 5 yıl = 15 puan, 10 yıl = 30 puan, 15 yıl = 35 puan
                </Text>
              </View>
            </View>
          </View>

          {/* MBSTS Section - Front: MBSTS Puanı */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MBSTS Puanı</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>MBSTS Puanınız</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 75 (sözlü sınavından aldığınız puan)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={mbstsScore}
                onChangeText={setMbstsScore}
              />
            </View>
            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoRowBullet}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  MBSTS puanı, sınav sonucunuzda yer alan puanı giriniz
                </Text>
              </View>
              <View style={styles.infoRowBullet}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  Bu puan toplam puanınızın %40'ını oluşturur
                </Text>
              </View>
              <View style={styles.infoRowBullet}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  Örnek: 80 puan = 32 puan (%40)
                </Text>
              </View>
            </View>
          </View>

          {/* Calculate Button - Front: bg-slate-500 */}
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={handleCalculate}
            activeOpacity={0.8}
          >
            <Text style={styles.calculateButtonText}>HESAPLA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Front: bg-slate-50
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header - Front birebir
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -24,
    left: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(96,165,250,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  // Result Card - Front birebir
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  newCalcButton: {
    paddingVertical: 8,
  },
  newCalcText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#eff6ff', // blue-50
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#1e40af',
  },
  optionPoints: {
    fontSize: 12,
    color: '#64748b',
  },
  optionPointsSelected: {
    color: '#2563eb',
  },
  // Input Card
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  // Info Box - Front birebir
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoRowBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  // Calculate Button - Front: bg-slate-500
  calculateButton: {
    backgroundColor: '#64748b', // slate-500
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
