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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
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
      const foundBranch = await ApiService.getBranch(branchId);
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
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      </SafeAreaView>
    );
  }

  if (!branch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorText}>Şube bulunamadı</Text>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#4338ca', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backButtonGradient}
            >
              <Feather name="arrow-left" size={18} color="#ffffff" />
              <Text style={styles.backButtonTextError}>Geri Dön</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#312e81', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şube Detayı</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branch Card */}
        <View style={styles.branchCard}>
          <LinearGradient
            colors={['#4338ca', '#1e40af']}
            style={styles.branchIcon}
          >
            <Feather name="briefcase" size={32} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.branchName}>{branch.name}</Text>
          {branch.city && (
            <View style={styles.locationBadge}>
              <Feather name="map-pin" size={14} color="#4338ca" />
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
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.actionIconContainer}
              >
                <Feather name="phone" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.actionText}>Ara</Text>
            </TouchableOpacity>
          )}
          {branch.email && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4338ca', '#1e40af']}
                style={styles.actionIconContainer}
              >
                <Feather name="mail" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.actionText}>E-posta</Text>
            </TouchableOpacity>
          )}
          {branch.address && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMap}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.actionIconContainer}
              >
                <Feather name="map" size={20} color="#ffffff" />
              </LinearGradient>
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
                <Feather name="phone" size={18} color="#4338ca" />
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
                <Feather name="mail" size={18} color="#4338ca" />
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
                <Feather name="map-pin" size={18} color="#4338ca" />
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
              <LinearGradient
                colors={['rgba(67, 56, 202, 0.1)', 'rgba(30, 64, 175, 0.1)']}
                style={styles.statItem}
              >
                <Feather name="users" size={24} color="#4338ca" />
                <Text style={styles.statValue}>{branch.memberCount}</Text>
                <Text style={styles.statLabel}>Toplam Üye</Text>
              </LinearGradient>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 32,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 24,
  },
  backButtonError: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  backButtonTextError: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerGradient: {
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  branchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  branchIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  branchName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#4338ca',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4338ca',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
});
