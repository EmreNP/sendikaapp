import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import RenderHtml from 'react-native-render-html';
import { COLORS } from '../constants/theme';
import { logger } from '../utils/logger';
import { useSecureScreen } from '../hooks/useSecureScreen';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

const TermsScreen = () => {
  useSecureScreen();
  const navigation = useNavigation();
  const [data, setData] = useState<{ title?: string, lastUpdated?: string, content?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const result = await ApiService.getLegalTerms();
        setData(result);
      } catch (err) {
        logger.error('Terms fetch error:', err);
        setError('Kullanım koşulları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const tagsStyles = {
    p: { color: COLORS.textSecondary, lineHeight: 22, marginBottom: 12, fontSize: 14 },
    h2: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
    h3: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
    ul: { marginLeft: 0 },
    li: { color: COLORS.textSecondary, lineHeight: 22, fontSize: 14, marginBottom: 6 },
    strong: { color: COLORS.text, fontWeight: 'bold' }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {data?.title || 'Kullanım Koşulları'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : error || !data ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'İçerik bulunamadı'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{data.title}</Text>
            {data.lastUpdated && (
              <Text style={styles.date}>Son Güncelleme: {data.lastUpdated}</Text>
            )}
          </View>
          
          <RenderHtml
            contentWidth={width - 40}
            source={{ html: data.content || '' }}
            tagsStyles={tagsStyles as any}
            baseStyle={styles.baseContent}
          />
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: COLORS.background },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 16 },
  errorText: { marginTop: 12, color: COLORS.error, fontSize: 16, textAlign: 'center' },
  retryButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  contentContainer: { padding: 20 },
  titleContainer: { marginBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  date: { fontSize: 13, color: COLORS.textSecondary },
  baseContent: { fontSize: 14, color: COLORS.textSecondary },
  bottomPadding: { height: 40 }
});

export default TermsScreen;
