// Rejected Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const RejectedScreen: React.FC = () => {
  const { logout } = useAuth();

  const handleContact = () => {
    Linking.openURL('mailto:info@sendika.com?subject=Üyelik%20Başvurusu%20Hakkında');
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
              <Feather name="x-circle" size={56} color="#ef4444" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Başvuru Reddedildi</Text>
          <Text style={styles.subtitle}>
            Üyelik başvurunuz maalesef onaylanmadı
          </Text>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Neden Reddedilmiş Olabilir?</Text>
            <View style={styles.infoItem}>
              <View style={styles.bulletContainer}>
                <Feather name="alert-circle" size={16} color="#ef4444" />
              </View>
              <Text style={styles.infoText}>
                Eksik veya hatalı bilgiler
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.bulletContainer}>
                <Feather name="alert-circle" size={16} color="#ef4444" />
              </View>
              <Text style={styles.infoText}>
                Üyelik kriterlerini karşılamama
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.bulletContainer}>
                <Feather name="alert-circle" size={16} color="#ef4444" />
              </View>
              <Text style={styles.infoText}>
                Belgelerinizle ilgili sorunlar
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactInfo}>
              <Feather name="help-circle" size={20} color="#4338ca" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>İtiraz Etmek İster misiniz?</Text>
                <Text style={styles.contactText}>
                  Daha fazla bilgi almak veya itirazda bulunmak için bizimle iletişime geçebilirsiniz.
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContact}
              activeOpacity={0.8}
            >
              <Feather name="mail" size={20} color="#4338ca" />
              <Text style={styles.contactButtonText}>İletişime Geç</Text>
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
    marginBottom: 12,
    alignItems: 'center',
  },
  bulletContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  contactButton: {
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
  contactButtonText: {
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
