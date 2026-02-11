import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';

type RouteParams = {
  params: { url: string; title?: string };
};

export const PDFViewerScreen: React.FC = () => {
  const route = useRoute() as RouteParams;
  const navigation = useNavigation();
  const { url, title } = route.params;

  const [localPath, setLocalPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function prepare() {
      try {
        setLoading(true);

        // build filename
        const filename = `pdf_${Date.now()}.pdf`;
        const destPath = `${RNFS.CachesDirectoryPath}/${filename}`;

        // try to get token (if logged in) and download with auth header
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // download file
        const exists = await RNFS.exists(destPath);
        if (exists) {
          if (mounted) setLocalPath(`file://${destPath}`);
          return;
        }

        const res = await RNFS.downloadFile({ fromUrl: url, toFile: destPath, headers }).promise;
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          if (mounted) setLocalPath(`file://${destPath}`);
        } else {
          // fallback: try open remote directly
          if (mounted) setLocalPath(url);
        }
      } catch (err) {
        console.error('PDF download failed:', err);
        // fallback to remote url
        if (mounted) setLocalPath(url);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    return () => {
      mounted = false;
      // optional: cleanup files older than some time (not implemented)
    };
  }, [url]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><ActivityIndicator size="large" color="#4338ca" /></View>
      </SafeAreaView>
    );
  }

  if (!localPath) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><Text>Dosya açılamadı</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>{title || 'Doküman'}</Text></View>
      <Pdf
        source={{ uri: localPath }}
        style={styles.pdf}
        onError={(e) => { console.error('PDF error', e); Alert.alert('Hata', 'PDF görüntülenemedi'); }}
        onLoadComplete={(num) => console.log(`PDF loaded pages: ${num}`)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e6edf7' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  pdf: { flex: 1 },
});
