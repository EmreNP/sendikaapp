import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system/legacy';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app, { firebaseConfig } from '../config/firebase';
import { API_BASE_URL } from '../config/api';
import { logger } from '../utils/logger';
import { useSecureScreen } from '../hooks/useSecureScreen';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  params: { url: string; title?: string; contentId?: string; onComplete?: () => void };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_BUCKET = firebaseConfig.storageBucket || 'sendikaapp.firebasestorage.app';

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
  useSecureScreen();
  const route = useRoute() as RouteParams;
  const navigation = useNavigation();
  const { url, title, onComplete } = route.params ?? {};
  const { width: screenWidth } = useWindowDimensions();

  const hasMarkedComplete = useRef(false);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Download PDF to local cache and render with react-native-pdf
  useEffect(() => {
    if (!url) {
      setError('Doküman URL bulunamadı');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setLocalPath(null);
    setDownloadProgress(0);

    const downloadPdf = async () => {
      try {
        const rawUrl = url.trim();
        let resolvedUrl: string;

        // Resolve the download URL
        const storagePath = extractStoragePath(rawUrl);
        if (storagePath) {
          try {
            const storage = getStorage(app);
            const fileRef = ref(storage, storagePath);
            resolvedUrl = await getDownloadURL(fileRef);
          } catch (err: any) {
            logger.warn('[PDF] getDownloadURL fail:', err?.message ?? err);
            resolvedUrl = plainUrl(rawUrl);
          }
        } else {
          resolvedUrl = plainUrl(rawUrl);
        }

        if (cancelled) return;

        // Download PDF to local cache
        const fileName = `doc_${Date.now()}.pdf`;
        const localUri = `${FileSystem.cacheDirectory}${fileName}`;

        const downloadResumable = FileSystem.createDownloadResumable(
          resolvedUrl,
          localUri,
          {},
          (downloadProgress) => {
            if (downloadProgress.totalBytesExpectedToWrite > 0) {
              const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
              if (!cancelled) setDownloadProgress(progress);
            }
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (cancelled) return;

        if (result && result.uri) {
          setLocalPath(result.uri);
        } else {
          throw new Error('PDF indirilemedi');
        }
      } catch (err: any) {
        if (!cancelled) {
          logger.warn('[PDF] Download error:', err?.message ?? err);
          setError('PDF indirilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    downloadPdf();
    return () => { cancelled = true; };
  }, [url, retryKey]);

  // Mark complete once PDF is loaded locally
  useEffect(() => {
    if (localPath && !hasMarkedComplete.current && onComplete) {
      hasMarkedComplete.current = true;
      onComplete();
    }
  }, [localPath, onComplete]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setLocalPath(null);
    setRetryKey(k => k + 1);
  }, []);

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
        <View style={{ width: 44 }}>
          {totalPages > 0 && (
            <Text style={styles.pageIndicator}>{currentPage}/{totalPages}</Text>
          )}
        </View>
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
      ) : loading || !localPath ? (
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color="#4338ca" />
          {downloadProgress > 0 && downloadProgress < 1 ? (
            <>
              <Text style={styles.loadingText}>PDF indiriliyor...</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.round(downloadProgress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
            </>
          ) : (
            <Text style={styles.loadingText}>Belge hazırlanıyor...</Text>
          )}
        </View>
      ) : (
        <Pdf
          key={`pdf-${retryKey}`}
          source={{ uri: localPath }}
          style={[styles.pdfView, { width: screenWidth }]}
          trustAllCerts={false}
          onLoadComplete={(numberOfPages) => {
            setTotalPages(numberOfPages);
            setCurrentPage(1);
          }}
          onPageChanged={(page) => {
            setCurrentPage(page);
          }}
          onError={(err) => {
            logger.warn('[PDF] Render error:', err);
            setError('PDF görüntülenemedi.');
          }}
          enablePaging={false}
          spacing={8}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  pageIndicator: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  pdfView: {
    flex: 1,
    width: SCREEN_WIDTH,
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
  progressBarBg: {
    width: 200,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4338ca',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
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

