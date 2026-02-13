// Partner Institutions Screen - API ile Çalışan Versiyon
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, ContractedInstitution, InstitutionCategory } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type PartnerInstitutionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PartnerInstitutions'>;

interface PartnerInstitutionsScreenProps {
  navigation: PartnerInstitutionsScreenNavigationProp;
}

export const PartnerInstitutionsScreen: React.FC<PartnerInstitutionsScreenProps> = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [institutions, setInstitutions] = useState<ContractedInstitution[]>([]);
  const [categories, setCategories] = useState<InstitutionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_LIMIT = 25;

  useEffect(() => {
    fetchCategories();
    fetchInstitutions();
  }, []);

  useEffect(() => {
    // Kategori değiştiğinde yeniden yükle
    if (!loading) {
      setPage(1);
      fetchInstitutions(1);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const data = await ApiService.getInstitutionCategories();
      setCategories(data);
    } catch (error) {
      logger.error('Error fetching categories:', error);
    }
  };

  const fetchInstitutions = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setErrorMessage(null);
      const categoryId = selectedCategory !== 'Tümü' && categories.length > 0
        ? categories.find(c => c.name === selectedCategory)?.id 
        : undefined;
      
      const { items, total, hasMore: more } = await ApiService.getContractedInstitutions({ 
        page: pageNum, 
        limit: PAGE_LIMIT,
        categoryId 
      });
      
      if (pageNum === 1) {
        setInstitutions(items);
      } else {
        setInstitutions(prev => [...prev, ...items]);
      }
      setHasMore(more);
      setPage(pageNum);
    } catch (error) {
      logger.error('Error fetching institutions:', error);
      if (pageNum === 1) {
        setErrorMessage(getUserFriendlyErrorMessage(error, 'Anlaşmalı kurumlar yüklenemedi.'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInstitutions(1);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !searchTerm.trim()) {
      setLoadingMore(true);
      fetchInstitutions(page + 1);
    }
  }, [loadingMore, hasMore, searchTerm, page]);

  const allCategories = useMemo(() => ['Tümü', ...categories.map(c => c.name)], [categories]);

  const filteredInstitutions = useMemo(() => {
    if (!searchTerm.trim()) return institutions;
    
    const searchLower = searchTerm.toLowerCase();
    return institutions.filter(inst =>
      inst.title.toLowerCase().includes(searchLower) ||
      inst.description.toLowerCase().includes(searchLower) ||
      inst.categoryName?.toLowerCase().includes(searchLower)
    );
  }, [institutions, searchTerm]);

  const handleInstitutionSelect = useCallback((institution: ContractedInstitution) => {
    try {
      // categoryName backend'den gelmeyebilir, categories state'inden eşleştir
      const enriched = { ...institution };
      if (!enriched.categoryName && enriched.categoryId && categories.length > 0) {
        const cat = categories.find(c => c.id === enriched.categoryId);
        if (cat) enriched.categoryName = cat.name;
      }
      navigation.navigate('PartnerDetail' as never, { institution: enriched } as never);
    } catch (error) {
      logger.error('Navigation error:', error);
    }
  }, [categories, navigation]);

  const renderInstitutionItem = useCallback(({ item }: { item: ContractedInstitution }) => {
    // categoryName backend'den gelmeyebilir, categories state'inden eşleştir
    // Güvenli erişim: categories boş olabilir
    let categoryName = '';
    if (item.categoryName) {
      categoryName = item.categoryName;
    } else if (item.categoryId && categories.length > 0) {
      categoryName = categories.find(c => c.id === item.categoryId)?.name || '';
    }

    return (
      <TouchableOpacity
        style={styles.partnerCard}
        onPress={() => handleInstitutionSelect(item)}
        activeOpacity={0.95}
      >
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.coverImageUrl || item.logoUrl }}
            style={styles.partnerImage}
            contentFit="cover"
          />
          {/* Discount Badge */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.badgeText}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Category Badge */}
          {categoryName ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>
          ) : null}

          {/* Name */}
          <Text style={styles.partnerName}>{item.title}</Text>

          {/* Description */}
          <Text style={styles.partnerDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [categories, handleInstitutionSelect]);

  const keyExtractor = useCallback((item: ContractedInstitution) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#1e3a8a', '#1e40af', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Anlaşmalı Kurumlar</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Anlaşmalı Kurumlar</Text>
        </View>

        {/* Search Bar - Front birebir */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#bfdbfe" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kurum ara..."
            placeholderTextColor="#bfdbfe"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Feather name="x" size={18} color="#bfdbfe" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Main Content - overlapping header */}
      <View style={styles.mainContent}>
        {/* Categories - Front: flex gap-2 overflow-x-auto */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {allCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Partners Grid - FlatList */}
        <FlatList
          data={filteredInstitutions}
          renderItem={renderInstitutionItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={5}
          onEndReached={searchTerm.trim() === '' ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e3a8a']} />
          }
          ListFooterComponent={
            searchTerm.trim() === '' && hasMore ? (
              <View style={styles.footerContainer}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#1e3a8a" />
                ) : (
                  <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton} activeOpacity={0.7}>
                    <Feather name="plus-circle" size={18} color="#1e3a8a" style={{ marginRight: 8 }} />
                    <Text style={styles.loadMoreText}>Daha Fazla Yükle</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name={errorMessage ? 'alert-circle' : 'briefcase'} size={32} color={errorMessage ? '#ef4444' : '#94a3b8'} />
              </View>
              <Text style={styles.emptyTitle}>
                {errorMessage ? 'Bir Hata Oluştu' : searchTerm ? 'Sonuç Bulunamadı' : 'Henüz Anlaşmalı Kurum Yok'}
              </Text>
              {errorMessage ? <Text style={styles.emptyText}>{errorMessage}</Text> : null}
              <Text style={styles.emptyText}>
                {errorMessage ? 'Lütfen tekrar deneyin.' : (searchTerm ? 'Arama kriterlerine uygun kurum bulunamadı.' : 'Yeni kurumlar eklendiğinde burada görünecektir.')}
              </Text>
              {errorMessage && (
                <TouchableOpacity onPress={onRefresh} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#1e3a8a', borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Tekrar Dene</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
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
    paddingBottom: 96, // Extra space for overlap
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -24,
    left: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(96,165,250,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Search - Front birebir
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  // Main Content - overlapping header
  mainContent: {
    flex: 1,
    marginTop: -64,
    paddingHorizontal: 16,
  },
  // Categories - Sabit yükseklikte yatay scroll
  categoriesScroll: {
    flexGrow: 0,
    marginBottom: 16,
    maxHeight: 52,
  },
  categoriesContent: {
    alignItems: 'center',
    paddingRight: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginRight: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Partners Grid/FlatList
  flatListContent: {
    paddingBottom: 100,
  },
  partnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    margin: 8,
    marginBottom: 0,
    position: 'relative',
  },
  partnerImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  partnerDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Footer/Pagination
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(30, 58, 138, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 138, 0.15)',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },
});
