import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '../utils/logger';
import { useSecureScreen } from '../hooks/useSecureScreen';

export const LegalAcceptanceScreen: React.FC = () => {
  useSecureScreen();
  const navigation = useNavigation<any>();
  const { acceptLegalTerms, logout } = useAuth();
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = kvkkAccepted && termsAccepted;

  const handleAccept = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      if (acceptLegalTerms) {
        await acceptLegalTerms();
      } else {
        // Fallback for transition period if function not updated yet
        // In AuthContext this will update both.
        // We will rename acceptKvkk to acceptLegalTerms in AuthContext later.
      }
    } catch (error) {
      logger.error('Error accepting legal terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="shield" size={64} color="#4338ca" />
        </View>
        
        <Text style={styles.title}>Yasal Metin Onayı</Text>
        
        <Text style={styles.description}>
          Uygulamamızı kullanmaya devam etmek için yasal metinleri onaylamanız gerekmektedir.
        </Text>
        
        <View style={styles.checkboxesWrapper}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setKvkkAccepted(!kvkkAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, kvkkAccepted && styles.checkboxChecked]}>
              {kvkkAccepted && <Feather name="check" size={16} color="#ffffff" />}
            </View>
            <Text style={styles.checkboxText}>
              <Text 
                style={styles.linkTextInline} 
                onPress={() => navigation.navigate('Kvkk')}
              >Gizlilik Politikası ve KVKK Aydınlatma Metni</Text>'ni okudum ve kabul ediyorum.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Feather name="check" size={16} color="#ffffff" />}
            </View>
            <Text style={styles.checkboxText}>
              <Text 
                style={styles.linkTextInline} 
                onPress={() => navigation.navigate('Terms')}
              >Kullanım Koşulları</Text>'nı okudum ve kabul ediyorum.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!canSubmit || loading}
        >
          <LinearGradient
            colors={canSubmit ? ['#4338ca', '#1e40af'] : ['#94a3b8', '#64748b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Kabul Et ve Devam Et</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Text style={styles.logoutText}>Vazgeç ve Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    marginBottom: 32,
  },
  linkIcon: {
    marginRight: 8,
  },
  linkText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 15,
  },
  checkboxesWrapper: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  linkTextInline: {
    color: '#4338ca',
    fontWeight: '600',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
});
