// Signup Screen - Redesigned to match front web design
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { IslamicTileBackground } from '../components/IslamicTileBackground';
import { CircularPersianMotif } from '../components/CircularPersianMotif';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KONYA_DISTRICTS } from '../../../shared/constants/districts';
import { POSITIONS } from '../../../shared/constants/positions';

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { registerBasic } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    birthDate: '',
    district: '',
    kadroUnvani: '',
    gender: '' as 'male' | 'female' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      newErrors.firstName = 'Ad en az 2 karakter olmalıdır';
      valid = false;
    }

    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      newErrors.lastName = 'Soyad en az 2 karakter olmalıdır';
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
      valid = false;
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = '10-11 haneli telefon numarası giriniz';
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
      valid = false;
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Doğum tarihi gereklidir';
      valid = false;
    }

    if (!formData.district.trim()) {
      newErrors.district = 'Görev ilçesi gereklidir';
      valid = false;
    }

    if (!formData.kadroUnvani.trim()) {
      newErrors.kadroUnvani = 'Kadro ünvanı gereklidir';
      valid = false;
    }

    if (!formData.gender) {
      newErrors.gender = 'Cinsiyet seçimi gereklidir';
      valid = false;
    }

    if (!kvkkAccepted) {
      Alert.alert('Uyarı', 'Devam etmek için KVKK metnini okuyup onaylamanız gerekmektedir.');
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.replace(/\s/g, ''),
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate,
        district: formData.district,
        kadroUnvani: formData.kadroUnvani,
        gender: formData.gender as 'male' | 'female',
      });
    } catch (error: any) {
      Alert.alert('Kayıt Başarısız', getUserFriendlyErrorMessage(error, 'Kayıt yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0f172a', '#312e81', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Islamic Pattern Overlay */}
      <View style={styles.patternOverlay}>
        <IslamicTileBackground opacity={0.1} />
      </View>

      {/* Animated Persian Motif */}
      <View style={styles.decorativeElements} pointerEvents="none">
        <Animated.View
          style={[
            styles.motifTopLeft,
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <CircularPersianMotif size={500} color="#ffffff" opacity={0.07} />
        </Animated.View>
      </View>

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
              <Feather name="arrow-left" size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>

            {/* Main Card */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Card Header */}
              <LinearGradient
                colors={['#4338ca', '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardHeader}
              >
                <View style={styles.cardHeaderPattern}>
                  <IslamicTileBackground opacity={0.1} />
                </View>
                <View style={styles.cardHeaderContent}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={require('../../assets/logo.png')}
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.title}>Hesap Oluştur</Text>
                  <Text style={styles.subtitle}>Aramıza katılın ve avantajlardan yararlanın</Text>
                </View>
              </LinearGradient>

              {/* Card Body */}
              <View style={styles.cardBody}>
                {/* Name Row */}
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Ad</Text>
                    <View style={[styles.inputWrapper, errors.firstName ? styles.inputError : null]}>
                      <Feather name="user" size={16} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.firstName}
                        onChangeText={(text) => updateField('firstName', text)}
                        placeholder="Adınız"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                      />
                    </View>
                    {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Soyad</Text>
                    <View style={[styles.inputWrapper, errors.lastName ? styles.inputError : null]}>
                      <Feather name="user" size={16} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.lastName}
                        onChangeText={(text) => updateField('lastName', text)}
                        placeholder="Soyadınız"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                      />
                    </View>
                    {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Telefon Numarası</Text>
                  <View style={[styles.inputWrapper, errors.phone ? styles.inputError : null]}>
                    <Feather name="phone" size={16} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(text) => updateField('phone', text)}
                      placeholder="Örn: 05551234567"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <Text style={styles.hintText}>Başında 0 ile 11 hane (Örn: 05551234567)</Text>
                  {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta Adresi</Text>
                  <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                    <Feather name="mail" size={16} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => updateField('email', text)}
                      placeholder="Örn: isminiz@gmail.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <Text style={styles.hintText}>Gmail, Hotmail veya başka e-posta adresinizi yazın</Text>
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                    <Feather name="lock" size={16} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.password}
                      onChangeText={(text) => updateField('password', text)}
                      placeholder="Örn: Sifrem123"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hintText}>En az 6 karakter içermelidir</Text>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* Birth Date */}
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
                        if (selectedDate) {
                          setDatePickerDate(selectedDate);
                          const year = selectedDate.getFullYear();
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          updateField('birthDate', `${year}-${month}-${day}`);
                        }
                      }}
                      maximumDate={new Date()}
                    />
                  )}
                  <Text style={styles.hintText}>18 yaşından büyük olmalısınız. Takvimden tarihinizi seçin</Text>
                  {errors.birthDate ? <Text style={styles.errorText}>{errors.birthDate}</Text> : null}
                </View>

                {/* District */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Görev İlçesi</Text>
                  <View style={[styles.pickerWrapper, errors.district ? styles.inputError : null]}>
                    <Feather name="map-pin" size={16} color="#94a3b8" style={styles.inputIcon} />
                    <Picker
                      selectedValue={formData.district}
                      onValueChange={(value) => updateField('district', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="İlçe seçiniz..." value="" />
                      {KONYA_DISTRICTS.map((district) => (
                        <Picker.Item key={district} label={district} value={district} />
                      ))}
                    </Picker>
                  </View>
                  <Text style={styles.hintText}>Konya'da görev yaptığınız ilçeyi seçin</Text>
                  {errors.district ? <Text style={styles.errorText}>{errors.district}</Text> : null}
                </View>

                {/* Kadro Unvani */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kadro Ünvanı</Text>
                  <View style={[styles.pickerWrapper, errors.kadroUnvani ? styles.inputError : null]}>
                    <Feather name="briefcase" size={16} color="#94a3b8" style={styles.inputIcon} />
                    <Picker
                      selectedValue={formData.kadroUnvani}
                      onValueChange={(value) => updateField('kadroUnvani', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Ünvan seçiniz..." value="" />
                      {POSITIONS.map((position) => (
                        <Picker.Item key={position} label={position} value={position} />
                      ))}
                    </Picker>
                  </View>
                  <Text style={styles.hintText}>Diyanet İşleri'ndeki görev unvanınızı seçin</Text>
                  {errors.kadroUnvani ? <Text style={styles.errorText}>{errors.kadroUnvani}</Text> : null}
                </View>

                {/* Gender Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cinsiyet</Text>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        formData.gender === 'male' && styles.genderSelected,
                      ]}
                      onPress={() => updateField('gender', 'male')}
                    >
                      <Feather 
                        name="user" 
                        size={18} 
                        color={formData.gender === 'male' ? '#4338ca' : '#64748b'} 
                      />
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
                      <Feather 
                        name="user" 
                        size={18} 
                        color={formData.gender === 'female' ? '#4338ca' : '#64748b'} 
                      />
                      <Text style={[
                        styles.genderText,
                        formData.gender === 'female' && styles.genderTextSelected,
                      ]}>Kadın</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
                </View>

                {/* KVKK Acceptance */}
                <View style={styles.kvkkContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setKvkkAccepted(!kvkkAccepted)}
                  >
                    <View style={[styles.checkboxBox, kvkkAccepted && styles.checkboxChecked]}>
                      {kvkkAccepted && <Feather name="check" size={14} color="#ffffff" />}
                    </View>
                    <Text style={styles.kvkkText}>
                      <Text style={styles.kvkkLink} onPress={() => Alert.alert(
                        'KVKK Aydınlatma Metni',
                        'Türk Diyanet Vakıf Sen olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında kişisel verilerinizin güvenliğini sağlamak önceliğimizdir.\n\n' +
                        'Toplanan Veriler: Ad, soyad, telefon, e-posta, doğum tarihi, TC kimlik no, görev bilgileri\n\n' +
                        'Kullanım Amacı: Üyelik işlemleri, iletişim, eğitim ve etkinlik duyuruları, sendika hizmetlerinden yararlanma\n\n' +
                        'Veri Saklama: Verileriniz üyeliğiniz süresince ve yasal zorunluluklar çerçevesinde saklanır\n\n' +
                        'Haklarınız: KVKK kapsamında verilerinize erişim, düzeltme, silme ve işlemenin durdurulması haklarına sahipsiniz\n\n' +
                        'İletişim: kvkk@tdiyanetsen.org',
                        [{ text: 'Tamam' }]
                      )}>
                        KVKK Aydınlatma Metni
                      </Text>
                      'ni okudum, kabul ediyorum
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#4338ca', '#1e40af']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButtonGradient}
                  >
                    {loading ? (
                      <Feather name="loader" size={20} color="#ffffff" />
                    ) : (
                      <>
                        <Feather name="user-plus" size={20} color="#ffffff" style={styles.buttonIcon} />
                        <Text style={styles.submitButtonText}>Kayıt Ol</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Giriş Yap</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: 'hidden',
  },
  motifTopLeft: {
    position: 'absolute',
    top: -200,
    left: -200,
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  },
  cardHeader: {
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardHeaderPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeaderContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    borderRadius: 40,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(199, 210, 254, 1)',
    textAlign: 'center',
  },
  cardBody: {
    padding: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
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
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
    paddingLeft: 12,
  },
  picker: {
    flex: 1,
    color: '#1e293b',
    marginLeft: -8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  datePickerPlaceholder: {
    color: '#94a3b8',
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
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  genderSelected: {
    borderColor: '#4338ca',
    backgroundColor: '#eef2ff',
  },
  genderText: {
    fontSize: 16,
    color: '#64748b',
  },
  genderTextSelected: {
    color: '#4338ca',
    fontWeight: '600',
  },
  kvkkContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
  },
  kvkkText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  kvkkLink: {
    color: '#4338ca',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 14,
    color: '#4338ca',
    fontWeight: '600',
  },
});
