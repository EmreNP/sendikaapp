import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';

type RouteParams = {
  params: { url: string; title?: string; contentId?: string; onComplete?: () => void };
};

export const DocumentScreen: React.FC = () => {
  const route = useRoute() as RouteParams;
  const { url, title, contentId, onComplete } = route.params;
  const hasMarkedComplete = useRef(false);

  // Use Google Docs viewer for PDFs to improve compatibility
  const isPdf = url?.toLowerCase().endsWith('.pdf');
  const viewerUrl = isPdf ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` : url;

  const handleLoadEnd = () => {
    // Mark as completed when document finishes loading (only once)
    if (!hasMarkedComplete.current && onComplete) {
      hasMarkedComplete.current = true;
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title || 'Doküman'}</Text>
      </View>
      <WebView
        source={{ uri: viewerUrl }}
        startInLoadingState
        onLoadEnd={handleLoadEnd}
        renderLoading={() => (
          <View style={styles.loading}><ActivityIndicator size="large" color="#4338ca" /></View>
        )}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e6edf7' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  webview: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
