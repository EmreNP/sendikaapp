// Forgot Password Screen - Şifre Sıfırlama
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
  Dimensions,
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

const { width } = Dimensions.get('window');

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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
      // Backend güvenlik gereği her durumda başarılı döner (email olsun olmasın)
      // Ama network hatası olabilir
      Alert.alert(
        'Hata',
        getUserFriendlyErrorMessage(err, 'Şifre sıfırlama isteği gönderilemedi. Lütfen tekrar deneyin.')
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#312e81', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.patternOverlay}>
          <IslamicTileBackground opacity={0.1} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>

            <View style={styles.successCard}>
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.successIcon}
                >
                  <Feather name="mail" size={32} color="#ffffff" />
                </LinearGradient>
              </View>
              <Text style={styles.successTitle}>E-posta Gönderildi!</Text>
              <Text style={styles.successMessage}>
                Şifre sıfırlama bağlantısı{'\n'}
                <Text style={styles.successEmail}>{email}</Text>
                {'\n'}adresine gönderildi.
              </Text>
              <Text style={styles.successHint}>
                E-postanızı kontrol edin. Gelen kutunuzda bulamazsanız spam/gereksiz klasörünü de kontrol edin.
              </Text>

              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <LinearGradient
                  colors={['#4338ca', '#1e40af']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.backToLoginGradient}
                >
                  <Feather name="log-in" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.backToLoginText}>Giriş Sayfasına Dön</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setSent(false);
                  setEmail('');
                }}
              >
                <Text style={styles.resendText}>Tekrar gönder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#312e81', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.patternOverlay}>
        <IslamicTileBackground opacity={0.1} />
      </View>
      <View style={styles.decorativeElements} pointerEvents="none">
        <Animated.View
          style={[styles.motifTopLeft, { transform: [{ rotate: rotation }] }]}
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>

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
                    <Feather name="key" size={28} color="#4338ca" />
                  </View>
                  <Text style={styles.title}>Şifremi Unuttum</Text>
                  <Text style={styles.subtitle}>Şifrenizi sıfırlamak için e-posta adresinizi girin</Text>
                </View>
              </LinearGradient>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.infoBox}>
                  <Feather name="info" size={16} color="#3b82f6" />
                  <Text style={styles.infoText}>
                    Kayıtlı e-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta Adresi</Text>
                  <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                    <Feather name="mail" size={18} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      placeholder="Kayıtlı e-posta adresiniz"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoFocus
                    />
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleResetPassword}
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
                        <Feather name="send" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.submitButtonText}>Sıfırlama Bağlantısı Gönder</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Şifrenizi hatırladınız mı? </Text>
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
    justifyContent: 'center',
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
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 24,
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
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 8,
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
  // Success screen styles
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  successEmail: {
    fontWeight: '700',
    color: '#4338ca',
  },
  successHint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 18,
  },
  backToLoginButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  backToLoginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#4338ca',
    fontWeight: '500',
  },
});
