// Branch Detail Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, Branch } from '../types';

type BranchDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BranchDetail'>;
  route: RouteProp<RootStackParamList, 'BranchDetail'>;
};

export const BranchDetailScreen: React.FC<BranchDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { branchId } = route.params;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranchDetails();
  }, [branchId]);

  const fetchBranchDetails = async () => {
    try {
      const branches = await ApiService.getBranches();
      const foundBranch = branches.find((b: Branch) => b.id === branchId);
      setBranch(foundBranch || null);
    } catch (error) {
      console.error('Error fetching branch details:', error);
      Alert.alert('Hata', 'Şube detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (branch?.phone) {
      Linking.openURL(`tel:${branch.phone}`);
    }
  };

  const handleEmail = () => {
    if (branch?.email) {
      Linking.openURL(`mailto:${branch.email}`);
    }
  };

  const handleMap = () => {
    if (branch?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        branch.address
      )}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!branch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorText}>Şube bulunamadı</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şube Detayı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branch Card */}
        <View style={styles.branchCard}>
          <View style={styles.branchIcon}>
            <Text style={styles.branchEmoji}>🏢</Text>
          </View>
          <Text style={styles.branchName}>{branch.name}</Text>
          {branch.city && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{branch.city}</Text>
            </View>
          )}
        </View>

        {/* Contact Actions */}
        <View style={styles.actionsContainer}>
          {branch.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Ara</Text>
            </TouchableOpacity>
          )}
          {branch.email && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>✉️</Text>
              <Text style={styles.actionText}>E-posta</Text>
            </TouchableOpacity>
          )}
          {branch.address && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMap}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={styles.actionText}>Harita</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          
          {branch.phone && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>📞</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{branch.phone}</Text>
              </View>
            </View>
          )}

          {branch.email && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>✉️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>E-posta</Text>
                <Text style={styles.infoValue}>{branch.email}</Text>
              </View>
            </View>
          )}

          {branch.address && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>📍</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adres</Text>
                <Text style={styles.infoValue}>{branch.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Section */}
        {branch.memberCount !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İstatistikler</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{branch.memberCount}</Text>
                <Text style={styles.statLabel}>Toplam Üye</Text>
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        {branch.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.description}>{branch.description}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textWhite,
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
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  branchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  branchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  branchEmoji: {
    fontSize: 36,
  },
  branchName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.xs,
    minWidth: 80,
    ...SHADOW.sm,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  infoEmoji: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
