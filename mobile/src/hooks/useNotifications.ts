// useNotifications Hook
// FCM token yönetimi, push bildirim dinleme ve deep linking
import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
  getStoredToken,
  clearStoredToken,
  getDeviceType,
  listenForTokenRefresh,
  isExpoGo,
} from '../services/notificationService';
import apiService from '../services/api';
import { logger } from '../utils/logger';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Push bildirim sistemi hook'u
 * - FCM token alır ve backend'e kaydeder
 * - Ön plan / arka plan bildirimlerini dinler
 * - Bildirime tıklanınca ilgili sayfaya yönlendirir
 * - Logout'ta token'ı deaktive eder
 */
export function useNotifications(isAuthenticated: boolean) {
  const navigation = useNavigation<NavigationProp>();
  const notificationListener = useRef<EventSubscription | undefined>(undefined);
  const responseListener = useRef<EventSubscription | undefined>(undefined);
  const tokenRefreshListener = useRef<EventSubscription | undefined>(undefined);

  // Token'ı backend'e kaydet
  const registerToken = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await apiService.registerPushToken(token, getDeviceType());
        logger.log('✅ Push token backend\'e kaydedildi');
      }
    } catch (error) {
      logger.warn('Push token kaydedilemedi:', error);
    }
  }, []);

  // Token'ı backend'den deaktive et
  const deactivateToken = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (token) {
        await apiService.deactivatePushToken(token);
        await clearStoredToken();
        logger.log('✅ Push token deaktive edildi');
      }
    } catch (error) {
      logger.warn('Push token deaktive edilemedi:', error);
    }
  }, []);

  // Bildirime tıklanınca deep link ile yönlendirme
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      if (!data) return;

      const { type, contentId } = data as { type?: string; contentId?: string };

      try {
        if (type === 'news' && contentId) {
          navigation.navigate('NewsDetail', { newsId: contentId });
        } else if (type === 'announcement') {
          navigation.navigate('AllAnnouncements');
        } else {
          // Genel bildirim — bildirimler ekranına git
          navigation.navigate('Notifications');
        }
      } catch (error) {
        logger.warn('Bildirim yönlendirme hatası:', error);
      }
    },
    [navigation]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    // Expo Go'da push bildirimler SDK 53+ itibarıyla desteklenmiyor
    // Tüm bildirim kurulumunu atla
    if (isExpoGo()) {
      return;
    }

    // 1. Bildirim handler'ını yapılandır (foreground davranışı)
    configureNotificationHandler();

    // 2. Token al ve kaydet
    registerToken();

    // 3. Foreground: bildirim geldiğinde (opsiyonel loglama)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.log('📩 Bildirim alındı (foreground):', notification.request.content.title);
      }
    );

    // 4. Bildirime tıklanınca (foreground + background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // 5. FCM token yenilendiğinde backend'e otomatik kaydet
    const refreshSub = listenForTokenRefresh(async (newToken: string) => {
      try {
        await apiService.registerPushToken(newToken, getDeviceType());
        logger.log('✅ Yenilenen push token backend\'e kaydedildi');
      } catch (error) {
        logger.warn('Yenilenen push token kaydedilemedi:', error);
      }
    });
    if (refreshSub) {
      tokenRefreshListener.current = refreshSub;
    }

    // 6. Uygulama kapalıyken gelen bildirime tıklanarak açıldıysa
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          handleNotificationResponse(response);
        }
      })
      .catch((error) => {
        logger.warn('getLastNotificationResponseAsync hatası:', error);
      });

    // Cleanup
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      tokenRefreshListener.current?.remove();
    };
  }, [isAuthenticated, registerToken, handleNotificationResponse]);

  return { registerToken, deactivateToken };
}
