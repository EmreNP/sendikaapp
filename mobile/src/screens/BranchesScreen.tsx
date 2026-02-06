// Branches Screen - Branch List
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
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
      activeOpacity={0.7}
    >
      <View style={styles.branchHeader}>
        <View style={styles.branchIcon}>
          <Text style={styles.branchEmoji}>🏢</Text>
        </View>
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              {item.city || 'Konum belirtilmemiş'}
            </Text>
          </View>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </View>
      
      <View style={styles.branchDetails}>
        {item.phone && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📞</Text>
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>✉️</Text>
            <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
          </View>
        )}
      </View>

      {item.memberCount !== undefined && (
        <View style={styles.memberBadge}>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Şubeler</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Şubeler</Text>
        <Text style={styles.headerSubtitle}>{branches.length} şube mevcut</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Şube veya şehir ara..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredBranches}
        renderItem={renderBranchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Sonuç Bulunamadı' : 'Henüz Şube Yok'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Farklı bir arama terimi deneyin.'
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
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    ...SHADOW.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  listContent: {
    padding: SPACING.lg,
  },
  branchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  branchEmoji: {
    fontSize: 24,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  arrowIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  branchDetails: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  memberBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  memberBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
