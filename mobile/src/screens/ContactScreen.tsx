// Contact Screen - Redesigned to match front web design
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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type ContactScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const contactInfo = [
  { 
    id: '1', 
    icon: 'phone' as const, 
    label: 'Telefon', 
    value: '+90 535 978 69 42', 
    action: 'tel:+905359786942',
    colors: ['#2563eb', '#1d4ed8'] as [string, string],
  },
  { 
    id: '2', 
    icon: 'mail' as const, 
    label: 'E-posta', 
    value: 'tdvskonya42@gmail.com', 
    action: 'mailto:tdvskonya42@gmail.com',
    colors: ['#4f46e5', '#4338ca'] as [string, string],
  },
  { 
    id: '3', 
    icon: 'map-pin' as const, 
    label: 'Adres', 
    value: 'Ferhuniye Mah. Dr Ziya Paşa Sok. Dışkapı No:4 Kat:2 No:106 Selçuklu/Konya',
    colors: ['#0891b2', '#0e7490'] as [string, string],
  },
  { 
    id: '4', 
    icon: 'clock' as const, 
    label: 'Çalışma Saatleri', 
    value: 'Pazartesi - Cuma: 08:00 - 17:00',
    colors: ['#2563eb', '#1d4ed8'] as [string, string],
  },
];

export const ContactScreen: React.FC<ContactScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });
      Alert.alert(
        'Başarılı',
        'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
        [{ text: 'Tamam', onPress: () => setFormData({ name: '', email: '', phone: '', subject: '', message: '' }) }]
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
      {/* Gradient Header */}
      <LinearGradient
        colors={['#1d4ed8', '#1e40af']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bize Ulaşın</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Section with Title */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>İletişime Geçin</Text>
            <Text style={styles.sectionSubtitle}>
              Sorularınız, önerileriniz veya görüşleriniz için bizimle iletişime geçebilirsiniz.
            </Text>
            
            {/* Contact Info Cards */}
            <View style={styles.contactInfoContainer}>
              {contactInfo.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.contactCard}
                  onPress={() => handleContactAction(item.action)}
                  disabled={!item.action}
                  activeOpacity={item.action ? 0.9 : 1}
                >
                  <LinearGradient
                    colors={item.colors}
                    style={styles.contactIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Feather name={item.icon} size={18} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.contactContent}>
                    <Text style={styles.contactLabel}>{item.label}</Text>
                    <Text style={[styles.contactValue, item.action ? styles.contactValueLink : undefined]} numberOfLines={2}>
                      {item.value}
                    </Text>
                  </View>
                  {item.action && <Feather name="chevron-right" size={18} color="#94a3b8" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Feather name="send" size={20} color="#2563eb" style={{ marginRight: 8 }} />
              <Text style={styles.formTitle}>Mesaj Gönderin</Text>
            </View>
            <Text style={styles.formSubtitle}>
              Tüm alanları doldurarak bize ulaşabilirsiniz
            </Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ad Soyad <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputContainer, errors.name ? styles.inputError : undefined]}>
                <Feather name="user" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Ali Veli Yılmaz"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                />
              </View>
              <Text style={styles.hintText}>Adınızı ve soyadınızı eksiksiz yazın</Text>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-posta <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputContainer, errors.email ? styles.inputError : undefined]}>
                <Feather name="mail" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Örn: isminiz@gmail.com"
                  placeholderTextColor="#94a3b8"
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.hintText}>Size cevap yazabilmemiz için e-posta adresiniz gerekli</Text>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon (Zorunlu değil)</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 0532 123 45 67"
                  placeholderTextColor="#94a3b8"
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.hintText}>İsterseniz cep telefonu numaranızı da yazabilirsiniz</Text>
            </View>

            {/* Subject Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konu <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputContainer, errors.subject ? styles.inputError : undefined]}>
                <Feather name="file-text" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Üyelik hakkında, Soru, Öneri"
                  placeholderTextColor="#94a3b8"
                  value={formData.subject}
                  onChangeText={(text) => updateField('subject', text)}
                />
              </View>
              <Text style={styles.hintText}>Mesajınızın konusunu kısaca yazın</Text>
              {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mesaj <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputContainer, styles.textareaContainer, errors.message ? styles.inputError : undefined]}>
                <Feather name="message-square" size={18} color="#64748b" style={styles.textareaIcon} />
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Mesajınızı buraya yazın..."
                  placeholderTextColor="#94a3b8"
                  value={formData.message}
                  onChangeText={(text) => updateField('message', text)}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.hintText}>Soru, öneri veya şikayetinizi ayrıntılı olarak yazın</Text>
              {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Feather name="loader" size={20} color="#ffffff" />
                ) : (
                  <>
                    <Feather name="send" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Mesaj Gönder</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  contactInfoContainer: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  contactValueLink: {
    color: '#2563eb',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
  },
  textareaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textareaIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 14,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 0,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  hintText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
