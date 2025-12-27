import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusCard } from '../components/StatusCard';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type StatusScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Status'>;
};

export const StatusScreen: React.FC<StatusScreenProps> = ({ navigation }) => {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const getStatusInfo = () => {
    if (!user) return null;

    switch (user.status) {
      case 'pending_details':
        return {
          title: 'Kayıt Tamamlanmadı',
          description: 'Lütfen kayıt bilgilerinizi tamamlayın.',
          action: () => navigation.navigate('RegisterDetails'),
          actionText: 'Kaydı Tamamla',
        };
      case 'pending_branch_review':
        return {
          title: 'Şube Onayı Bekleniyor',
          description: 'Başvurunuz şube yöneticiniz tarafından değerlendiriliyor.',
          action: null,
          actionText: null,
        };
      case 'pending_admin_approval':
        return {
          title: 'Yönetici Onayı Bekleniyor',
          description: 'Başvurunuz sistem yöneticisi tarafından değerlendiriliyor.',
          action: null,
          actionText: null,
        };
      case 'active':
        return {
          title: 'Aktif Üye',
          description: 'Üyeliğiniz aktif durumda.',
          action: null,
          actionText: null,
        };
      case 'rejected':
        return {
          title: 'Başvuru Reddedildi',
          description: 'Başvurunuz reddedildi. Daha fazla bilgi için şubenizle iletişime geçin.',
          action: null,
          actionText: null,
        };
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Kullanıcı bilgileri yükleniyor...</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.white}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>📋 Başvuru Durumu</Text>
          
          <StatusCard status={user.status} />

          {statusInfo?.action && (
            <CustomButton
              title={statusInfo.actionText!}
              onPress={statusInfo.action}
              style={styles.actionButton}
            />
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>👤 Kişisel Bilgiler</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ad Soyad:</Text>
              <Text style={styles.infoValue}>
                {user.firstName} {user.lastName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-posta:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            {user.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefon:</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}

            {user.tcKimlikNo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TC Kimlik No:</Text>
                <Text style={styles.infoValue}>{user.tcKimlikNo}</Text>
              </View>
            )}

            {user.education && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Eğitim:</Text>
                <Text style={styles.infoValue}>{user.education}</Text>
              </View>
            )}

            {user.city && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Şehir:</Text>
                <Text style={styles.infoValue}>{user.city}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  greeting: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionButton: {
    marginTop: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    fontWeight: '600',
  },
});

