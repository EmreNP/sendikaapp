// Login Screen - Professional full-screen layout
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
  useWindowDimensions,
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

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;
  const isVerySmallScreen = screenWidth < 340 || screenHeight < 700;
  const responsiveLogoSize = isVerySmallScreen ? 112 : isSmallScreen ? 128 : 146;
  const responsiveAppLabelSize = isVerySmallScreen ? 15 : isSmallScreen ? 16 : 18;
  const responsiveHeroTitleSize = isVerySmallScreen ? 34 : isSmallScreen ? 38 : 44;

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Şifre gereklidir';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Giriş Başarısız', getUserFriendlyErrorMessage(error, 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.'));
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
                  paddingTop: isVerySmallScreen ? 16 : isSmallScreen ? 22 : 28,
                  paddingBottom: isVerySmallScreen ? 30 : 44,
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
              <Text style={[styles.heroTitle, { fontSize: responsiveHeroTitleSize, lineHeight: Math.round(responsiveHeroTitleSize * 1.08) }]}>Hoşgeldiniz</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>E-posta</Text>
                <View style={[styles.inputRow, errors.email ? styles.inputRowError : null]}>
                  <Feather
                    name="mail"
                    size={16}
                    color={errors.email ? '#f87171' : '#ffffff'}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                    placeholder="ornek@gmail.com"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    accessibilityLabel="E-posta adresi"
                  />
                </View>
                {errors.email ? <Text style={styles.errorMsg}>{errors.email}</Text> : null}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Şifre</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword' as never)}
                    accessibilityRole="link"
                  >
                    <Text style={styles.forgotLink}>Şifremi unuttum</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputRow, errors.password ? styles.inputRowError : null]}>
                  <Feather
                    name="lock"
                    size={16}
                    color={errors.password ? '#f87171' : '#ffffff'}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                    placeholder="Şifreniz"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    accessibilityLabel="Şifre"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="rgba(148,163,184,0.6)" />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorMsg}>{errors.password}</Text> : null}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Giriş Yap"
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
                      <Text style={styles.submitText}>Giriş Yap</Text>
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

              {/* Register link */}
              <View style={styles.linkRow}>
                <Text style={styles.linkRowText}>Hesabınız yok mu?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Signup')}
                  accessibilityRole="link"
                >
                  <Text style={styles.linkRowAction}> Kayıt Ol</Text>
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
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 146,
    height: 146,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 20,
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
    fontSize: 44,
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
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  forgotLink: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
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
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
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
  // Submit
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
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
    marginVertical: 24,
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
