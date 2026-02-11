// Signup Screen - Basic Registration
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { registerBasic } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: '' as 'male' | 'female' | '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
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

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      valid = false;
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Doğum tarihi gereklidir';
      valid = false;
    }

    if (!formData.gender) {
      newErrors.gender = 'Cinsiyet seçimi gereklidir';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerBasic({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        gender: formData.gender as 'male' | 'female',
      });
      // After signup, user goes to home with "pending_details" status
      // They can access Membership screen from there
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Kayıt yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>📝</Text>
              </View>
              <Text style={styles.title}>Kayıt Ol</Text>
              <Text style={styles.subtitle}>Hızlı kayıt - Aşama 1/2</Text>
            </View>

            {/* Progress Steps */}
            <View style={styles.progressContainer}>
              <View style={styles.progressStep}>
                <View style={[styles.progressCircle, styles.progressActive]}>
                  <Text style={styles.progressNumber}>1</Text>
                </View>
                <Text style={[styles.progressLabel, styles.progressLabelActive]}>
                  Temel Bilgiler
                </Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressNumber}>2</Text>
                </View>
                <Text style={styles.progressLabel}>Üyelik Bilgileri</Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <CustomInput
                    label="Ad"
                    value={formData.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                    placeholder="Adınız"
                    autoCapitalize="words"
                    error={errors.firstName}
                    required
                  />
                </View>
                <View style={styles.halfInput}>
                  <CustomInput
                    label="Soyad"
                    value={formData.lastName}
                    onChangeText={(text) => updateField('lastName', text)}
                    placeholder="Soyadınız"
                    autoCapitalize="words"
                    error={errors.lastName}
                    required
                  />
                </View>
              </View>

              <CustomInput
                label="E-posta"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                required
              />

              <CustomInput
                label="Şifre"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="En az 6 karakter"
                secureTextEntry
                autoComplete="password-new"
                error={errors.password}
                required
              />

              <CustomInput
                label="Şifre Tekrar"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                placeholder="Şifrenizi tekrar girin"
                secureTextEntry
                autoComplete="password-new"
                error={errors.confirmPassword}
                required
              />

              {/* Birth Date */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Doğum Tarihi <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.dateInput, errors.birthDate ? styles.inputError : null]}
                  value={formData.birthDate}
                  onChangeText={(text) => updateField('birthDate', text)}
                  placeholder="1990-01-15"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.hintText}>Format: YYYY-AA-GG (örn: 1990-05-15)</Text>
                {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cinsiyet <Text style={styles.required}>*</Text></Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'male' && styles.genderSelected,
                    ]}
                    onPress={() => updateField('gender', 'male')}
                  >
                    <Text style={[
                      styles.genderText,
                      formData.gender === 'male' && styles.genderTextSelected,
                    ]}>Erkek</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'female' && styles.genderSelected,
                    ]}
                    onPress={() => updateField('gender', 'female')}
                  >
                    <Text style={[
                      styles.genderText,
                      formData.gender === 'female' && styles.genderTextSelected,
                    ]}>Kadın</Text>
                  </TouchableOpacity>
                </View>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>

              <CustomButton
                title="Kayıt Ol"
                onPress={handleSignup}
                loading={loading}
                size="lg"
                style={styles.submitButton}
              />

              <Text style={styles.infoText}>
                Kayıt olduktan sonra ana sayfadan üyelik bilgilerinizi tamamlayabilirsiniz.
              </Text>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textWhite,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressActive: {
    backgroundColor: COLORS.surface,
  },
  progressNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressLabelActive: {
    color: COLORS.textWhite,
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xs,
  },
  halfInput: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  loginText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  required: {
    color: COLORS.error,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  hintText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  genderSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  genderTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
