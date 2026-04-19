// Forgot Password Screen - Full-screen blue theme
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
import { IslamicTileBackground } from '../components/IslamicTileBackground';
import { CircularPersianMotif } from '../components/CircularPersianMotif';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;
  const isVerySmallScreen = screenWidth < 340 || screenHeight < 700;
  const responsiveLogoSize = isVerySmallScreen ? 112 : isSmallScreen ? 128 : 146;
  const responsiveAppLabelSize = isVerySmallScreen ? 15 : isSmallScreen ? 16 : 18;
  const responsiveHeroTitleSize = isVerySmallScreen ? 34 : isSmallScreen ? 38 : 44;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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

  const validateEmail = () => {
    if (!email.trim()) {
      setError('E-posta adresi gereklidir');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Geçerli bir e-posta adresi giriniz');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      await ApiService.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      Alert.alert(
        'Hata',
        getUserFriendlyErrorMessage(err, 'Şifre sıfırlama isteği gönderilemedi. Lütfen tekrar deneyin.')
      );
    } finally {
      setLoading(false);
    }
  };

  const Background = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.patternOverlay} pointerEvents="none">
        <IslamicTileBackground opacity={0.05} />
      </View>
      <View style={styles.decorativeLayer} pointerEvents="none">
        <Animated.View style={[styles.motifBg, { transform: [{ rotate: rotation }] }]}>
          <CircularPersianMotif size={600} color="#3b82f6" opacity={0.05} />
        </Animated.View>
      </View>
    </View>
  );

  if (sent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e3a8a', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.patternOverlay} pointerEvents="none">
          <IslamicTileBackground opacity={0.05} />
        </View>
        <View style={styles.decorativeLayer} pointerEvents="none">
          <Animated.View style={[styles.motifBg, { transform: [{ rotate: rotation }] }]}>
            <CircularPersianMotif size={600} color="#3b82f6" opacity={0.05} />
          </Animated.View>
        </View>

        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.topNav}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <Animated.View style={[styles.successSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.successIconWrap}>
                <LinearGradient colors={['#16a34a', '#15803d']} style={styles.successIconGrad}>
                  <Feather name="mail" size={32} color="#ffffff" />
                </LinearGradient>
              </View>
              <Text style={styles.successTitle}>E-posta Gönderildi</Text>
              <Text style={styles.successMsg}>
                Şifre sıfırlama bağlantısı{'\n'}
                <Text style={styles.successEmail}>{email}</Text>
                {'\n'}adresine gönderildi.
              </Text>
              <Text style={styles.successHint}>
                Gelen kutunuzu kontrol edin. Bulamazsanız spam klasörünü de kontrol edin.
              </Text>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#2563eb', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Giriş Sayfasına Dön</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={() => { setSent(false); setEmail(''); }}>
                <Text style={styles.resendText}>Tekrar gönder</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.patternOverlay} pointerEvents="none">
        <IslamicTileBackground opacity={0.05} />
      </View>
      <View style={styles.decorativeLayer} pointerEvents="none">
        <Animated.View style={[styles.motifBg, { transform: [{ rotate: rotation }] }]}>
          <CircularPersianMotif size={600} color="#3b82f6" opacity={0.05} />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Top nav */}
            <View style={styles.topNav}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
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
                  paddingTop: isVerySmallScreen ? 18 : 36,
                  paddingBottom: isVerySmallScreen ? 28 : 48,
                },
              ]}
            >
              <View style={[styles.iconWrap, { width: responsiveLogoSize, height: responsiveLogoSize }] }>
                <Image
                  source={require('../../assets/logo.png')}
                  style={[styles.logoImg, { width: responsiveLogoSize, height: responsiveLogoSize }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.appLabel, { fontSize: responsiveAppLabelSize, letterSpacing: isSmallScreen ? 0.8 : 1.2 }]}>TDVS Konya</Text>
              <Text style={[styles.heroTitle, { fontSize: responsiveHeroTitleSize, lineHeight: Math.round(responsiveHeroTitleSize * 1.08) }]}>Şifre Sıfırla</Text>
              <Text style={styles.heroSub}>Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>E-posta</Text>
                <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                  <Feather name="mail" size={16} color={error ? '#f87171' : '#ffffff'} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    placeholder="ornek@gmail.com"
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoFocus
                  />
                </View>
                {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
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
                      <Text style={styles.submitText}>Sıfırlama Bağlantısı Gönder</Text>
                      <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.linkRow}>
                <Text style={styles.linkRowText}>Şifrenizi hatırladınız mı?</Text>
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
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 146,
    height: 146,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(148,163,184,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '300',
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
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
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
  // Resend btn
  resendBtn: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '500',
  },
  // Success
  successSection: {
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  successIconWrap: {
    marginBottom: 28,
  },
  successIconGrad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  successMsg: {
    fontSize: 15,
    color: 'rgba(148,163,184,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '300',
  },
  successEmail: {
    fontWeight: '600',
    color: '#60a5fa',
  },
  successHint: {
    fontSize: 13,
    color: 'rgba(148,163,184,0.5)',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 20,
    fontWeight: '300',
  },
});
