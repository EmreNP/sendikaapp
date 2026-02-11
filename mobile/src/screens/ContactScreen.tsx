// Contact Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type ContactScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Contact'>;
};

const contactInfo = [
  { id: '1', icon: '📍', label: 'Adres', value: 'Örnek Mahallesi, Sendika Caddesi No:1, İstanbul' },
  { id: '2', icon: '📞', label: 'Telefon', value: '+90 212 123 45 67', action: 'tel:+902121234567' },
  { id: '3', icon: '✉️', label: 'E-posta', value: 'info@sendika.com', action: 'mailto:info@sendika.com' },
  { id: '4', icon: '🌐', label: 'Web', value: 'www.sendika.com', action: 'https://www.sendika.com' },
];

export const ContactScreen: React.FC<ContactScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
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

    if (!formData.name.trim()) {
      newErrors.name = 'Adınız gereklidir';
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      valid = false;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Konu gereklidir';
      valid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Mesajınız gereklidir';
      valid = false;
    } else if (formData.message.length < 10) {
      newErrors.message = 'Mesaj en az 10 karakter olmalıdır';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await ApiService.sendContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      Alert.alert(
        'Başarılı',
        'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
        [{ text: 'Tamam', onPress: () => setFormData({ name: '', email: '', subject: '', message: '' }) }]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Mesaj gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleContactAction = (action?: string) => {
    if (action) {
      Linking.openURL(action);
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
        <Text style={styles.headerTitle}>İletişim</Text>
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
          {/* Contact Info Cards */}
          <View style={styles.contactInfoContainer}>
            {contactInfo.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.contactCard}
                onPress={() => handleContactAction(item.action)}
                disabled={!item.action}
                activeOpacity={item.action ? 0.7 : 1}
              >
                <View style={styles.contactIcon}>
                  <Text style={styles.contactEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactLabel}>{item.label}</Text>
                  <Text style={[styles.contactValue, item.action && styles.contactValueLink]}>
                    {item.value}
                  </Text>
                </View>
                {item.action && <Text style={styles.linkArrow}>→</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Bize Ulaşın</Text>
            <Text style={styles.formSubtitle}>
              Sorularınız veya önerileriniz için bize mesaj gönderin
            </Text>

            <CustomInput
              label="Ad Soyad"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Adınız Soyadınız"
              autoCapitalize="words"
              error={errors.name}
              required
            />

            <CustomInput
              label="E-posta"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
            />

            <CustomInput
              label="Konu"
              value={formData.subject}
              onChangeText={(text) => updateField('subject', text)}
              placeholder="Mesajınızın konusu"
              error={errors.subject}
              required
            />

            <CustomInput
              label="Mesaj"
              value={formData.message}
              onChangeText={(text) => updateField('message', text)}
              placeholder="Mesajınızı buraya yazın..."
              multiline
              numberOfLines={5}
              error={errors.message}
              required
            />

            <CustomButton
              title="Mesaj Gönder"
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
  contactInfoContainer: {
    marginBottom: SPACING.lg,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  contactEmoji: {
    fontSize: 20,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  contactValueLink: {
    color: COLORS.primary,
  },
  linkArrow: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.sm,
  },
  formTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
});
