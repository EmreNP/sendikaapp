/**
 * useSecureScreen — Hassas ekranlarda ekran görüntüsü ve kayıt koruması.
 *
 * TC Kimlik No, kişisel veri vb. gösteren ekranlarda kullanılır.
 * Ekran açılınca koruma başlar, kapanınca otomatik biter.
 *
 * Kullanım:
 *   import { useSecureScreen } from '../hooks/useSecureScreen';
 *   // Component içinde:
 *   useSecureScreen();
 */
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenCapture from 'expo-screen-capture';

export function useSecureScreen(): void {
  useFocusEffect(
    useCallback(() => {
      // Ekran açıldığında screenshot/screen recording'i engelle
      ScreenCapture.preventScreenCaptureAsync();

      return () => {
        // Ekrandan çıkılınca korumayı kaldır
        ScreenCapture.allowScreenCaptureAsync();
      };
    }, [])
  );
}

export default useSecureScreen;
