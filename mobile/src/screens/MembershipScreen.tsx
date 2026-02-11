// Membership Screen - Step 2 Registration Details
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Branch } from '../types';

type MembershipScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Membership'>;
};

export const MembershipScreen: React.FC<MembershipScreenProps> = ({ navigation }) => {
  const { registerDetails, user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tcNo: '',
    phone: '',
    birthDate: '',
    gender: '',
    education: '',
    workplace: '',
    jobTitle: '',
    branchId: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await ApiService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.tcNo.trim()) {
      newErrors.tcNo = 'TC Kimlik No gereklidir';
      valid = false;
    } else if (formData.tcNo.length !== 11) {
      newErrors.tcNo = 'TC Kimlik No 11 haneli olmalıdır';
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
      valid = false;
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'Doğum tarihi gereklidir';
      valid = false;
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerDetails({
        tcNo: formData.tcNo,
        phone: formData.phone,
        birthDate: formData.birthDate,
        gender: formData.gender,
        education: formData.education,
        workplace: formData.workplace,
        jobTitle: formData.jobTitle,
        branchId: formData.branchId,
        address: formData.address,
      });
      Alert.alert(
        'Başarılı',
        'Üyelik başvurunuz alındı. Onay sürecinden sonra eğitimlere erişebileceksiniz.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bilgiler kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Üyelik Bilgileri</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, styles.progressComplete]}>
                <Text style={styles.progressCheck}>✓</Text>
              </View>
              <Text style={styles.progressLabel}>Temel Bilgiler</Text>
            </View>
            <View style={[styles.progressLine, styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, styles.progressActive]}>
                <Text style={styles.progressNumber}>2</Text>
              </View>
              <Text style={[styles.progressLabel, styles.progressLabelActive]}>
                Üyelik Bilgileri
              </Text>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Üyelik bilgilerinizi tamamladıktan sonra başvurunuz onay sürecine alınacaktır.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <CustomInput
              label="TC Kimlik No"
              value={formData.tcNo}
              onChangeText={(text) => updateField('tcNo', text.replace(/\D/g, ''))}
              placeholder="11 haneli TC Kimlik No"
              keyboardType="numeric"
              maxLength={11}
              error={errors.tcNo}
              required
            />

            <CustomInput
              label="Telefon"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              error={errors.phone}
              required
            />

            <CustomInput
              label="Doğum Tarihi"
              value={formData.birthDate}
              onChangeText={(text) => updateField('birthDate', text)}
              placeholder="GG/AA/YYYY"
              error={errors.birthDate}
              required
            />

            {/* Gender Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Cinsiyet *</Text>
              <View style={[styles.pickerWrapper, errors.gender && styles.pickerError]}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Seçiniz..." value="" />
                  <Picker.Item label="Erkek" value="male" />
                  <Picker.Item label="Kadın" value="female" />
                  <Picker.Item label="Belirtmek İstemiyorum" value="other" />
                </Picker>
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>

            {/* Education Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Eğitim Durumu *</Text>
              <View style={[styles.pickerWrapper, errors.education && styles.pickerError]}>
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
              {errors.education && <Text style={styles.errorText}>{errors.education}</Text>}
            </View>

            <CustomInput
              label="İş Yeri"
              value={formData.workplace}
              onChangeText={(text) => updateField('workplace', text)}
              placeholder="Çalıştığınız kurum"
            />

            <CustomInput
              label="Ünvan"
              value={formData.jobTitle}
              onChangeText={(text) => updateField('jobTitle', text)}
              placeholder="İş ünvanınız"
            />

            {/* Branch Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Şube *</Text>
              <View style={[styles.pickerWrapper, errors.branchId && styles.pickerError]}>
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
              placeholder="Ev adresiniz"
              multiline
              numberOfLines={3}
            />

            <CustomButton
              title="Başvuruyu Tamamla"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressComplete: {
    backgroundColor: COLORS.success,
  },
  progressActive: {
    backgroundColor: COLORS.primary,
  },
  progressCheck: {
    fontSize: 18,
    color: COLORS.textWhite,
  },
  progressNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  progressLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  progressLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  progressLineComplete: {
    backgroundColor: COLORS.success,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.sm,
  },
  pickerContainer: {
    marginBottom: SPACING.md,
  },
  pickerLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pickerWrapper: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  pickerError: {
    borderColor: COLORS.error,
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
});
