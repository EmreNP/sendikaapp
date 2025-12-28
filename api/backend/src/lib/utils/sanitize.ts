import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML içeriğini temizler (XSS koruması)
 * Production-ready DOMPurify kullanıyor
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // DOMPurify ile HTML sanitization
  // Sadece güvenli tag'lere ve attribute'lere izin ver
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 
      'a', 'ul', 'ol', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // XSS koruması için ek güvenlik
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    // Link'lerde sadece güvenli protokoller
    ALLOW_DATA_ATTR: false,
  });
  
  return sanitized.trim();
}

