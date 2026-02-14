// Contact Screen - Redesigned to match front web design
import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Topic = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

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
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    topicId: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoadingTopics(true);
      const topicsData = await ApiService.getTopics();
      const activeTopics = topicsData.filter((t: Topic) => t.isActive);
      setTopics(activeTopics);
      
      if (activeTopics.length === 0) {
        Alert.alert(
          'Bilgi', 
          'Şu anda aktif konu bulunmamaktadır. Lütfen daha sonra tekrar deneyin.'
        );
      }
    } catch (error: any) {
      console.error('Topics yüklenemedi:', error);
      Alert.alert(
        'Hata', 
        error?.message || 'Konular yüklenemedi. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.'
      );
    } finally {
      setLoadingTopics(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.topicId) {
      newErrors.topicId = 'Konu seçimi gereklidir';
      valid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Mesajınız gereklidir';
      valid = false;
    } else if (formData.message.length < 10) {
      newErrors.message = 'Mesaj en az 10 karakter olmalıdır';
      valid = false;
    } else if (formData.message.length > 5000) {
      newErrors.message = 'Mesaj en fazla 5000 karakter olabilir';
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
        topicId: formData.topicId,
        message: formData.message,
      });
      Alert.alert(
        'Başarılı',
        'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
        [{ text: 'Tamam', onPress: () => setFormData({ topicId: '', message: '' }) }]
      );
    } catch (error: any) {
      console.error('Contact message error:', error);

      Alert.alert(
        'Hata', 
        getUserFriendlyErrorMessage(error, 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.')
      );
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
              Mesajınızı göndermek için konu seçip mesajınızı yazın
            </Text>

            {loadingTopics ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Konular yükleniyor...</Text>
              </View>
            ) : (
              <>
                {/* Topic Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Konu <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={[styles.inputContainer, styles.pickerContainer, errors.topicId ? styles.inputError : undefined]}
                    onPress={() => setShowTopicPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="bookmark" size={18} color="#64748b" style={styles.inputIcon} />
                    <Text style={[styles.pickerText, !formData.topicId && styles.pickerPlaceholder]}>
                      {formData.topicId 
                        ? topics.find(t => t.id === formData.topicId)?.name 
                        : 'Konu seçiniz'}
                    </Text>
                    <Feather name="chevron-down" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <Text style={styles.hintText}>Mesajınızın konusunu seçin</Text>
                  {errors.topicId && <Text style={styles.errorText}>{errors.topicId}</Text>}
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
                      onChangeText={(text) => {
                        setFormData({ ...formData, message: text });
                        setErrors({ ...errors, message: '' });
                      }}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      maxLength={5000}
                    />
                  </View>
                  <Text style={styles.hintText}>
                    {formData.message.length}/5000 karakter
                  </Text>
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
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Feather name="send" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.submitButtonText}>Mesaj Gönder</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Topic Picker Modal */}
      <Modal
        visible={showTopicPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTopicPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Konu Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowTopicPicker(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicOption,
                    formData.topicId === topic.id && styles.topicOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, topicId: topic.id });
                    setErrors({ ...errors, topicId: '' });
                    setShowTopicPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicOptionContent}>
                    <Text style={[
                      styles.topicOptionName,
                      formData.topicId === topic.id && styles.topicOptionNameSelected
                    ]}>
                      {topic.name}
                    </Text>
                    {topic.description && (
                      <Text style={styles.topicOptionDescription}>
                        {topic.description}
                      </Text>
                    )}
                  </View>
                  {formData.topicId === topic.id && (
                    <Feather name="check-circle" size={22} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  pickerContainer: {
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  pickerPlaceholder: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  topicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginTop: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topicOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  topicOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  topicOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  topicOptionNameSelected: {
    color: '#2563eb',
  },
  topicOptionDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
});
