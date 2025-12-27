import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { CustomPicker } from '../components/CustomPicker';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import type { EducationLevel, Branch } from '../types';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

type RegisterDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterDetails'>;
};

export const RegisterDetailsScreen: React.FC<RegisterDetailsScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [formData, setFormData] = useState({
    tcKimlikNo: '',
    fatherName: '',
    motherName: '',
    birthPlace: '',
    education: '' as EducationLevel | '',
    kurumSicil: '',
    kadroUnvani: '',
    kadroUnvanKodu: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    branchId: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // User authenticated olduğunda branches'ı yükle
    if (user) {
      loadBranches();
    }
  }, [user]);

  const loadBranches = async () => {
    try {
      console.log('📡 Loading branches...');
      const branchesData = await apiService.getBranches();
      console.log('✅ Branches loaded:', branchesData.length);
      // Backend zaten aktif şubeleri döndürüyor (USER rolü için), ama yine de filtreleyelim
      const activeBranches = branchesData.filter(b => b.isActive !== false);
      console.log('✅ Active branches:', activeBranches.length);
      setBranches(activeBranches);
    } catch (error: any) {
      console.error('❌ Failed to load branches:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Şubeler yüklenirken bir hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoadingBranches(false);
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.branchId) {
      newErrors.branchId = 'Şube seçimi zorunludur';
      valid = false;
    }

    // Optional validations
    if (formData.tcKimlikNo && formData.tcKimlikNo.length !== 11) {
      newErrors.tcKimlikNo = 'TC Kimlik No 11 haneli olmalıdır';
      valid = false;
    }

    // Phone validation - Backend format: /^(\+90|0)?[0-9]{10}$/
    if (formData.phone) {
      const phoneClean = formData.phone.replace(/\s/g, '');
      if (!/^(\+90|0)?[0-9]{10}$/.test(phoneClean)) {
        newErrors.phone = 'Geçerli bir telefon numarası giriniz (örn: 05551234567)';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // branchId boş olamaz
      if (!formData.branchId) {
        Alert.alert('Hata', 'Lütfen bir şube seçiniz');
        setLoading(false);
        return;
      }

      const submitData: any = {
        branchId: formData.branchId,
      };

      // Sadece doldurulmuş alanları ekle
      if (formData.tcKimlikNo?.trim()) submitData.tcKimlikNo = formData.tcKimlikNo.trim();
      if (formData.fatherName?.trim()) submitData.fatherName = formData.fatherName.trim();
      if (formData.motherName?.trim()) submitData.motherName = formData.motherName.trim();
      if (formData.birthPlace?.trim()) submitData.birthPlace = formData.birthPlace.trim();
      // Education sadece dolu ise ekle
      if (formData.education && formData.education.trim() !== '') {
        submitData.education = formData.education;
      }
      if (formData.kurumSicil?.trim()) submitData.kurumSicil = formData.kurumSicil.trim();
      if (formData.kadroUnvani?.trim()) submitData.kadroUnvani = formData.kadroUnvani.trim();
      if (formData.kadroUnvanKodu?.trim()) submitData.kadroUnvanKodu = formData.kadroUnvanKodu.trim();
      if (formData.phone?.trim()) submitData.phone = formData.phone.trim().replace(/\s/g, '');
      if (formData.address?.trim()) submitData.address = formData.address.trim();
      if (formData.city?.trim()) submitData.city = formData.city.trim();
      if (formData.district?.trim()) submitData.district = formData.district.trim();

      console.log('📝 Submitting register details:', { branchId: submitData.branchId, fieldsCount: Object.keys(submitData).length });

      await apiService.registerDetails(submitData);

      await refreshUser();

      Alert.alert(
        'Başarılı',
        'Kayıt işlemi tamamlandı! Başvurunuz inceleniyor.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('Status'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Register details error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Kayıt işlemi başarısız oldu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingBranches) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Şubeler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Detaylı Kayıt</Text>
            <Text style={styles.subtitle}>Adım 2/2</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>🏢 Şube Bilgileri</Text>
            
            <CustomPicker
              label="Şube"
              value={formData.branchId}
              options={branches.map(b => ({ label: b.name, value: b.id }))}
              onValueChange={(value) => {
                setFormData({ ...formData, branchId: value });
                setErrors({ ...errors, branchId: '' });
              }}
              placeholder="Şube Seçiniz"
              error={errors.branchId}
              required
            />

            <Text style={styles.sectionTitle}>👤 Kişisel Bilgiler</Text>

            <CustomInput
              label="TC Kimlik No"
              value={formData.tcKimlikNo}
              onChangeText={(text) => {
                setFormData({ ...formData, tcKimlikNo: text });
                setErrors({ ...errors, tcKimlikNo: '' });
              }}
              placeholder="11 haneli TC kimlik numaranız"
              keyboardType="numeric"
              maxLength={11}
              error={errors.tcKimlikNo}
            />

            <CustomInput
              label="Baba Adı"
              value={formData.fatherName}
              onChangeText={(text) => setFormData({ ...formData, fatherName: text })}
              placeholder="Baba adınız"
            />

            <CustomInput
              label="Anne Adı"
              value={formData.motherName}
              onChangeText={(text) => setFormData({ ...formData, motherName: text })}
              placeholder="Anne adınız"
            />

            <CustomInput
              label="Doğum Yeri"
              value={formData.birthPlace}
              onChangeText={(text) => setFormData({ ...formData, birthPlace: text })}
              placeholder="Doğum yeriniz"
            />

            <CustomPicker
              label="Eğitim Durumu"
              value={formData.education}
              options={[
                { label: 'İlköğretim', value: 'ilkögretim' },
                { label: 'Lise', value: 'lise' },
                { label: 'Yüksekokul', value: 'yüksekokul' },
              ]}
              onValueChange={(value) => setFormData({ ...formData, education: value as EducationLevel })}
              placeholder="Eğitim durumunuzu seçiniz"
            />

            <Text style={styles.sectionTitle}>💼 İş Bilgileri</Text>

            <CustomInput
              label="Kurum Sicil No"
              value={formData.kurumSicil}
              onChangeText={(text) => setFormData({ ...formData, kurumSicil: text })}
              placeholder="Kurum sicil numaranız"
            />

            <CustomInput
              label="Kadro Ünvanı"
              value={formData.kadroUnvani}
              onChangeText={(text) => setFormData({ ...formData, kadroUnvani: text })}
              placeholder="Kadro ünvanınız"
            />

            <CustomInput
              label="Kadro Ünvan Kodu"
              value={formData.kadroUnvanKodu}
              onChangeText={(text) => setFormData({ ...formData, kadroUnvanKodu: text })}
              placeholder="Kadro ünvan kodunuz"
            />

            <Text style={styles.sectionTitle}>📞 İletişim Bilgileri</Text>

            <CustomInput
              label="Telefon"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                setErrors({ ...errors, phone: '' });
              }}
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <CustomInput
              label="Adres"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Açık adresiniz"
              multiline
              numberOfLines={3}
            />

            <CustomInput
              label="Şehir"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="Şehir"
            />

            <CustomInput
              label="İlçe"
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
              placeholder="İlçe"
            />

            <CustomButton
              title="Kaydı Tamamla"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
});

