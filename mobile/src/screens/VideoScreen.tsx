// VideoScreen – YouTube / Vimeo / Uploaded video player
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { API_BASE_URL } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  params: {
    url: string;
    videoSource?: string; // 'youtube' | 'vimeo' | 'uploaded'
    title?: string;
    contentId?: string;
  };
};

type VideoType = 'youtube' | 'vimeo' | 'direct';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useScreenDimensions() {
  const [dims, setDims] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);
  return dims;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // bare 11-char ID
  if (/^[\w-]{11}$/.test(url)) return url;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i,
  );
  return m ? m[1] : null;
}

function extractVimeoId(url: string): string | null {
  if (!url) return null;
  // bare numeric ID
  if (/^\d+$/.test(url)) return url;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return m ? m[1] : null;
}

function detectVideoType(url: string, videoSource?: string): VideoType {
  // videoSource from backend wins
  if (videoSource === 'youtube') return 'youtube';
  if (videoSource === 'vimeo') return 'vimeo';
  if (videoSource === 'uploaded') return 'direct';

  // URL pattern
  if (/youtube\.com|youtu\.be/i.test(url) && extractYouTubeId(url)) return 'youtube';
  if (/vimeo\.com/i.test(url) && extractVimeoId(url)) return 'vimeo';

  // bare ID fallback
  if (/^[\w-]{11}$/.test(url)) return 'youtube';
  if (/^\d+$/.test(url)) return 'vimeo';

  return 'direct';
}

const STORAGE_BUCKET = 'sendikaapp.firebasestorage.app';

const toFirebaseStorageUrl = (bucket: string, objectPath: string): string =>
  `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;

function normalizeUrl(raw: string): string {
  if (!raw) return raw;
  let t = raw.trim();

  // gs://bucket/path  →  firebasestorage.googleapis.com URL
  if (t.startsWith('gs://')) {
    const rest = t.replace('gs://', '');
    const slash = rest.indexOf('/');
    if (slash > -1) {
      return toFirebaseStorageUrl(rest.slice(0, slash), rest.slice(slash + 1));
    }
  }

  // storage.googleapis.com/BUCKET/PATH  →  firebasestorage.googleapis.com URL
  const gcsMatch = t.match(/^https?:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/i);
  if (gcsMatch) {
    const [, bucket, objectPath] = gcsMatch;
    const realBucket = bucket === 'default-bucket' ? STORAGE_BUCKET : bucket;
    return toFirebaseStorageUrl(realBucket, objectPath);
  }

  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return 'https:' + t;
  if (/^[\w-]{11}$/.test(t) || /^\d+$/.test(t)) return t; // bare IDs stay as-is
  if (t.startsWith('/')) return API_BASE_URL + t;
  return API_BASE_URL + '/' + t;
}

// ─── YouTube Player ───────────────────────────────────────────────────────────

const YouTubePlayer: React.FC<{ videoId: string; width: number; height: number }> = ({ videoId, width, height }) => {
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  // 16:9 oranında, hem genişlik hem yükseklik ekrana sığacak maksimum boyutu hesapla
  const videoW = Math.min(width, Math.round(height * 16 / 9));
  const videoH = Math.min(height, Math.round(width * 9 / 16));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    // playerBox (flex:1) içinde ortala; taşmayı önle
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <View style={{ width: videoW, height: videoH, overflow: 'hidden' }}>
        <YoutubePlayer
          height={videoH}
          width={videoW}
          play={playing}
          videoId={videoId}
          onReady={() => setLoading(false)}
          onChangeState={(state) => {
            if (['playing', 'paused', 'buffering'].includes(state)) setLoading(false);
            if (state === 'ended') setPlaying(false);
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            scrollEnabled: false,
          }}
        />
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Vimeo → resolves stream → expo-av ───────────────────────────────────────

const VimeoPlayer: React.FC<{ videoId: string }> = ({ videoId }) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`https://player.vimeo.com/video/${videoId}/config`);
        const json = await res.json();
        const files = json?.request?.files;

        // try progressive (mp4)
        const progressive: Array<{ url: string; height: number }> =
          Array.isArray(files?.progressive) ? files.progressive : [];
        if (progressive.length) {
          const best = [...progressive].sort((a, b) => (b.height || 0) - (a.height || 0))[0];
          if (alive && best?.url) { setStreamUrl(best.url); setLoading(false); return; }
        }

        // try HLS
        const cdns = files?.hls?.cdns ?? {};
        const hlsEntry = Object.values(cdns)[0] as { url?: string } | undefined;
        if (alive && hlsEntry?.url) { setStreamUrl(hlsEntry.url); setLoading(false); return; }

        if (alive) { setError(true); setLoading(false); }
      } catch {
        if (alive) { setError(true); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [videoId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#aaa', marginTop: 12 }}>Video yükleniyor...</Text>
      </View>
    );
  }

  if (error || !streamUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Vimeo videosu oynatılamadı.</Text>
      </View>
    );
  }

  return <DirectPlayer uri={streamUrl} />;
};

// ─── Direct / Uploaded Player (expo-av) ──────────────────────────────────────

const DirectPlayer: React.FC<{ uri: string }> = ({ uri }) => {
  const videoRef = useRef<Video>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 12000);
    return () => clearTimeout(t);
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="alert-circle" size={40} color="#ef4444" />
        <Text style={{ color: '#fff', marginTop: 12 }}>Video oynatılamadı.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ flex: 1 }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        useNativeControls
        onLoad={() => setLoading(false)}
        onPlaybackStatusUpdate={(s) => {
          if (s.isLoaded && loading) setLoading(false);
        }}
        onError={(err) => {
          console.warn('Video error:', err, 'URI:', uri);
          setError(true);
          setLoading(false);
        }}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const VideoScreen: React.FC = () => {
  const route = useRoute() as RouteParams;
  const navigation = useNavigation();
  const { url, videoSource, title } = route.params ?? {};
  const { width, height } = useScreenDimensions();
  const isLandscape = width > height;

  // Ekrana girilince her yönü serbest bırak, çıkınca portre kilitle
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const normalizedUrl = useMemo(() => normalizeUrl(url ?? ''), [url]);
  const videoType = useMemo(
    () => detectVideoType(normalizedUrl, videoSource),
    [normalizedUrl, videoSource],
  );
  const youtubeId = useMemo(
    () => (videoType === 'youtube' ? extractYouTubeId(normalizedUrl) : null),
    [normalizedUrl, videoType],
  );
  const vimeoId = useMemo(
    () => (videoType === 'vimeo' ? extractVimeoId(normalizedUrl) : null),
    [normalizedUrl, videoType],
  );

  const renderPlayer = (w: number, h: number) => {
    if (videoType === 'youtube') {
      if (!youtubeId) {
        return <ErrorBox message="YouTube video ID bulunamadı." />;
      }
      return <YouTubePlayer videoId={youtubeId} width={w} height={h} />;
    }
    if (videoType === 'vimeo') {
      if (!vimeoId) {
        return <ErrorBox message="Vimeo video ID bulunamadı." />;
      }
      return <VimeoPlayer videoId={vimeoId} />;
    }
    // direct / uploaded
    if (!normalizedUrl) {
      return <ErrorBox message="Video URL bulunamadı." />;
    }
    return <DirectPlayer uri={normalizedUrl} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" hidden={isLandscape} />

      {/* Player fills the whole screen */}
      <View style={styles.playerBox}>{renderPlayer(width, height)}</View>

      {/* Header – yatayda gizle */}
      {!isLandscape && (
        <SafeAreaView style={styles.headerOverlay} edges={['top']} pointerEvents="box-none">
          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || 'Video'}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      )}

      {/* Yatayda geri butonu sağ üstte köşede */}
      {isLandscape && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.landscapeBack}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── ErrorBox ─────────────────────────────────────────────────────────────────

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
    <Feather name="alert-circle" size={40} color="#ef4444" />
    <Text style={{ color: '#fff', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }}>{message}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  playerBox: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  landscapeBack: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },

});
