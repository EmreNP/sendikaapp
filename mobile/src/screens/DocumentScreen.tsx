import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app from '../config/firebase';
import { API_BASE_URL } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  params: { url: string; title?: string; contentId?: string; onComplete?: () => void };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_BUCKET = 'sendikaapp.firebasestorage.app';

/** Extract the Firebase Storage object path from any URL the backend returns. */
const extractStoragePath = (rawUrl: string): string | null => {
  if (!rawUrl) return null;
  const t = rawUrl.trim();

  if (t.startsWith('gs://')) {
    const rest = t.replace('gs://', '');
    const slash = rest.indexOf('/');
    return slash > -1 ? rest.slice(slash + 1) : null;
  }

  const gcsMatch = t.match(/^https?:\/\/storage\.googleapis\.com\/[^/]+\/(.+)$/i);
  if (gcsMatch) return decodeURIComponent(gcsMatch[1]);

  const fbMatch = t.match(/\/o\/([^?]+)/);
  if (fbMatch && t.includes('firebasestorage.googleapis.com')) {
    return decodeURIComponent(fbMatch[1]);
  }

  return null;
};

/** Normalise a raw URL to a usable HTTPS URL (no Firebase SDK needed). */
const plainUrl = (rawUrl: string): string => {
  const t = rawUrl.trim();
  const path = extractStoragePath(t);
  if (path) {
    return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
  }
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/')) return `${API_BASE_URL}${t}`;
  return `${API_BASE_URL}/${t}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const DocumentScreen: React.FC = () => {
  const route = useRoute() as RouteParams;
  const navigation = useNavigation();
  const { url, title, onComplete } = route.params ?? {};

  const hasMarkedComplete = useRef(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Resolve the download URL — Firebase getDownloadURL gives a token-based URL
  useEffect(() => {
    if (!url) {
      setError('Doküman URL bulunamadı');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResolvedUrl(null);

    const resolve = async () => {
      const rawUrl = url.trim();
      console.log('[PDF] raw url:', rawUrl);

      const storagePath = extractStoragePath(rawUrl);

      if (storagePath) {
        try {
          const storage = getStorage(app);
          const fileRef = ref(storage, storagePath);
          const downloadUrl = await getDownloadURL(fileRef);
          console.log('[PDF] getDownloadURL OK');
          if (!cancelled) {
            setResolvedUrl(downloadUrl);
            setLoading(false);
          }
          return;
        } catch (err: any) {
          console.warn('[PDF] getDownloadURL fail:', err?.message ?? err);
        }
      }

      // Fallback
      const fb = plainUrl(rawUrl);
      console.log('[PDF] fallback url:', fb);
      if (!cancelled) {
        setResolvedUrl(fb);
        setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [url, retryKey]);

  // Mark complete once URL is resolved
  useEffect(() => {
    if (resolvedUrl && !hasMarkedComplete.current && onComplete) {
      hasMarkedComplete.current = true;
      onComplete();
    }
  }, [resolvedUrl, onComplete]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setResolvedUrl(null);
    setRetryKey(k => k + 1);
  }, []);

  // Google Docs Viewer renders any publicly-accessible PDF in a WebView
  const viewerUrl = resolvedUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resolvedUrl)}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Doküman'}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={56} color="#ef4444" />
          <Text style={styles.errorTitle}>Yüklenemedi</Text>
          <Text style={styles.errorText}>
            PDF açılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Feather name="refresh-cw" size={16} color="#ffffff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : loading || !viewerUrl ? (
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color="#4338ca" />
          <Text style={styles.loadingText}>Belge hazırlanıyor...</Text>
        </View>
      ) : (
        <WebView
          key={`pdf-${retryKey}`}
          source={{ uri: viewerUrl }}
          style={styles.webview}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          renderLoading={() => (
            <View style={[styles.centeredBox, StyleSheet.absoluteFill]}>
              <ActivityIndicator size="large" color="#4338ca" />
              <Text style={styles.loadingText}>PDF yükleniyor...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('[PDF] WebView error:', nativeEvent.description);
            setError(nativeEvent.description || 'WebView hatası');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('[PDF] WebView HTTP error:', nativeEvent.statusCode);
            if (nativeEvent.statusCode >= 400) {
              setError(`HTTP ${nativeEvent.statusCode}`);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 56,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4338ca',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});

