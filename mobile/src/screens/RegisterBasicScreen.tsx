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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { CustomPicker } from '../components/CustomPicker';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import type { Gender } from '@shared/types/user';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

type RegisterBasicScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterBasic'>;
};

export const RegisterBasicScreen: React.FC<RegisterBasicScreenProps> = ({ navigation }) => {
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: '' as Gender | '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      newErrors.email = 'E-posta gereklidir';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta giriniz';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
      valid = false;
    } else {
      if (formData.password.length < 8) {
        newErrors.password = 'Şifre en az 8 karakter olmalıdır';
        valid = false;
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Şifre en az bir büyük harf içermelidir';
        valid = false;
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Şifre en az bir küçük harf içermelidir';
        valid = false;
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Şifre en az bir rakam içermelidir';
        valid = false;
      }
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

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await apiService.registerBasic({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        birthDate: formData.birthDate,
        gender: formData.gender as Gender,
      });

      // Custom token ile sign in yapıldı, onAuthStateChanged otomatik tetiklenecek
      // Biraz bekleyip user state güncellenmesini sağla
      setTimeout(async () => {
        await refreshUser();
        navigation.navigate('RegisterDetails');
      }, 1000);
    } catch (error: any) {
      console.error('Register basic error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Kayıt işlemi başarısız oldu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Temel Kayıt</Text>
            <Text style={styles.subtitle}>Adım 1/2</Text>
          </View>

          <View style={styles.formContainer}>
            <CustomInput
              label="Ad"
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: text });
                setErrors({ ...errors, firstName: '' });
              }}
              placeholder="Adınız"
              error={errors.firstName}
              required
            />

            <CustomInput
              label="Soyad"
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData({ ...formData, lastName: text });
                setErrors({ ...errors, lastName: '' });
              }}
              placeholder="Soyadınız"
              error={errors.lastName}
              required
            />

            <CustomInput
              label="E-posta"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                setErrors({ ...errors, email: '' });
              }}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
            />

            <CustomInput
              label="Şifre"
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                setErrors({ ...errors, password: '' });
              }}
              placeholder="••••••••"
              secureTextEntry
              error={errors.password}
              required
            />

            <CustomInput
              label="Şifre Tekrar"
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="••••••••"
              secureTextEntry
              error={errors.confirmPassword}
              required
            />

            <CustomInput
              label="Doğum Tarihi"
              value={formData.birthDate}
              onChangeText={(text) => {
                setFormData({ ...formData, birthDate: text });
                setErrors({ ...errors, birthDate: '' });
              }}
              placeholder="YYYY-MM-DD (örn: 1990-01-01)"
              error={errors.birthDate}
              required
            />

            <CustomPicker
              label="Cinsiyet"
              value={formData.gender}
              options={[
                { label: 'Erkek', value: 'male' },
                { label: 'Kadın', value: 'female' },
              ]}
              onValueChange={(value) => {
                setFormData({ ...formData, gender: value as Gender });
                setErrors({ ...errors, gender: '' });
              }}
              placeholder="Cinsiyet Seçiniz"
              error={errors.gender}
              required
            />

            <CustomButton
              title="Devam Et"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                Zaten hesabınız var mı?{' '}
                <Text style={styles.loginTextBold}>Giriş Yapın</Text>
              </Text>
            </TouchableOpacity>
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
  registerButton: {
    marginTop: SPACING.md,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

