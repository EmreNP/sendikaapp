/**
 * UpdateModal - Güncelleme ve Bakım Modalı
 * 
 * Zorunlu güncelleme, önerilen güncelleme ve bakım modu
 * durumlarını kullanıcıya gösteren modal bileşeni.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import type { UpdateCheckResult } from '../services/updateChecker';
import { openStoreForUpdate } from '../services/updateChecker';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateCheckResult;
  onDismiss?: () => void;
}

const { width } = Dimensions.get('window');

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateInfo,
  onDismiss,
}) => {
  const { isForceUpdate, isMaintenance, currentVersion, latestVersion, maintenanceMessage, updateUrl } = updateInfo;

  const handleUpdate = () => {
    openStoreForUpdate(updateUrl);
  };

  // Bakım modu
  if (isMaintenance) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.iconContainer}
            >
              <Feather name="tool" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Bakım Modu</Text>
            <Text style={styles.message}>
              {maintenanceMessage || 'Uygulama şu anda bakımdadır. Lütfen daha sonra tekrar deneyin.'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Zorunlu güncelleme
  if (isForceUpdate) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <LinearGradient
              colors={['#dc2626', '#b91c1c']}
              style={styles.iconContainer}
            >
              <Feather name="alert-triangle" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Güncelleme Gerekli</Text>
            <Text style={styles.message}>
              Uygulamayı kullanmaya devam etmek için güncelleyin.
            </Text>
            <Text style={styles.versionText}>
              Mevcut: v{currentVersion}  →  Yeni: v{latestVersion}
            </Text>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <LinearGradient
                colors={['#4338ca', '#3730a3']}
                style={styles.buttonGradient}
              >
                <Feather name="download" size={18} color="#fff" />
                <Text style={styles.buttonText}>Güncelle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Önerilen güncelleme
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#4338ca', '#3730a3']}
            style={styles.iconContainer}
          >
            <Feather name="gift" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Yeni Sürüm Mevcut</Text>
          <Text style={styles.message}>
            Daha iyi bir deneyim için uygulamayı güncelleyin.
          </Text>
          <Text style={styles.versionText}>
            Mevcut: v{currentVersion}  →  Yeni: v{latestVersion}
          </Text>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <LinearGradient
              colors={['#4338ca', '#3730a3']}
              style={styles.buttonGradient}
            >
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.buttonText}>Güncelle</Text>
            </LinearGradient>
          </TouchableOpacity>
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissText}>Daha Sonra</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width - 60,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  updateButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dismissText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
});
