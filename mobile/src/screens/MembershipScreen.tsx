// Membership Screen - Step 2 Registration Details
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { validateTCKimlikNo } from '../utils/tcKimlikValidation';
import ApiService from '../services/api';
import { logger } from '../utils/logger';
import { EDUCATION_LEVEL_OPTIONS } from '../../../shared/constants/education';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Branch } from '../types';

type MembershipScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Membership'>;
};

export const MembershipScreen: React.FC<MembershipScreenProps> = ({ navigation }) => {
  const { registerDetails, user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [formData, setFormData] = useState({
    tcKimlikNo: '',
    fatherName: '',
    motherName: '',
    birthPlace: '',
    phone: '',
    birthDate: '',
    gender: '',
    education: '',
    kurumSicil: '',
    kadroUnvanKodu: '',
    isMemberOfOtherUnion: false,
    branchId: '',
    address: '',
    city: '',
    district: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { items } = await ApiService.getBranches({ limit: 100 });
      setBranches(items);
    } catch (error) {
      logger.error('Error fetching branches:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    // TC Kimlik No
    if (!formData.tcKimlikNo || !formData.tcKimlikNo.trim()) {
      newErrors.tcKimlikNo = 'TC Kimlik No gereklidir';
      valid = false;
    } else {
      const tcValidation = validateTCKimlikNo(formData.tcKimlikNo.trim());
      if (!tcValidation.valid) {
        newErrors.tcKimlikNo = tcValidation.error || 'Geçersiz TC Kimlik No';
        valid = false;
      }
    }

    // Zorunlu kimlik / iletişim alanları (backend ile uyumlu)
    if (!formData.fatherName || !formData.fatherName.trim()) {
      newErrors.fatherName = 'Baba adı gereklidir';
      valid = false;
    }

    if (!formData.motherName || !formData.motherName.trim()) {
      newErrors.motherName = 'Anne adı gereklidir';
      valid = false;
    }

    if (!formData.birthPlace || !formData.birthPlace.trim()) {
      newErrors.birthPlace = 'Doğum yeri gereklidir';
      valid = false;
    }

    if (!formData.kurumSicil || !formData.kurumSicil.trim()) {
      newErrors.kurumSicil = 'Kurum sicil numarası gereklidir';
      valid = false;
    }

    if (!formData.kadroUnvanKodu || !formData.kadroUnvanKodu.trim()) {
      newErrors.kadroUnvanKodu = 'Kadro ünvan kodu gereklidir';
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
      valid = false;
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'Doğum tarihi gereklidir';
      valid = false;
    } else {
      // Yaş kontrolü - signup ile tutarlı olmalı
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
      if (age < 18) {
        newErrors.birthDate = 'En az 18 yaşında olmalısınız';
        valid = false;
      } else if (age > 120) {
        newErrors.birthDate = 'Geçerli bir doğum tarihi giriniz';
        valid = false;
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Cinsiyet seçimi gereklidir';
      valid = false;
    }

    if (!formData.education) {
      newErrors.education = 'Eğitim durumu seçimi gereklidir';
      valid = false;
    }

    if (!formData.branchId) {
      newErrors.branchId = 'Şube seçimi gereklidir';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) {
      // scroll to top so user sees validation errors and show hint
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('Form Hatası', 'Lütfen kırmızı ile işaretlenmiş zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      await registerDetails({
        tcKimlikNo: formData.tcKimlikNo,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        birthPlace: formData.birthPlace,
        education: formData.education,
        kurumSicil: formData.kurumSicil,
        kadroUnvanKodu: formData.kadroUnvanKodu,
        isMemberOfOtherUnion: !!formData.isMemberOfOtherUnion,
        branchId: formData.branchId,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
      });
      Alert.alert(
        'Başvurunuz alındı',
        'Başvurunuz başarıyla alınmıştır. Sendika temsilcimiz, üyeliğinizi tamamlamak için en kısa sürede sizinle iletişime geçecektir.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Hata', getUserFriendlyErrorMessage(error, 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#312e81', '#4338ca', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Üyelik Bilgileri</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView          ref={scrollRef}          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.progressCircle}
              >
                <Feather name="check" size={18} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.progressLabel}>Temel Bilgiler</Text>
            </View>
            <View style={[styles.progressLine, styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <LinearGradient
                colors={['#4338ca', '#1e40af']}
                style={styles.progressCircle}
              >
                <Text style={styles.progressNumber}>2</Text>
              </LinearGradient>
              <Text style={[styles.progressLabel, styles.progressLabelActive]}>
                Üyelik Bilgileri
              </Text>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconContainer}>
              <Feather name="info" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.infoText}>
              Üyelik bilgilerinizi tamamladıktan sonra başvurunuz onay sürecine alınacaktır.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <CustomInput
              label="TC Kimlik No"
              value={formData.tcKimlikNo}
              onChangeText={(text) => updateField('tcKimlikNo', text.replace(/\D/g, ''))}
              placeholder="Örn: 12345678901"
              keyboardType="numeric"
              maxLength={11}
              error={errors.tcKimlikNo}
              hint="Nüfus cüzdanınızdaki 11 haneli TC kimlik numaranız"
              required
            />

            <CustomInput
              label="Telefon"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Örn: 0532 123 45 67"
              keyboardType="phone-pad"
              error={errors.phone}
              hint="Cep telefonu numaranız (0 ile başlayın)"
              required
            />

            {/* Doğum Tarihi - takvim */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doğum Tarihi</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.inputWrapper, errors.birthDate ? styles.inputError : null]}
              >
                <Feather name="calendar" size={16} color="#94a3b8" style={styles.inputIcon} />
                <Text style={[styles.datePickerText, !formData.birthDate && styles.datePickerPlaceholder]}>
                  {formData.birthDate || 'YYYY-AA-GG (Örn: 1990-05-15)'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={datePickerDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (!selectedDate) return;
                    setDatePickerDate(selectedDate);
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    updateField('birthDate', `${year}-${month}-${day}`);
                  }}
                  maximumDate={new Date()}
                />
              )}
              <Text style={styles.hintText}>18 yaşından büyük olmalısınız. Takvimden tarihinizi seçin</Text>
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
            </View>

            <CustomInput
              label="Doğum Yeri"
              value={formData.birthPlace}
              onChangeText={(text) => updateField('birthPlace', text)}
              placeholder="Örn: Konya"
              error={errors.birthPlace}
              required
            />

            <CustomInput
              label="Baba Adı"
              value={formData.fatherName}
              onChangeText={(text) => updateField('fatherName', text)}
              placeholder="Baba adınızı girin"
              error={errors.fatherName}
              required
            />

            <CustomInput
              label="Anne Adı"
              value={formData.motherName}
              onChangeText={(text) => updateField('motherName', text)}
              placeholder="Anne adınızı girin"
              error={errors.motherName}
              required
            />

            {/* Gender Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Cinsiyet *</Text>
              <View style={[styles.pickerWrapper, errors.gender ? styles.pickerError : undefined]}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Seçiniz..." value="" />
                  <Picker.Item label="Erkek" value="male" />
                  <Picker.Item label="Kadın" value="female" />
                </Picker>
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>

            {/* Education Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Eğitim Durumu *</Text>
              <View style={[styles.pickerWrapper, errors.education ? styles.pickerError : undefined]}>
                <Picker
                  selectedValue={formData.education}
                  onValueChange={(value) => updateField('education', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Seçiniz..." value="" />
                  {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
              {errors.education && <Text style={styles.errorText}>{errors.education}</Text>}
            </View>

            <CustomInput
              label="Kurum Sicil Numarası"
              value={formData.kurumSicil}
              onChangeText={(text) => updateField('kurumSicil', text)}
              placeholder="Örn: 12345"
              error={errors.kurumSicil}
              required
            />

            <CustomInput
              label="Kadro Ünvan Kodu"
              value={formData.kadroUnvanKodu}
              onChangeText={(text) => updateField('kadroUnvanKodu', text)}
              placeholder="Örn: M001"
              error={errors.kadroUnvanKodu}
              required
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Başka sendikaya üye misiniz?</Text>
              <View style={[styles.pickerWrapper]}>
                <Picker
                  selectedValue={String(formData.isMemberOfOtherUnion)}
                  onValueChange={(value) => updateField('isMemberOfOtherUnion', value === 'true')}
                  style={styles.picker}
                >
                  <Picker.Item label="Hayır" value="false" />
                  <Picker.Item label="Evet" value="true" />
                </Picker>
              </View>
            </View>



            {/* Branch Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Şube *</Text>
              <View style={[styles.pickerWrapper, errors.branchId ? styles.pickerError : undefined]}>
                <Picker
                  selectedValue={formData.branchId}
                  onValueChange={(value) => updateField('branchId', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Şube seçiniz..." value="" />
                  {branches.map((branch) => (
                    <Picker.Item key={branch.id} label={branch.name} value={branch.id} />
                  ))}
                </Picker>
              </View>
              {errors.branchId && <Text style={styles.errorText}>{errors.branchId}</Text>}
            </View>

            <CustomInput
              label="Adres"
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="Örn: Atatürk Mah. Cumhuriyet Cad. No:5 Kat:3"
              hint="İkamet adresinizi yazın (mahalle, sokak, kapı no)"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#4338ca', '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Gönderiliyor...</Text>
                ) : (
                  <>
                    <Feather name="check-circle" size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Başvuruyu Tamamla</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  progressLabelActive: {
    color: '#4338ca',
    fontWeight: '600',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
    marginBottom: 24,
  },
  progressLineComplete: {
    backgroundColor: '#10b981',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 6,
  },
  pickerWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  pickerError: {
    borderColor: '#ef4444',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  datePickerPlaceholder: {
    color: '#94a3b8',
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
