/**
 * sentry.ts — Sentry crash monitoring entegrasyonu.
 *
 * Production ortamında uygulama çökmelerini, hataları ve
 * performans verilerini yakalar.
 *
 * Kullanım:
 *   import { initSentry } from '../services/sentry';
 *   initSentry(); // App.tsx en üstünde çağrılmalı
 */
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

/**
 * Sentry'yi başlat.
 * __DEV__ modunda devre dışı bırakılır (gereksiz event kullanımını önler).
 */
export function initSentry(): void {
  if (__DEV__) {
    return; // Development ortamında Sentry aktif olmasın
  }

  if (!SENTRY_DSN) {
    // DSN tanımlanmamışsa sessizce atla
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    enableNativeCrashHandling: true,
    // Hassas verilerin Sentry'e gönderilmesini önle
    beforeSend(event) {
      // TC Kimlik No gibi hassas verileri temizle
      if (event.request?.data) {
        const dataStr = typeof event.request.data === 'string'
          ? event.request.data
          : JSON.stringify(event.request.data);
        if (/tcKimlikNo|tcKimlik|fatherName|motherName/i.test(dataStr)) {
          event.request.data = '[REDACTED - Hassas Veri]';
        }
      }
      return event;
    },
    // Breadcrumb'lardan hassas veri temizle
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') {
        return null; // Console logları Sentry'e gönderme
      }
      return breadcrumb;
    },
  });
}

/**
 * Global unhandled error handler'ı kur.
 * ErrorUtils üzerinden React Native'in native hata yakalayıcısına bağlanır.
 */
export function setupGlobalErrorHandler(): void {
  if (__DEV__) return;

  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    Sentry.captureException(error, {
      tags: { fatal: String(isFatal ?? false) },
    });

    // Orijinal handler'ı da çağır (crash dialog vb. için)
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

export { Sentry };
export default Sentry;
