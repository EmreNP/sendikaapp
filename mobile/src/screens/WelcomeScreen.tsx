// Premium Welcome Screen - Kurumsal Mavi Tema
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

// Animated floating particles - Blue theme
const FloatingParticle: React.FC<{ delay: number; startX: number; duration: number }> = ({ delay, startX, duration }) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      translateY.setValue(height + 50);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -50,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: duration * 0.1,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.1,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#60a5fa', // Light blue
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

// 8-pointed Islamic star SVG path
const createStar8 = (cx: number, cy: number, outerR: number, innerR: number) => {
  const points = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M ${points.join(' L ')} Z`;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.5)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');

    // Initial animations sequence
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Content fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Buttons slide in
      Animated.spring(buttonSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => setShowContent(true));

    // Continuous animations
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 120000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // Generate particle positions
  const particles = [...Array(10)].map((_, i) => ({
    delay: i * 1000,
    startX: (width / 10) * i + Math.random() * 20,
    duration: 10000 + Math.random() * 5000,
  }));

  return (
    <View style={styles.container}>
      {/* Multi-layer gradient background - Blue theme */}
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#1e40af', '#0f172a']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Secondary overlay gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(59, 130, 246, 0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating particles */}
      <View style={styles.particlesContainer} pointerEvents="none">
        {particles.map((particle, i) => (
          <FloatingParticle key={i} {...particle} />
        ))}
      </View>

      {/* Animated geometric patterns - Blue theme */}
      <View style={styles.patternContainer} pointerEvents="none">
        {/* Large rotating pattern - top left */}
        <Animated.View
          style={[
            styles.patternTopLeft,
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <Svg width={500} height={500} viewBox="0 0 400 400">
            <Defs>
              <SvgLinearGradient id="blueGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <Stop offset="50%" stopColor="#60a5fa" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="200" cy="200" r="180" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity={0.15} />
            <Circle cx="200" cy="200" r="150" fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity={0.2} />
            <Circle cx="200" cy="200" r="120" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity={0.15} />
            <Path d={createStar8(200, 200, 100, 50)} fill="url(#blueGrad1)" opacity={0.3} />
            <Path d={createStar8(200, 200, 70, 35)} fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity={0.25} />
            {[...Array(8)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              const x = 200 + 130 * Math.cos(angle);
              const y = 200 + 130 * Math.sin(angle);
              return <Circle key={i} cx={x} cy={y} r="15" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity={0.2} />;
            })}
          </Svg>
        </Animated.View>

        {/* Medium rotating pattern - bottom right */}
        <Animated.View
          style={[
            styles.patternBottomRight,
            { transform: [{ rotate: reverseRotation }] },
          ]}
        >
          <Svg width={400} height={400} viewBox="0 0 400 400">
            <Circle cx="200" cy="200" r="150" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity={0.15} />
            <Path d={createStar8(200, 200, 80, 40)} fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity={0.2} />
            {[...Array(12)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const x = 200 + 110 * Math.cos(angle);
              const y = 200 + 110 * Math.sin(angle);
              return <Circle key={i} cx={x} cy={y} r="8" fill="#3b82f6" opacity={0.1} />;
            })}
          </Svg>
        </Animated.View>

        {/* Small decorative pattern - center right */}
        <Animated.View
          style={[
            styles.patternCenterRight,
            { transform: [{ rotate: rotation }, { scale: pulseAnim }] },
          ]}
        >
          <Svg width={200} height={200} viewBox="0 0 200 200">
            <Circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" strokeWidth="0.3" opacity={0.2} />
            <Path d={createStar8(100, 100, 50, 25)} fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity={0.25} />
          </Svg>
        </Animated.View>
      </View>

      {/* Main content */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                transform: [
                  { scale: logoScaleAnim },
                  { rotate: logoRotation },
                ],
              },
            ]}
          >
            <Animated.View style={[styles.logoOuter, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(96, 165, 250, 0.1)', 'rgba(59, 130, 246, 0.2)']}
                style={styles.logoGradient}
              >
                <View style={styles.logoInner}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="cover"
                    accessibilityLabel="Türk Diyanet Vakıf-Sen Konya Şubesi logosu"
                    accessibilityRole="image"
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* Title section */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.titleDecorator}>
              <View style={styles.decoratorLine} />
              <View style={styles.decoratorDiamond} />
              <View style={styles.decoratorLine} />
            </View>

            <Text style={styles.mainTitle}>Türk Diyanet Vakıf-Sen</Text>
            <Text style={styles.subtitle}>Konya Şubesi</Text>

            <View style={styles.taglineContainer}>
              <Text style={styles.tagline}>İlkeli Cesur ve Kararlı Sendikacılık</Text>
            </View>
          </Animated.View>

          {/* Features section */}
          <Animated.View
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.featuresGrid}>
              {[
                { icon: 'book-open', label: 'Eğitimler' },
                { icon: 'map-pin', label: 'Şubeler' },
                { icon: 'book', label: 'Haberler' },
                { icon: 'calendar', label: 'Etkinlikler' },
                { icon: 'users', label: 'Topluluk' },
                { icon: 'shield', label: 'Haklarınız' },
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIconWrapper}>
                    <LinearGradient
                      colors={['rgba(59, 130, 246, 0.25)', 'rgba(59, 130, 246, 0.1)']}
                      style={styles.featureIconBg}
                    >
                      <Feather name={feature.icon as keyof typeof Feather.glyphMap} size={20} color="#60a5fa" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Buttons section */}
          <Animated.View
            style={[
              styles.buttonsSection,
              { transform: [{ translateY: buttonSlideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.9}
              accessibilityLabel="Giriş yap"
              accessibilityRole="button"
              accessibilityHint="Hesabınıza giriş yapmak için dokunun"
            >
              <LinearGradient
                colors={['#2563eb', '#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Feather name="log-in" size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Giriş Yap</Text>
              </LinearGradient>
              {/* Shimmer effect */}
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.8}
              accessibilityLabel="Kayıt ol"
              accessibilityRole="button"
              accessibilityHint="Yeni hesap oluşturmak için dokunun"
            >
              <Feather name="user-plus" size={20} color="#60a5fa" style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Info text */}
          <Animated.Text
            style={[
              styles.infoText,
              { opacity: fadeAnim },
            ]}
          >
            Sendika üyesi olmak için kayıt olduktan sonra{'\n'}üyelik başvurunuzu tamamlayabilirsiniz.
          </Animated.Text>
        </View>

        {/* Footer */}
        <Animated.View style={[styles.footerSection, { opacity: fadeAnim }]}>
          <View style={styles.footerDecorator} />
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Türk Diyanet Vakıf-Sen Konya Şubesi
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: 'hidden',
  },
  patternTopLeft: {
    position: 'absolute',
    top: -200,
    left: -200,
  },
  patternBottomRight: {
    position: 'absolute',
    bottom: -150,
    right: -150,
  },
  patternCenterRight: {
    position: 'absolute',
    top: '35%',
    right: -50,
  },
  safeArea: {
    flex: 1,
    zIndex: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    marginBottom: 32,
  },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },  logoIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleDecorator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  decoratorLine: {
    width: 40,
    height: 1,
    backgroundColor: '#3b82f6',
    opacity: 0.5,
  },
  decoratorDiamond: {
    width: 8,
    height: 8,
    backgroundColor: '#3b82f6',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#60a5fa',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 2,
  },
  taglineContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  featuresSection: {
    width: '100%',
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  featureItem: {
    alignItems: 'center',
    width: (width - 96) / 3, // 3 sütun (6 öğe = 3x2)
  },
  featureIconWrapper: {
    marginBottom: 8,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  featureLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonsSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 50,
    transform: [{ skewX: '-20deg' }],
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60a5fa',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerDecorator: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
});
