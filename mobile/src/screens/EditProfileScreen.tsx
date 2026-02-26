// Edit Profile Screen - Profil Düzenleme
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KONYA_DISTRICTS } from '../../../shared/constants/districts';
import { EDUCATION_LEVEL_OPTIONS } from '../../../shared/constants/education';
import { CustomInput } from '../components/CustomInput';
import { useAuth } from '../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import ApiService from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

type BasicForm = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthDate: string;
  district: string;
  kadroUnvani: string;
};

type DetailForm = {
  tcKimlikNo: string;
  fatherName: string;
  motherName: string;
  birthPlace: string;
  education: string;
  kurumSicil: string;
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, refreshUser, isActive } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());

  const [basicForm, setBasicForm] = useState<BasicForm>({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    birthDate: '',
    district: '',
    kadroUnvani: '',
  });
  const [originalBasic, setOriginalBasic] = useState<BasicForm | null>(null);

  const [detailForm, setDetailForm] = useState<DetailForm>({
    tcKimlikNo: '',
    fatherName: '',
    motherName: '',
    birthPlace: '',
    education: '',
    kurumSicil: '',
  });
  const [originalDetail, setOriginalDetail] = useState<DetailForm | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const basic: BasicForm = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        gender: user.gender || '',
        birthDate: (() => {
          if (!user.birthDate) return '';
          const raw = user.birthDate as any;
          let d: Date | null = null;
          if (raw?.toDate) {
            d = raw.toDate();
          } else if (raw?._seconds !== undefined) {
            // Firestore Timestamp JSON: {_seconds, _nanoseconds}
            d = new Date(raw._seconds * 1000);
          } else if (raw?.seconds !== undefined) {
            d = new Date(raw.seconds * 1000);
          } else if (typeof raw === 'string' && raw.length >= 10) {
            // ISO string veya YYYY-MM-DD
            d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00.000Z`);
          } else if (raw instanceof Date) {
            d = raw;
          }
          if (!d || isNaN(d.getTime())) return '';
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const day = String(d.getUTCDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          setDatePickerDate(new Date(`${dateStr}T12:00:00.000Z`));
          return dateStr;
        })(),
        district: user.district || '',
        kadroUnvani: user.kadroUnvani || '',
      };
      const detail: DetailForm = {
        tcKimlikNo: user.tcKimlikNo || '',
        fatherName: user.fatherName || '',
        motherName: user.motherName || '',
        birthPlace: user.birthPlace || '',
        education: user.education || '',
        kurumSicil: user.kurumSicil || '',
      };
      setBasicForm(basic);
      setOriginalBasic(basic);
      setDetailForm(detail);
      setOriginalDetail(detail);
    }
  }, [user]);

  const hasBasicChanges = originalBasic
    ? (Object.keys(basicForm) as (keyof BasicForm)[]).some(k => basicForm[k] !== originalBasic[k])
    : false;

  const hasDetailChanges = isActive && originalDetail
    ? (Object.keys(detailForm) as (keyof DetailForm)[]).some(k => detailForm[k] !== originalDetail[k])
    : false;

  const hasChanges = hasBasicChanges || hasDetailChanges;

  const updateBasic = (field: keyof BasicForm, value: string) => {
    setBasicForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const updateDetail = (field: keyof DetailForm, value: string) => {
    setDetailForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!basicForm.firstName.trim()) newErrors.firstName = 'Ad gereklidir';
    if (!basicForm.lastName.trim()) newErrors.lastName = 'Soyad gereklidir';
    if (basicForm.phone && !/^0[0-9]{10}$/.test(basicForm.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası girin (0XXX XXX XX XX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!hasChanges) { navigation.goBack(); return; }

    setSaving(true);
    try {
      const changedFields: Record<string, any> = {};

      if (originalBasic) {
        (Object.keys(basicForm) as (keyof BasicForm)[]).forEach(k => {
          if (basicForm[k] !== originalBasic[k]) changedFields[k] = basicForm[k];
        });
      }
      if (isActive && originalDetail) {
        (Object.keys(detailForm) as (keyof DetailForm)[]).forEach(k => {
          if (detailForm[k] !== originalDetail[k]) changedFields[k] = detailForm[k];
        });
      }

      await ApiService.updateProfile(changedFields);
      await refreshUser();
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', getUserFriendlyErrorMessage(error, 'Bilgileriniz güncellenemedi. Lütfen tekrar deneyin.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDiscard = () => {
    if (!hasChanges) { navigation.goBack(); return; }
    Alert.alert(
      'Değişiklikleri İptal Et',
      'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?',
      [
        { text: 'Düzenlemeye Devam Et', style: 'cancel' },
        { text: 'Çık', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#312e81', '#4338ca', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={confirmDiscard}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Düzenle</Text>
        <TouchableOpacity
          style={[styles.saveHeaderButton, !hasChanges && styles.saveHeaderButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={[styles.saveHeaderText, !hasChanges && styles.saveHeaderTextDisabled]}>
              Kaydet
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* E-posta (salt okunur) */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>E-posta Adresi</Text>
            <View style={styles.readOnlyValue}>
              <Feather name="lock" size={14} color="#94a3b8" />
              <Text style={styles.readOnlyText}>{user?.email || '-'}</Text>
            </View>
          </View>

          {/* ── Temel Bilgiler ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.formContainer}>
            <CustomInput label="Ad" value={basicForm.firstName} onChangeText={v => updateBasic('firstName', v)} placeholder="Adınız" error={errors.firstName} required />
            <CustomInput label="Soyad" value={basicForm.lastName} onChangeText={v => updateBasic('lastName', v)} placeholder="Soyadınız" error={errors.lastName} required />
            <CustomInput label="Telefon" value={basicForm.phone} onChangeText={v => updateBasic('phone', v)} placeholder="Örn: 0532 123 45 67" keyboardType="phone-pad" error={errors.phone} hint="Cep telefonu numaranız" />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Cinsiyet</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={basicForm.gender} onValueChange={v => updateBasic('gender', v)} style={styles.picker}>
                  <Picker.Item label="Seçiniz..." value="" />
                  <Picker.Item label="Erkek" value="male" />
                  <Picker.Item label="Kadın" value="female" />
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Doğum Tarihi</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerTouchable}
              >
                <Feather name="calendar" size={16} color="#94a3b8" />
                <Text style={[styles.datePickerValue, !basicForm.birthDate && styles.datePickerPlaceholder]}>
                  {basicForm.birthDate || 'Tarih seçiniz...'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={datePickerDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDatePickerDate(selectedDate);
                      const y = selectedDate.getFullYear();
                      const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const d = String(selectedDate.getDate()).padStart(2, '0');
                      updateBasic('birthDate', `${y}-${mo}-${d}`);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Görev İlçesi</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={basicForm.district}
                  onValueChange={v => updateBasic('district', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="İlçe seçiniz..." value="" />
                  {KONYA_DISTRICTS.map(d => (
                    <Picker.Item key={d} label={d} value={d} />
                  ))}
                </Picker>
              </View>
            </View>
            <CustomInput label="Kadro Ünvanı" value={basicForm.kadroUnvani} onChangeText={v => updateBasic('kadroUnvani', v)} placeholder="Örn: Vaiz, Müezzin, İmam" />
          </View>

          {/* ── Detaylı Bilgiler ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detaylı Bilgiler</Text>
            {!isActive && (
              <View style={styles.sectionLockBadge}>
                <Feather name="lock" size={12} color="#64748b" />
                <Text style={styles.sectionLockText}>Üyelik onaylandıktan sonra düzenlenebilir</Text>
              </View>
            )}
          </View>

          <View style={[styles.formContainer, !isActive && styles.formContainerDisabled]}>
            <CustomInput label="TC Kimlik No" value={detailForm.tcKimlikNo} onChangeText={v => updateDetail('tcKimlikNo', v)} placeholder="11 haneli TC kimlik numaranız" keyboardType="numeric" editable={isActive} />
            <CustomInput label="Baba Adı" value={detailForm.fatherName} onChangeText={v => updateDetail('fatherName', v)} placeholder="Babanızın adı" editable={isActive} />
            <CustomInput label="Anne Adı" value={detailForm.motherName} onChangeText={v => updateDetail('motherName', v)} placeholder="Annenizin adı" editable={isActive} />
            <CustomInput label="Doğum Yeri" value={detailForm.birthPlace} onChangeText={v => updateDetail('birthPlace', v)} placeholder="Doğduğunuz şehir" editable={isActive} />

            <View style={[styles.pickerContainer, !isActive && styles.pickerDisabled]}>
              <Text style={styles.pickerLabel}>Eğitim Durumu</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={detailForm.education} onValueChange={v => isActive && updateDetail('education', v)} style={styles.picker} enabled={isActive}>
                  <Picker.Item label="Seçiniz..." value="" />
                  {EDUCATION_LEVEL_OPTIONS.map(opt => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <CustomInput label="Kurum Sicil No" value={detailForm.kurumSicil} onChangeText={v => updateDetail('kurumSicil', v)} placeholder="Kurum sicil numaranız" editable={isActive} />
          </View>

          {/* Kaydet */}
          <TouchableOpacity
            style={[styles.submitButton, (!hasChanges || saving) && styles.submitButtonDisabled]}
            onPress={handleSave}
            disabled={saving || !hasChanges}
          >
            <LinearGradient
              colors={hasChanges ? ['#4338ca', '#1e40af'] : ['#94a3b8', '#94a3b8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>{hasChanges ? 'Değişiklikleri Kaydet' : 'Değişiklik Yok'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  saveHeaderButton: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveHeaderButtonDisabled: { opacity: 0.5 },
  saveHeaderText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  saveHeaderTextDisabled: { opacity: 0.7 },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  readOnlyField: {
    marginBottom: 20, backgroundColor: '#f1f5f9',
    borderRadius: 12, padding: 14,
  },
  readOnlyLabel: { fontSize: 12, fontWeight: '500', color: '#64748b', marginBottom: 4 },
  readOnlyValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readOnlyText: { fontSize: 15, color: '#94a3b8' },
  sectionHeader: { marginBottom: 10, marginTop: 4 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#475569',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  sectionLockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sectionLockText: { fontSize: 12, color: '#64748b' },
  formContainer: {
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  formContainerDisabled: { opacity: 0.55 },
  pickerContainer: { marginBottom: 16 },
  pickerDisabled: { opacity: 0.6 },
  pickerLabel: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8, marginLeft: 4 },
  pickerWrapper: {
    backgroundColor: '#f1f5f9', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
  },
  picker: { height: 48 },
  datePickerTouchable: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f1f5f9', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  datePickerValue: { fontSize: 14, color: '#0f172a', flex: 1 },
  datePickerPlaceholder: { color: '#94a3b8' },
  submitButton: { borderRadius: 12, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.8 },
  submitButtonGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14,
  },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
