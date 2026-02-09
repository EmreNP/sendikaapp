// Branches Screen - Branch List - Redesigned to match front web design
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, Branch } from '../types';

type BranchesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Branches'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type BranchesScreenProps = {
  navigation: BranchesScreenNavigationProp;
};

export const BranchesScreen: React.FC<BranchesScreenProps> = ({ navigation }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBranches(branches);
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBranches(filtered);
    }
  }, [searchQuery, branches]);

  const fetchBranches = async () => {
    try {
      const data = await ApiService.getBranches();
      setBranches(data);
      setFilteredBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBranches();
    setRefreshing(false);
  };

  const renderBranchItem = ({ item }: { item: Branch }) => (
    <TouchableOpacity
      style={styles.branchCard}
      onPress={() => navigation.navigate('BranchDetail', { branchId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.branchHeader}>
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.branchIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="home" size={24} color="#ffffff" />
        </LinearGradient>
        <View style={styles.branchInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.branchName}>{item.name}</Text>
            {(item as any).isMainBranch && (
              <View style={styles.mainBadge}>
                <Feather name="star" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.mainBadgeText}>Merkez</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="#64748b" />
            <Text style={styles.locationText}>
              {item.district || item.city || 'Konum belirtilmemiş'}
            </Text>
          </View>
        </View>
        <Feather name="navigation" size={18} color="#94a3b8" />
      </View>
      
      <View style={styles.branchDetails}>
        {item.phone && (
          <View style={styles.detailItem}>
            <Feather name="phone" size={14} color="#64748b" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.detailItem}>
            <Feather name="mail" size={14} color="#64748b" />
            <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
          </View>
        )}
      </View>

      {item.memberCount !== undefined && (
        <View style={styles.memberBadge}>
          <Feather name="users" size={12} color="#059669" style={{ marginRight: 4 }} />
          <Text style={styles.memberBadgeText}>
            {item.memberCount} Üye
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.headerTitle}>Şubelerimiz</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Şubeler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Şubelerimiz</Text>
        <Text style={styles.headerSubtitle}>{branches.length} şube ve temsilcilik</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Şube veya ilçe ara..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={filteredBranches}
        renderItem={renderBranchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="map-pin" size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Sonuç Bulunamadı' : 'Henüz Şube Yok'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aradığınız kriterlere uygun şube bulunamadı.'
                : 'Şubeler eklendiğinde burada görünecektir.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(219, 234, 254, 1)',
    marginTop: 4,
    marginBottom: 16,
  },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
  },
  branchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  branchDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    marginLeft: 8,
  },
  memberBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 253, 245, 1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
