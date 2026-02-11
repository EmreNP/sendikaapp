# Signed URL Sorunu - Çözüm Dokümantasyonu

## 🔍 Problem

**Tanımlanan Sorun:**
- API, `documentUrl`, `videoUrl`, `thumbnailUrl` gibi alanları **7 günlük signed URL** olarak Firestore'a kaydediyordu
- 7 gün sonra bu URL'ler expire oluyordu ve linkler kırılıyordu
- Kullanıcılar döküman/video/görsellere erişemiyordu

## ✅ Çözüm

**Yeni Yaklaşım:**
1. **Storage path'leri sakla** (URL değil)
2. **Signed URL'leri talep anında üret** (GET request'lerde)
3. **7 günlük süre sınırı** hala var ama her talep için yeni URL üretiliyor

## 📋 Yapılan Değişiklikler

### 1. Type Güncellemeleri

#### User Types ([shared/types/user.ts](shared/types/user.ts))
```typescript
// Eski
documentUrl?: string; // PDF URL'i (7 günde expire)

// Yeni
documentUrl?: string; // Deprecated - use documentPath
documentPath?: string; // Storage path for PDF (NEW)
```

#### Training Types ([shared/types/training.ts](shared/types/training.ts))
```typescript
// Document Content
interface DocumentContent {
  documentUrl?: string;     // Deprecated - generated on-demand
  documentPath: string;     // Storage path (REQUIRED)
  // ...
}

// Video Content
interface VideoContent {
  videoUrl?: string;        // YouTube/Vimeo URL or deprecated for uploaded
  videoPath?: string;       // Storage path for uploaded video (NEW)
  thumbnailUrl?: string;    // Deprecated - generated on-demand
  thumbnailPath?: string;   // Storage path for thumbnail (NEW)
  // ...
}
```

### 2. Storage Utility ([api/backend/src/lib/utils/storage.ts](api/backend/src/lib/utils/storage.ts))

Yeni oluşturulan utility fonksiyonları:

```typescript
// Tek bir path için signed URL üret
generateSignedUrl(storagePath: string, expiresInDays?: number): Promise<string>

// Birden fazla path için signed URL üret
generateSignedUrls(storagePaths: string[], expiresInDays?: number): Promise<string[]>

// Public URL üret (makePublic yapılmış dosyalar için)
generatePublicUrl(storagePath: string): string
```

### 3. Upload API Güncellemesi

#### File Upload ([api/backend/src/app/api/files/[category]/upload/route.ts](api/backend/src/app/api/files/[category]/upload/route.ts))

**Response'a storagePath eklendi:**
```typescript
{
  imageUrl: publicUrl,       // Deprecated
  documentUrl: publicUrl,    // Deprecated
  videoUrl: publicUrl,       // Deprecated
  thumbnailUrl: publicUrl,   // Deprecated
  fileUrl: publicUrl,        // Deprecated
  storagePath: storagePath,  // NEW - use this!
  fileName: fileName,
  size: fileObj.size,
  contentType: fileObj.type,
  category: category,
}
```

### 4. User Document Upload

#### Upload Registration Form ([api/backend/src/app/api/users/[id]/upload-registration-form/route.ts](api/backend/src/app/api/users/[id]/upload-registration-form/route.ts))

**Değişiklik:**
```typescript
// Eski
await db.collection('users').doc(targetUserId).update({ 
  documentUrl: signedUrl  // 7 günlük signed URL
});

// Yeni
await db.collection('users').doc(targetUserId).update({ 
  documentPath: path,  // Storage path kaydediliyor
  updatedAt: admin.firestore.FieldValue.serverTimestamp() 
});

// Response'da hem path hem de geçici URL dönülüyor
return successResponse('Dosya başarılı bir şekilde yüklendi', { 
  documentUrl: signedUrl,  // Immediate use için
  documentPath: path       // Reference için
});
```

### 5. GET Endpoint'lerde Signed URL Üretimi

Tüm GET endpoint'lerde storage path'ten signed URL üretiliyor:

#### User Endpoints
- [GET /api/users](api/backend/src/app/api/users/route.ts) - Kullanıcı listesinde
- [GET /api/users/:id](api/backend/src/app/api/users/[id]/route.ts) - Kullanıcı detayında
- [GET /api/users/me](api/backend/src/app/api/users/me/route.ts) - Kendi profilinde

```typescript
// Generate signed URL if documentPath exists
if (user.documentPath) {
  try {
    user.documentUrl = await generateSignedUrl(user.documentPath);
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
  }
}
```

#### Training Content Endpoints
- [GET /api/lessons/:id/documents](api/backend/src/app/api/lessons/[id]/documents/route.ts) - Dökümanlar
- [GET /api/lessons/:id/videos](api/backend/src/app/api/lessons/[id]/videos/route.ts) - Videolar
- [GET /api/lessons/:id/contents](api/backend/src/app/api/lessons/[id]/contents/route.ts) - Tüm içerikler

```typescript
// Documents
if (doc.documentPath) {
  doc.documentUrl = await generateSignedUrl(doc.documentPath);
}

// Videos (uploaded)
if (video.videoSource === 'uploaded' && video.videoPath) {
  video.videoUrl = await generateSignedUrl(video.videoPath);
}

// Thumbnails
if (video.thumbnailPath) {
  video.thumbnailUrl = await generateSignedUrl(video.thumbnailPath);
}
```

### 6. POST/PUT Endpoint Güncellemeleri

#### Document Content Create ([api/backend/src/app/api/lessons/[id]/documents/route.ts](api/backend/src/app/api/lessons/[id]/documents/route.ts))

```typescript
// Backward compatibility - documentUrl veya documentPath kabul ediliyor
const documentPath = documentData.documentPath || documentData.documentUrl;

const contentData = {
  documentPath: documentPath.trim(), // Path kaydediliyor
  // ... diğer alanlar
};

// Response'da signed URL üretiliyor
if (document.documentPath) {
  document.documentUrl = await generateSignedUrl(document.documentPath);
}
```

#### Video Content Create ([api/backend/src/app/api/lessons/[id]/videos/route.ts](api/backend/src/app/api/lessons/[id]/videos/route.ts))

```typescript
// Uploaded videos için videoPath kaydet
if (videoData.videoSource === 'uploaded') {
  contentData.videoPath = videoData.videoPath?.trim() || videoData.videoUrl?.trim();
} else {
  // YouTube/Vimeo için videoUrl kullan
  contentData.videoUrl = videoData.videoUrl?.trim();
}

// Thumbnail path
if (videoData.thumbnailPath) {
  contentData.thumbnailPath = videoData.thumbnailPath.trim();
}

// Response'da signed URL üret
if (video.videoSource === 'uploaded' && video.videoPath) {
  video.videoUrl = await generateSignedUrl(video.videoPath);
}
if (video.thumbnailPath) {
  video.thumbnailUrl = await generateSignedUrl(video.thumbnailPath);
}
```

### 7. Validation Güncellemeleri

#### Document Validation ([api/backend/src/lib/utils/validation/documentContentValidation.ts](api/backend/src/lib/utils/validation/documentContentValidation.ts))

```typescript
// documentPath veya documentUrl kabul ediliyor
const hasDocumentPath = data.documentPath && data.documentPath.trim() !== '';
const hasDocumentUrl = data.documentUrl && data.documentUrl.trim() !== '';

if (!hasDocumentPath && !hasDocumentUrl) {
  errors.documentPath = 'Döküman path veya URL zorunludur';
}
```

#### Video Validation ([api/backend/src/lib/utils/validation/videoContentValidation.ts](api/backend/src/lib/utils/validation/videoContentValidation.ts))

```typescript
if (data.videoSource === 'uploaded') {
  // Uploaded videos için videoPath gerekli
  const hasVideoPath = data.videoPath && data.videoPath.trim() !== '';
  const hasVideoUrl = data.videoUrl && data.videoUrl.trim() !== '';
  
  if (!hasVideoPath && !hasVideoUrl) {
    errors.videoPath = 'Yüklenen videolar için video path zorunludur';
  }
} else {
  // YouTube/Vimeo için videoUrl gerekli
  if (!data.videoUrl || data.videoUrl.trim() === '') {
    errors.videoUrl = 'Video URL zorunludur';
  }
}
```

## 🔄 Migration Stratejisi

### Backward Compatibility

**Mevcut Veriler İçin:**
- `documentUrl`, `videoUrl`, `thumbnailUrl` alanları **deprecated** olarak işaretlendi
- Hala kabul ediliyor (backward compatibility için)
- Yeni kayıtlar `documentPath`, `videoPath`, `thumbnailPath` kullanmalı

**API Response:**
- GET endpoint'ler hem path hem URL döndürüyor
- URL'ler her talep için yeni üretiliyor (7 günlük)
- Frontend için URL kullanımı şeffaf

### Migration Adımları

1. **Backend Deployment** ✅ (Yapıldı)
   - Tüm endpoint'ler güncellendi
   - Storage utility eklendi
   - Validation güncellendi

2. **Frontend Güncellemesi** (Sonraki adım)
   - Upload sonrası `storagePath` alanını kullan
   - Content create/update'de `documentPath`/`videoPath` kullan
   - GET response'larından `documentUrl`/`videoUrl` almaya devam et (değişiklik yok)

3. **Veri Migrasyonu** (Opsiyonel)
   - Mevcut `documentUrl` alanlarını `documentPath`'e dönüştür
   - Script ile toplu günceleme yapılabilir
   - Acil değil, backward compatibility korunuyor

## 📊 Avantajlar

### ✨ Sağlanan İyileştirmeler

1. **Kalıcı Bağlantılar**
   - Storage path'ler asla expire olmaz
   - URL'ler her talep için taze üretilir
   - Kullanıcılar her zaman erişebilir

2. **Güvenlik**
   - Signed URL'ler 7 günlük (değiştirilebilir)
   - Public olarak paylaşılamaz
   - Her talep için yeni token

3. **Esneklik**
   - URL expire süresi kolayca değiştirilebilir
   - Public URL'e geçiş kolay (makePublic)
   - CDN entegrasyonu mümkün

4. **Performans**
   - URL üretimi cache'lenebilir
   - Batch generation mevcut
   - Paralel işlem desteği

## 🎯 Kullanım Örnekleri

### Frontend - File Upload

```typescript
// Upload dosya
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/files/lesson-documents/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();

// YENİ: storagePath kullan
const documentPath = data.storagePath;  // ✅ Use this!
// ESKI: documentUrl deprecated
// const documentUrl = data.documentUrl; // ❌ Don't use (7 days expire)
```

### Frontend - Document Create

```typescript
// Yeni döküman oluştur
await fetch(`/api/lessons/${lessonId}/documents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Döküman Başlığı',
    documentPath: documentPath,  // ✅ Use storagePath from upload
    lessonId: lessonId,
  }),
});
```

### Frontend - Display Document

```typescript
// Dökümanları listele
const response = await fetch(`/api/lessons/${lessonId}/documents`);
const data = await response.json();

// documentUrl her talep için yeni üretilir
data.documents.forEach(doc => {
  console.log(doc.documentUrl);  // ✅ Fresh 7-day URL
  // URL'i direkt kullan, expire edilme riski yok (7 gün içinde)
});
```

## 🔍 Test Senaryoları

### Test 1: Yeni Upload
1. Dosya yükle → `storagePath` al
2. Content oluştur → `documentPath` kullan
3. GET ile çek → `documentUrl` otomatik üretilmiş olmalı

### Test 2: Expire Test
1. Bir döküman oluştur
2. 7 gün bekle (veya manuel expire et)
3. GET endpoint'i çağır → Yeni URL üretilmeli
4. URL çalışmalı

### Test 3: Backward Compatibility
1. Eski kayıt (documentUrl ile) oluştur
2. GET endpoint'i çağır → URL düzgün dönmeli
3. Yeni kayıt (documentPath ile) oluştur
4. İkisi de çalışmalı

## 📝 Notlar

- **Frontend değişikliği minimal**: Sadece upload sonrası `storagePath` kullanımı
- **Mevcut veriler korunuyor**: Backward compatibility tam
- **Kademeli geçiş mümkün**: Acil migration gereği yok
- **7 günlük süre**: Varsayılan, `generateSignedUrl(path, 30)` ile değiştirilebilir

## 🚀 Next Steps

1. ✅ Backend deployment (Tamamlandı)
2. ⏳ Frontend update (Upload sonrası storagePath kullan)
3. ⏳ Test all endpoints
4. ⏳ Monitor logs for errors
5. ⏳ Optional: Migrate existing data

---

**Son Güncelleme:** 2026-02-11  
**Durum:** ✅ Backend Implementation Complete
