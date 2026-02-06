// Welcome Screen
import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '../components/CustomButton';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🏢</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Türk Diyanet Vakıf-Sen</Text>
            <Text style={styles.subtitle}>Konya Şubesi</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>📚</Text>
                </View>
                <Text style={styles.featureText}>Eğitimler</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>🏛️</Text>
                </View>
                <Text style={styles.featureText}>Şubeler</Text>
              </View>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>👥</Text>
                </View>
                <Text style={styles.featureText}>Topluluk</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>🛡️</Text>
                </View>
                <Text style={styles.featureText}>Haklarınız</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <CustomButton
              title="Giriş Yap"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              size="lg"
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
            />
            <CustomButton
              title="Kayıt Ol"
              onPress={() => navigation.navigate('Signup')}
              variant="outline"
              size="lg"
              style={styles.signupButton}
              textStyle={styles.signupButtonText}
            />
          </View>

          {/* Info */}
          <Text style={styles.infoText}>
            Sendika üyesi olmak için kayıt olduktan sonra üyelik başvurunuzu tamamlayabilirsiniz.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2026 Türk Diyanet Vakıf-Sen Konya Şubesi
        </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: SPACING.xs,
  },
  features: {
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    width: (width - SPACING.lg * 2 - SPACING.md * 4) / 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  buttons: {
    width: '100%',
    maxWidth: 320,
    gap: SPACING.md,
  },
  loginButton: {
    backgroundColor: COLORS.surface,
  },
  loginButtonText: {
    color: COLORS.primary,
  },
  signupButton: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signupButtonText: {
    color: COLORS.textWhite,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  footer: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingBottom: SPACING.md,
  },
});
