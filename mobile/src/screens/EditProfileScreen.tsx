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
import { CustomInput } from '../components/CustomInput';
import { useAuth } from '../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import ApiService from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    gender: '',
    education: '',
    kadroUnvani: '',
    birthDate: '',
  });
  const [originalData, setOriginalData] = useState<typeof formData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const data = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: (user as any).phone || '',
        address: (user as any).address || '',
        city: (user as any).city || '',
        district: (user as any).district || '',
        gender: (user as any).gender || '',
        education: (user as any).education || '',
        kadroUnvani: (user as any).kadroUnvani || '',
        birthDate: (user as any).birthDate || '',
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [user]);

  const updateField = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setErrors({ ...errors, [field]: '' });
    
    // Check if there are changes
    if (originalData) {
      const changed = Object.keys(newData).some(
        key => newData[key as keyof typeof newData] !== originalData[key as keyof typeof originalData]
      );
      setHasChanges(changed);
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
      valid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
      valid = false;
    }

    if (formData.phone && !/^0[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası girin (0XXX XXX XX XX)';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      // Only send changed fields
      const changedFields: Record<string, string> = {};
      if (originalData) {
        Object.keys(formData).forEach(key => {
          const k = key as keyof typeof formData;
          if (formData[k] !== originalData[k]) {
            changedFields[key] = formData[k];
          }
        });
      }

      await ApiService.updateProfile(changedFields);
      await refreshUser();
      
      Alert.alert(
        'Başarılı',
        'Profil bilgileriniz güncellendi.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Hata',
        getUserFriendlyErrorMessage(error, 'Bilgileriniz güncellenemedi. Lütfen tekrar deneyin.')
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDiscard = () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
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
      {/* Header */}
      <LinearGradient
        colors={['#312e81', '#4338ca', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={confirmDiscard}>
          <Feather name="x" size={24} color="#ffffff" />
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Feather name="info" size={16} color="#3b82f6" />
            <Text style={styles.infoText}>
              E-posta adresi ve rol bilgisi değiştirilemez. Değişiklik için yönetici ile iletişime geçin.
            </Text>
          </View>

          {/* Email (read-only) */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>E-posta Adresi</Text>
            <View style={styles.readOnlyValue}>
              <Feather name="lock" size={14} color="#94a3b8" />
              <Text style={styles.readOnlyText}>{user?.email || '-'}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <CustomInput
              label="Ad"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Adınız"
              error={errors.firstName}
              required
            />

            <CustomInput
              label="Soyad"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Soyadınız"
              error={errors.lastName}
              required
            />

            <CustomInput
              label="Telefon"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Örn: 0532 123 45 67"
              keyboardType="phone-pad"
              error={errors.phone}
              hint="Cep telefonu numaranız"
            />

            {/* Gender Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Cinsiyet</Text>
              <View style={styles.pickerWrapper}>
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
            </View>

            {/* Education Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Eğitim Durumu</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.education}
                  onValueChange={(value) => updateField('education', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Seçiniz..." value="" />
                  <Picker.Item label="İlkokul" value="primary" />
                  <Picker.Item label="Ortaokul" value="middle" />
                  <Picker.Item label="Lise" value="high" />
                  <Picker.Item label="Ön Lisans" value="associate" />
                  <Picker.Item label="Lisans" value="bachelor" />
                  <Picker.Item label="Yüksek Lisans" value="master" />
                  <Picker.Item label="Doktora" value="phd" />
                </Picker>
              </View>
            </View>

            <CustomInput
              label="Kadro Ünvanı"
              value={formData.kadroUnvani}
              onChangeText={(text) => updateField('kadroUnvani', text)}
              placeholder="Örn: Vaiz, Müezzin, İmam"
              hint="Resmi görev ünvanınız"
            />

            <CustomInput
              label="Doğum Tarihi"
              value={formData.birthDate}
              onChangeText={(text) => updateField('birthDate', text)}
              placeholder="Örn: 15/03/1980"
              hint="Gün/Ay/Yıl formatında"
            />

            <CustomInput
              label="İl"
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder="Örn: Konya"
            />

            <CustomInput
              label="İlçe"
              value={formData.district}
              onChangeText={(text) => updateField('district', text)}
              placeholder="Örn: Selçuklu"
            />

            <CustomInput
              label="Adres"
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="Açık adresiniz"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
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
                  <Text style={styles.submitButtonText}>
                    {hasChanges ? 'Değişiklikleri Kaydet' : 'Değişiklik Yok'}
                  </Text>
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
    fontWeight: '700',
    color: '#ffffff',
  },
  saveHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveHeaderButtonDisabled: {
    opacity: 0.5,
  },
  saveHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveHeaderTextDisabled: {
    opacity: 0.7,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  readOnlyField: {
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  readOnlyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readOnlyText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerWrapper: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
