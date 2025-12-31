/**
 * Video URL helper functions
 * YouTube ve Vimeo URL'lerinden embed URL oluşturur
 */

export function getYouTubeEmbedUrl(url: string): string | null {
  // YouTube URL'den video ID'yi çıkar
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  // Vimeo URL'den video ID'yi çıkar
  const pattern = /(?:vimeo\.com\/)(\d+)/;
  const match = url.match(pattern);
  
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  
  return null;
}

export function getVideoEmbedUrl(url: string, source: 'youtube' | 'vimeo' | 'uploaded'): string | null {
  if (source === 'youtube') {
    return getYouTubeEmbedUrl(url);
  } else if (source === 'vimeo') {
    return getVimeoEmbedUrl(url);
  }
  
  // Uploaded video için direkt URL döndür
  return url;
}

