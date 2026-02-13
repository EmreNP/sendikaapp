/**
 * HtmlContent - Rich text HTML içeriğini React Native'de render eden bileşen.
 * Haber ve duyuru detaylarında kullanılır.
 */
import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHtml, { defaultSystemFonts, MixedStyleDeclaration } from 'react-native-render-html';

interface HtmlContentProps {
  html: string;
  /** Render genişliği (varsayılan: ekran genişliği - padding) */
  contentWidth?: number;
  /** Temel font boyutu */
  baseFontSize?: number;
}

// HTML tag'ları için özel stiller
const tagsStyles: Record<string, MixedStyleDeclaration> = {
  body: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 26,
  },
  p: {
    marginTop: 0,
    marginBottom: 12,
    lineHeight: 26,
  },
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 30,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 18,
    marginBottom: 8,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 26,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 14,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  b: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  em: {
    fontStyle: 'italic',
  },
  i: {
    fontStyle: 'italic',
  },
  u: {
    textDecorationLine: 'underline',
  },
  a: {
    color: '#4338ca',
    textDecorationLine: 'underline',
  },
  ul: {
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 8,
  },
  ol: {
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 8,
  },
  li: {
    marginBottom: 4,
    fontSize: 15,
    lineHeight: 24,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#4338ca',
    backgroundColor: '#f8fafc',
    paddingLeft: 14,
    paddingVertical: 8,
    marginVertical: 12,
    fontStyle: 'italic',
    color: '#475569',
  },
  img: {
    borderRadius: 12,
    marginVertical: 12,
  },
  hr: {
    backgroundColor: '#e2e8f0',
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginVertical: 12,
  },
  th: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  td: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pre: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    fontSize: 13,
  },
  code: {
    backgroundColor: '#f1f5f9',
    color: '#e11d48',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'monospace',
  },
};

/**
 * HTML içeriğini güvenli bir şekilde sarmalayıp normalize eden fonksiyon.
 * Editörden gelen içerik bazen sadece inline tag'lar olabilir, <body> veya <div> ile
 * sarmalanmamış olabilir. Bu fonksiyon bunu düzeltir.
 */
function wrapHtml(html: string): string {
  const trimmed = html.trim();
  // Zaten block-level bir tag ile başlıyorsa olduğu gibi bırak
  if (/^<(?:div|p|h[1-6]|ul|ol|table|blockquote|section|article)/i.test(trimmed)) {
    return trimmed;
  }
  // Aksi takdirde bir <div> ile sarmala (böylece satır sonları vs. düzgün çalışır)
  return `<div>${trimmed}</div>`;
}

export const HtmlContent: React.FC<HtmlContentProps> = ({
  html,
  contentWidth: contentWidthProp,
  baseFontSize = 15,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = contentWidthProp || windowWidth - 40;

  const source = useMemo(() => {
    if (!html || html.trim().length === 0) {
      return { html: '<p>İçerik mevcut değil.</p>' };
    }
    return { html: wrapHtml(html) };
  }, [html]);

  const customTagsStyles = useMemo(() => ({
    ...tagsStyles,
    body: {
      ...tagsStyles.body,
      fontSize: baseFontSize,
    },
  }), [baseFontSize]);

  // renderersProps ve defaultTextProps'u memoize et — aksi halde her render'da
  // yeni obje oluşur ve RenderHtml gereksiz yere ağacı yeniden oluşturur.
  const renderersProps = useMemo(() => ({
    img: {
      enableExperimentalPercentWidth: true,
    },
  }), []);

  const defaultTextProps = useMemo(() => ({
    selectable: true,
  }), []);

  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={source}
      tagsStyles={customTagsStyles}
      systemFonts={defaultSystemFonts}
      enableExperimentalMarginCollapsing
      defaultTextProps={defaultTextProps}
      renderersProps={renderersProps}
    />
  );
};

/**
 * HTML etiketlerini temizleyerek düz metin döndürür.
 * Önizleme / kısa açıklama alanlarında kullanılır (HomeScreen, liste kartları vs.)
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')     // <br> → newline
    .replace(/<\/p>/gi, '\n')           // </p> → newline
    .replace(/<\/div>/gi, '\n')         // </div> → newline
    .replace(/<\/li>/gi, '\n')          // </li> → newline
    .replace(/<[^>]+>/g, '')            // Tüm HTML tag'larını kaldır
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')         // 3+ newline → 2
    .trim();
}
