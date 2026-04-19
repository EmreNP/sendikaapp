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
  Modal,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { useSecureScreen } from '../hooks/useSecureScreen';
import { IslamicTileBackground } from '../components/IslamicTileBackground';
import { CircularPersianMotif } from '../components/CircularPersianMotif';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { BirthDatePickerModal } from '../components/BirthDatePickerModal';
import { KONYA_DISTRICTS } from '../../../shared/constants/districts';

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;
  const isVerySmallScreen = screenWidth < 340 || screenHeight < 700;
  const responsiveLogoSize = isVerySmallScreen ? 112 : isSmallScreen ? 128 : 146;
  const responsiveAppLabelSize = isVerySmallScreen ? 15 : isSmallScreen ? 16 : 18;
  const responsiveHeroTitleSize = isVerySmallScreen ? 32 : isSmallScreen ? 36 : 42;

  useSecureScreen();
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [districtPickerVisible, setDistrictPickerVisible] = useState(false);

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

    // Ad - en az 2 karakter, en fazla 50 karakter, sadece harf ve Türkçe karakterler
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      newErrors.firstName = 'Ad en az 2 karakter olmalıdır';
      valid = false;
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'Ad en fazla 50 karakter olabilir';
      valid = false;
    } else if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(formData.firstName)) {
      newErrors.firstName = 'Ad sadece harf içerebilir';
      valid = false;
    }

    // Soyad - en az 2 karakter, en fazla 50 karakter, sadece harf ve Türkçe karakterler
    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      newErrors.lastName = 'Soyad en az 2 karakter olmalıdır';
      valid = false;
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Soyad en fazla 50 karakter olabilir';
      valid = false;
    } else if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Soyad sadece harf içerebilir';
      valid = false;
    }

    // Telefon - 10 haneli numara (başında 0 olmadan)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
      valid = false;
    } else if (!/^5[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = '10 haneli telefon numarası giriniz (Örn: 5551234567)';
      valid = false;
    }

    // Email - geçerli format ve benzersiz
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      valid = false;
    }

    // Şifre validasyonu - backend ile uyumlu (min 6 karakter)
    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
      valid = false;
    }

    // Doğum tarihi - en az 18 yaşında, en fazla 120 yaşında
    if (!formData.birthDate) {
      newErrors.birthDate = 'Doğum tarihi gereklidir';
      valid = false;
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
      }

      if (actualAge < 18) {
        newErrors.birthDate = 'En az 18 yaşında olmalısınız';
        valid = false;
      } else if (actualAge > 120) {
        newErrors.birthDate = 'Geçerli bir doğum tarihi giriniz';
        valid = false;
      }
    }

    // Görev ilçesi
    if (!formData.district.trim()) {
      newErrors.district = 'Görev ilçesi gereklidir';
      valid = false;
    }

    // Kadro ünvanı
    if (!formData.kadroUnvani.trim()) {
      newErrors.kadroUnvani = 'Kadro ünvanı gereklidir';
      valid = false;
    }

    // Cinsiyet
    if (!formData.gender) {
      newErrors.gender = 'Cinsiyet seçimi gereklidir';
      valid = false;
    }

    // KVKK onayı
    if (!kvkkAccepted) {
      Alert.alert('Uyarı', 'Devam etmek için Gizlilik Politikası ve KVKK Aydınlatma Metni\'ni okuyup onaylamanız gerekmektedir.');
      valid = false;
    }

    // Kullanım Koşulları onayı
    if (!termsAccepted) {
      Alert.alert('Uyarı', 'Devam etmek için Kullanım Koşulları\'nı okuyup onaylamanız gerekmektedir.');
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
        hasAcceptedKvkk: kvkkAccepted,
        hasAcceptedTerms: termsAccepted,
      });
    } catch (error: any) {
      Alert.alert('Kayıt Başarısız', getUserFriendlyErrorMessage(error, 'Kayıt yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Islamic pattern overlay */}
      <View style={styles.patternOverlay} pointerEvents="none">
        <IslamicTileBackground opacity={0.05} />
      </View>

      {/* Decorative rotating motif */}
      <View style={styles.decorativeLayer} pointerEvents="none">
        <Animated.View style={[styles.motifBg, { transform: [{ rotate: rotation }] }]}>
          <CircularPersianMotif size={600} color="#3b82f6" opacity={0.05} />
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
            {/* Top nav */}
            <View style={styles.topNav}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Geri"
                accessibilityRole="button"
              >
                <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Hero */}
            <Animated.View
              style={[
                styles.hero,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  paddingTop: isVerySmallScreen ? 14 : 24,
                  paddingBottom: isVerySmallScreen ? 24 : 36,
                },
              ]}
            >
              <View style={[styles.logoWrap, { width: responsiveLogoSize, height: responsiveLogoSize }] }>
                <Image
                  source={require('../../assets/logo.png')}
                  style={[styles.logoImg, { width: responsiveLogoSize, height: responsiveLogoSize }]}
                  resizeMode="cover"
                />
              </View>
              <Text style={[styles.appLabel, { fontSize: responsiveAppLabelSize, letterSpacing: isSmallScreen ? 0.8 : 1.2 }]}>TDVS Konya</Text>
              <Text style={[styles.heroTitle, { fontSize: responsiveHeroTitleSize, lineHeight: Math.round(responsiveHeroTitleSize * 1.08) }]}>Hesap Oluştur</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              {/* Ad & Soyad */}
              <View style={[styles.nameRow, isSmallScreen && styles.nameRowStack]}>
                <View style={[styles.fieldGroup, styles.halfFieldLeft, isSmallScreen && styles.halfFieldStack]}>
                  <Text style={styles.fieldLabel}>Ad</Text>
                  <View style={[styles.inputRow, errors.firstName ? styles.inputRowError : null]}>
                    <Feather name="user" size={15} color={errors.firstName ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={formData.firstName}
                      onChangeText={(t) => updateField('firstName', t)}
                      placeholder="Adınız"
                      placeholderTextColor="rgba(148,163,184,0.5)"
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.firstName ? <Text style={styles.errorMsg}>{errors.firstName}</Text> : null}
                </View>
                <View style={[styles.fieldGroup, styles.halfFieldRight, isSmallScreen && styles.halfFieldStack]}>
                  <Text style={styles.fieldLabel}>Soyad</Text>
                  <View style={[styles.inputRow, errors.lastName ? styles.inputRowError : null]}>
                    <Feather name="user" size={15} color={errors.lastName ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={formData.lastName}
                      onChangeText={(t) => updateField('lastName', t)}
                      placeholder="Soyadınız"
                      placeholderTextColor="rgba(148,163,184,0.5)"
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.lastName ? <Text style={styles.errorMsg}>{errors.lastName}</Text> : null}
                </View>
              </View>

              {/* Telefon */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Telefon</Text>
                <View style={[styles.inputRow, errors.phone ? styles.inputRowError : null]}>
                  <Feather name="phone" size={15} color={errors.phone ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.phone}
                    onChangeText={(text) => {
                      const normalized = text.replace(/\D/g, '').replace(/^0+/, '');
                      updateField('phone', normalized);
                    }}
                    placeholder="5551234567"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone ? <Text style={styles.errorMsg}>{errors.phone}</Text> : null}
              </View>

              {/* E-posta */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>E-posta</Text>
                <View style={[styles.inputRow, errors.email ? styles.inputRowError : null]}>
                  <Feather name="mail" size={15} color={errors.email ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.email}
                    onChangeText={(t) => updateField('email', t)}
                    placeholder="ornek@gmail.com"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email ? <Text style={styles.errorMsg}>{errors.email}</Text> : null}
              </View>

              {/* Şifre */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Şifre</Text>
                <View style={[styles.inputRow, errors.password ? styles.inputRowError : null]}>
                  <Feather name="lock" size={15} color={errors.password ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.password}
                    onChangeText={(t) => updateField('password', t)}
                    placeholder="En az 6 karakter"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color="rgba(148,163,184,0.6)" />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorMsg}>{errors.password}</Text> : null}
              </View>

              {/* Doğum Tarihi */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Doğum Tarihi</Text>
                <TouchableOpacity
                  style={[styles.inputRow, errors.birthDate ? styles.inputRowError : null]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={15} color={errors.birthDate ? '#f87171' : '#94a3b8'} style={styles.fieldIcon} />
                  <Text
                    style={[
                      styles.textInput,
                      !formData.birthDate && styles.placeholderText,
                      { flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {formData.birthDate
                      ? (() => { const [y, m, d] = formData.birthDate.split('-'); return `${d}/${m}/${y}`; })()
                      : 'Doğum tarihi seçiniz...'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="rgba(148,163,184,0.5)" />
                </TouchableOpacity>
                {errors.birthDate ? <Text style={styles.errorMsg}>{errors.birthDate}</Text> : null}
              </View>

              {/* Scroll-wheel tarih seçici modal */}
              <BirthDatePickerModal
                visible={showDatePicker}
                initialDate={formData.birthDate || undefined}
                onClose={() => setShowDatePicker(false)}
                onSave={(dateStr) => {
                  updateField('birthDate', dateStr);
                  setShowDatePicker(false);
                }}
              />

              {/* Görev İlçesi */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Görev İlçesi</Text>
                <TouchableOpacity
                  style={[styles.inputRow, errors.district ? styles.inputRowError : null]}
                  onPress={() => setDistrictPickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="map-pin" size={15} color={errors.district ? '#f87171' : '#94a3b8'} style={styles.fieldIcon} />
                  <Text
                    style={[
                      styles.textInput,
                      !formData.district && styles.placeholderText,
                      { flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {formData.district || 'İlçe seçiniz...'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="rgba(148,163,184,0.5)" />
                </TouchableOpacity>
                {errors.district ? <Text style={styles.errorMsg}>{errors.district}</Text> : null}
              </View>

              {/* District Picker Modal */}
              <Modal
                visible={districtPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setDistrictPickerVisible(false)}
                statusBarTranslucent
              >
                <TouchableOpacity
                  style={styles.districtModalOverlay}
                  activeOpacity={1}
                  onPress={() => setDistrictPickerVisible(false)}
                >
                  <View
                    style={styles.districtModalSheet}
                    onStartShouldSetResponder={() => true}
                  >
                    {/* Handle bar */}
                    <View style={styles.districtSheetHandle} />

                    {/* Header */}
                    <View style={styles.districtSheetHeader}>
                      <Text style={styles.districtSheetTitle}>Görev İlçesi</Text>
                      <TouchableOpacity
                        onPress={() => setDistrictPickerVisible(false)}
                        style={styles.districtSheetClose}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x" size={18} color="rgba(148,163,184,0.7)" />
                      </TouchableOpacity>
                    </View>

                    {/* List */}
                    <FlatList
                      data={KONYA_DISTRICTS}
                      keyExtractor={(item) => item}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      style={styles.districtList}
                      renderItem={({ item }) => {
                        const selected = formData.district === item;
                        return (
                          <TouchableOpacity
                            style={[
                              styles.districtItem,
                              selected && styles.districtItemSelected,
                            ]}
                            onPress={() => {
                              updateField('district', item);
                              setDistrictPickerVisible(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.districtItemText,
                                selected && styles.districtItemTextSelected,
                              ]}
                            >
                              {item}
                            </Text>
                            {selected && (
                              <Feather name="check" size={15} color="#60a5fa" />
                            )}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Kadro Ünvanı */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Kadro Ünvanı</Text>
                <View style={[styles.inputRow, errors.kadroUnvani ? styles.inputRowError : null]}>
                  <Feather name="briefcase" size={15} color={errors.kadroUnvani ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.kadroUnvani}
                    onChangeText={(t) => updateField('kadroUnvani', t)}
                    placeholder="Görev unvanınız"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    autoCapitalize="words"
                  />
                </View>
                {errors.kadroUnvani ? <Text style={styles.errorMsg}>{errors.kadroUnvani}</Text> : null}
              </View>

              {/* Cinsiyet */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Cinsiyet</Text>
                <View style={[styles.genderRow, isVerySmallScreen && styles.genderRowStack]}>
                  <TouchableOpacity
                    style={[styles.genderBtn, formData.gender === 'male' && styles.genderBtnActive]}
                    onPress={() => updateField('gender', 'male')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: formData.gender === 'male' }}
                  >
                    <Feather
                      name="user"
                      size={16}
                      color={formData.gender === 'male' ? '#60a5fa' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.genderBtnText, formData.gender === 'male' && styles.genderBtnTextActive]}>
                      Erkek
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, formData.gender === 'female' && styles.genderBtnActive]}
                    onPress={() => updateField('gender', 'female')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: formData.gender === 'female' }}
                  >
                    <Feather
                      name="user"
                      size={16}
                      color={formData.gender === 'female' ? '#60a5fa' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.genderBtnText, formData.gender === 'female' && styles.genderBtnTextActive]}>
                      Kadın
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.gender ? <Text style={styles.errorMsg}>{errors.gender}</Text> : null}
              </View>

              {/* KVKK */}
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setKvkkAccepted(!kvkkAccepted)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: kvkkAccepted }}
              >
                <View style={[styles.checkBox, kvkkAccepted && styles.checkBoxActive]}>
                  {kvkkAccepted && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkText}>
                  <Text style={styles.checkLink} onPress={() => navigation.navigate('Kvkk')}>
                    Gizlilik Politikası ve KVKK
                  </Text>
                  {' '}metnini okudum, kabul ediyorum
                </Text>
              </TouchableOpacity>

              {/* Kullanım Koşulları */}
              <TouchableOpacity
                style={[styles.checkRow, { marginTop: 10 }]}
                onPress={() => setTermsAccepted(!termsAccepted)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
              >
                <View style={[styles.checkBox, termsAccepted && styles.checkBoxActive]}>
                  {termsAccepted && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkText}>
                  <Text style={styles.checkLink} onPress={() => navigation.navigate('Terms')}>
                    Kullanım Koşulları
                  </Text>
                  {'\''}nı okudum, kabul ediyorum
                </Text>
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Kayıt Ol"
              >
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <Feather name="loader" size={20} color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitText}>Kayıt Ol</Text>
                      <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login link */}
              <View style={styles.linkRow}>
                <Text style={styles.linkRowText}>Zaten hesabınız var mı?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityRole="link">
                  <Text style={styles.linkRowAction}> Giriş Yap</Text>
                </TouchableOpacity>
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
  decorativeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: 'hidden',
  },
  motifBg: {
    position: 'absolute',
    top: -120,
    right: -120,
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
    paddingBottom: 48,
  },
  // Top nav
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 146,
    height: 146,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 18,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  logoImg: {
    width: 146,
    height: 146,
  },
  appLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.2,
    textTransform: 'none',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 0,
    letterSpacing: -0.3,
  },
  // Form
  form: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  nameRowStack: {
    flexDirection: 'column',
  },
  halfFieldLeft: {
    flex: 1,
    marginRight: 8,
  },
  halfFieldRight: {
    flex: 1,
    marginLeft: 8,
  },
  halfFieldStack: {
    marginLeft: 0,
    marginRight: 0,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,20,50,0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    height: 52,
    paddingHorizontal: 16,
  },
  inputRowError: {
    borderColor: 'rgba(248,113,113,0.5)',
  },
  // District Picker Modal
  districtModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  districtModalSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  districtSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(148,163,184,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  districtSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.12)',
  },
  districtSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  districtSheetClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  districtList: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 2,
  },
  districtItemSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  districtItemText: {
    fontSize: 15,
    color: 'rgba(241,245,249,0.75)',
    fontWeight: '400',
  },
  districtItemTextSelected: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
  },
  placeholderText: {
    color: 'rgba(148,163,184,0.5)',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  errorMsg: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 6,
    marginLeft: 4,
  },
  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderRowStack: {
    flexDirection: 'column',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    backgroundColor: 'rgba(10,20,50,0.65)',
  },
  genderBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  genderBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '400',
  },
  genderBtnTextActive: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  // Checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.3)',
    marginRight: 10,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,20,50,0.6)',
  },
  checkBoxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  checkLink: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Submit
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(148,163,184,0.45)',
    marginHorizontal: 12,
  },
  // Link row
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkRowText: {
    fontSize: 14,
    color: 'rgba(148,163,184,0.65)',
  },
  linkRowAction: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
});
