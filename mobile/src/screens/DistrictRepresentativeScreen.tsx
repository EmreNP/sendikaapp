// District Representative Screen - Front/React Birebir Çevirisi
// front/src/components/DistrictRepresentativePage.tsx'den birebir
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type DistrictRepresentativeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DistrictRepresentative'>;

interface DistrictRepresentativeScreenProps {
  navigation: DistrictRepresentativeScreenNavigationProp;
}

export const DistrictRepresentativeScreen: React.FC<DistrictRepresentativeScreenProps> = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleFileUpload = (type: 'resignation' | 'membership') => {
    // Mock file upload
    Alert.alert('Başarılı', `${type === 'resignation' ? 'İstifa' : 'Üyelik'} formu başarıyla yüklendi`);
  };

  const handleImageUpload = () => {
    // Mock image upload
    const mockImage = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
    setImages([...images, mockImage]);
    Alert.alert('Başarılı', 'Fotoğraf eklendi');
  };

  const handleSubmitActivity = () => {
    if (!description && images.length === 0) {
      Alert.alert('Hata', 'Lütfen bir açıklama yazın veya fotoğraf ekleyin');
      return;
    }
    
    Alert.alert('Başarılı', 'Faaliyet başarıyla kaydedildi');
    setDescription('');
    setImages([]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Front: bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 */}
        <LinearGradient
          colors={['#1e3a8a', '#1e40af', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Decorative elements */}
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />

          {/* Back Button + Title */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>İlçe İşyeri Temsilcisi</Text>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Document Upload Section - Front birebir */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="file-text" size={20} color="#2563eb" />
              <Text style={styles.cardTitle}>Üye Kayıt Bildirimi</Text>
            </View>

            <View style={styles.uploadGrid}>
              {/* İstifa Formu Button */}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleFileUpload('resignation')}
                activeOpacity={0.7}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: '#fff7ed' }]}>
                  <Feather name="upload" size={24} color="#ea580c" />
                </View>
                <Text style={styles.uploadLabel}>İstifa Formu Yükle</Text>
                <Text style={styles.uploadSubLabel}>PDF veya Fotoğraf</Text>
              </TouchableOpacity>

              {/* Üyelik Formu Button */}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleFileUpload('membership')}
                activeOpacity={0.7}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: '#ecfdf5' }]}>
                  <Feather name="upload" size={24} color="#059669" />
                </View>
                <Text style={styles.uploadLabel}>Üyelik Formu Yükle</Text>
                <Text style={styles.uploadSubLabel}>PDF veya Fotoğraf</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity Log Section - Front birebir */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="image" size={20} color="#2563eb" />
              <Text style={styles.cardTitle}>Faaliyet Ekle</Text>
            </View>

            {/* Textarea */}
            <TextInput
              style={styles.textarea}
              placeholder="Faaliyet açıklaması yazınız..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <View style={styles.imageGrid}>
                {images.map((img, idx) => (
                  <View key={idx} style={styles.imagePreview}>
                    <Image source={{ uri: img }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(idx)}
                    >
                      <Feather name="x" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addPhotoBtn}
                onPress={handleImageUpload}
              >
                <Feather name="plus" size={20} color="#334155" />
                <Text style={styles.addPhotoText}>Fotoğraf Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSubmitActivity}
              >
                <Feather name="send" size={20} color="#ffffff" />
                <Text style={styles.saveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Front: bg-slate-50
  },
  // Header - Front birebir
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ translateY: -128 }, { translateX: 128 }],
  },
  headerDecor2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(96,165,250,0.1)',
    transform: [{ translateY: 96 }, { translateX: -96 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Content
  content: {
    padding: 16,
    gap: 24,
    paddingBottom: 100,
  },
  // Card - Front birebir
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // Upload Grid
  uploadGrid: {
    gap: 16,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  uploadSubLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  // Textarea
  textarea: {
    width: '100%',
    height: 128,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 16,
  },
  // Image Grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imagePreview: {
    width: (screenWidth - 32 - 48 - 16) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  addPhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
