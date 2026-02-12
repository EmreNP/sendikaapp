// Pending Approval Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const PendingApprovalScreen: React.FC = () => {
  const { logout, refreshUser } = useAuth();

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#312e81', '#4338ca']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconInner}>
              <Feather name="clock" size={56} color="#f59e0b" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Onay Bekleniyor</Text>
          <Text style={styles.subtitle}>
            Üyelik başvurunuz yönetici onayı bekliyor
          </Text>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Ne Yapmalısınız?</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Feather name="check-circle" size={18} color="#22c55e" />
              </View>
              <Text style={styles.infoText}>
                Başvurunuz başarıyla alındı ve inceleme sürecinde
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Feather name="mail" size={18} color="#4338ca" />
              </View>
              <Text style={styles.infoText}>
                Onay durumunuz hakkında e-posta ile bilgilendirileceksiniz
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Feather name="clock" size={18} color="#f59e0b" />
              </View>
              <Text style={styles.infoText}>
                Onay süreci genellikle 1-3 iş günü içinde tamamlanır
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={20} color="#4338ca" />
              <Text style={styles.refreshButtonText}>Durumu Kontrol Et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#ffffff" />
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338ca',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
