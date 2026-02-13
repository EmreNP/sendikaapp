// Main App Entry Point
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// react-native-render-html kütüphanesinin iç yapısında defaultProps kullanılıyor.
// Bu React 18.2+ ile uyarı veriyor ama kütüphane henüz güncellenmedi.
// Kütüphane güncellenene kadar bu uyarıları gizliyoruz.
LogBox.ignoreLogs([
  'Support for defaultProps will be removed from memo components',
  'Support for defaultProps will be removed from function components',
  'Support for defaultProps will be removed',
  'You seem to update the renderersProps prop',
]);

// React 18.2+'da defaultProps uyarıları console.error üzerinden gönderiliyor.
// LogBox.ignoreLogs yalnızca console.warn'ı bastırdığı için console.error'u da
// filtrelememiz gerekiyor. Sadece bu spesifik uyarı bastırılıyor, gerçek hatalar geçiyor.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (message.includes('Support for defaultProps will be removed')) {
    return;
  }
  originalConsoleError(...args);
};
import { AuthProvider } from './src/context/AuthContext';
import { NotificationBadgeProvider } from './src/context/NotificationBadgeContext';
import { AppNavigator } from './src/navigation';
import { UpdateModal } from './src/components/UpdateModal';
import { checkForUpdate, UpdateCheckResult } from './src/services/updateChecker';

// Uygulama yüklenene kadar splash screen'i göster
SplashScreen.preventAutoHideAsync().catch(() => {
  // Hata olursa sessizce devam et
});

export default function App() {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // Uygulama açıldığında güncelleme kontrolü yap
    const checkUpdate = async () => {
      try {
        const result = await checkForUpdate();
        if (result.needsUpdate || result.isMaintenance) {
          setUpdateInfo(result);
          setShowUpdateModal(true);
        }
      } catch (error) {
        // Güncelleme kontrolü başarısız olursa sessizce devam et
        console.warn('Güncelleme kontrolü hatası:', error);
      }
    };

    checkUpdate();
  }, []);

  const handleDismissUpdate = () => {
    // Sadece önerilen güncellemeler kapatılabilir (zorunlu olanlar kapatılamaz)
    if (updateInfo && !updateInfo.isForceUpdate && !updateInfo.isMaintenance) {
      setShowUpdateModal(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationBadgeProvider>
            <StatusBar style="auto" />
            <AppNavigator />
            {updateInfo && (
              <UpdateModal
                visible={showUpdateModal}
                updateInfo={updateInfo}
                onDismiss={!updateInfo.isForceUpdate && !updateInfo.isMaintenance ? handleDismissUpdate : undefined}
              />
            )}
          </NotificationBadgeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
