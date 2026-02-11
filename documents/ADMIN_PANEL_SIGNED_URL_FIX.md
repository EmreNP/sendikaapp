# Admin Panel - Signed URL Fix (Frontend Changes)

## 📋 Yapılan Değişiklikler

### 1. File Upload Service Güncellemesi

**Dosya:** [admin-panel/src/services/api/fileUploadService.ts](admin-panel/src/services/api/fileUploadService.ts)

#### Interface Güncellemesi
```typescript
export interface FileUploadResponse {
  documentUrl: string;      // Deprecated - 7 günlük signed URL
  storagePath?: string;     // NEW - use this for storage path
  fileName: string;
  size: number;
  contentType: string;
}
```

#### Upload Fonksiyonları
Tüm upload fonksiyonları artık `storagePath` döndürüyor:
- `uploadDocument()` - Lesson documents
- `uploadVideo()` - Uploaded videos  
- `uploadThumbnail()` - Video thumbnails
- `uploadActivityImage()` - Activity images

```typescript
return {
  documentUrl: data.data.documentUrl || data.data.fileUrl,  // Display için (deprecated)
  storagePath: data.data.storagePath,  // Backend'e gönderilmek için (NEW)
  fileName: data.data.fileName,
  size: data.data.size,
  contentType: data.data.contentType,
};
```

### 2. Document Form Modal Güncellemesi

**Dosya:** [admin-panel/src/components/trainings/DocumentFormModal.tsx](admin-panel/src/components/trainings/DocumentFormModal.tsx)

#### Form Data Değişiklikleri
```typescript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  documentUrl: '',     // Display URL (deprecated)
  documentPath: '',    // Storage path (NEW)
  order: '' as string | number,
  isActive: true,
});
```

#### Upload İşlemi
```typescript
// Upload'tan storagePath al
const uploadResult = await fileUploadService.uploadDocument(selectedFile);
documentPath = uploadResult.storagePath || uploadResult.documentUrl;  // Use storagePath
documentUrl = uploadResult.documentUrl;  // Display URL
```

#### Backend'e Gönderme
```typescript
// Create
const createData: CreateDocumentContentRequest = {
  lessonId,
  title: formData.title.trim(),
  documentPath: documentPath,  // Use documentPath (not URL)
  // ...
};

// Update
const updateData: UpdateDocumentContentRequest = {
  title: formData.title.trim(),
  documentPath: documentPath,  // Use documentPath (not URL)
  // ...
};
```

### 3. Video Form Modal Güncellemesi

**Dosya:** [admin-panel/src/components/trainings/VideoFormModal.tsx](admin-panel/src/components/trainings/VideoFormModal.tsx)

#### Form Data Değişiklikleri
```typescript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  videoUrl: '',
  videoPath: '',           // Storage path for uploaded videos (NEW)
  videoSource: 'uploaded' as VideoSource,
  thumbnailUrl: '',
  thumbnailPath: '',       // Storage path for thumbnails (NEW)
  order: '' as string | number,
  isActive: true,
});
```

#### Video Upload İşlemi (Uploaded Videos)
```typescript
// Upload video
const uploadResult = await fileUploadService.uploadVideo(selectedVideoFile!);
videoPath = uploadResult.storagePath || uploadResult.documentUrl;  // Use storagePath
videoUrl = uploadResult.documentUrl;  // Display URL
```

#### Thumbnail Upload İşlemi
```typescript
// Upload thumbnail
const uploadResult = await fileUploadService.uploadThumbnail(selectedThumbnailFile);
thumbnailPath = uploadResult.storagePath || uploadResult.documentUrl;  // Use storagePath
thumbnailUrl = uploadResult.documentUrl;  // Display URL
```

#### Backend'e Gönderme
```typescript
// Create/Update
const data = {
  title: formData.title.trim(),
  // Uploaded videos için videoPath kullan
  videoUrl: formData.videoSource === 'uploaded' ? undefined : videoUrl,  // Only for YouTube/Vimeo
  videoPath: formData.videoSource === 'uploaded' ? videoPath : undefined,  // Only for uploaded
  videoSource: formData.videoSource,
  // Thumbnail için thumbnailPath kullan
  thumbnailUrl: undefined,  // Don't send URL
  thumbnailPath: thumbnailPath || undefined,  // Send path
  // ...
};
```

## 🔄 Akış Diyagramı

### Önceki Akış (❌ Sorunlu)
```
User -> Upload File -> Backend -> 7 günlük Signed URL üret -> Firestore'a kaydet
                                                                      ↓
                                                              7 gün sonra expire
```

### Yeni Akış (✅ Çözüm)
```
User -> Upload File -> Backend -> Storage path döndür -> Admin Panel -> Backend'e path gönder
                            ↓                                                     ↓
                    Signed URL (display)                              Firestore'a path kaydet
                                                                              ↓
                                                              GET request -> Yeni signed URL üret
```

## 📝 Değişiklik Özeti

### Değişen Davranışlar

1. **Upload Response:**
   - ✅ Artık `storagePath` içeriyor
   - ⚠️ `documentUrl` hala var (display için)

2. **Form State:**
   - ✅ `documentPath`, `videoPath`, `thumbnailPath` eklendi
   - ⚠️ `documentUrl`, `videoUrl`, `thumbnailUrl` hala var (display için)

3. **Backend Request:**
   - ✅ Path gönderiliyor (URL değil)
   - ✅ Backward compatible (URL da kabul ediliyor)

### Backward Compatibility

- ✅ Eski kayıtlar (documentUrl ile) çalışmaya devam ediyor
- ✅ Backend hem path hem URL kabul ediyor
- ✅ GET response'ları otomatik signed URL içeriyor
- ✅ Frontend hiçbir değişiklik yapmadan çalışabilir

## 🎯 Kullanım Örnekleri

### Document Upload & Create
```typescript
// 1. Upload file
const uploadResult = await fileUploadService.uploadDocument(file);

// 2. Use storagePath (not documentUrl)
const documentPath = uploadResult.storagePath || uploadResult.documentUrl;

// 3. Send to backend
await contentService.createDocument(lessonId, {
  title: 'My Document',
  documentPath: documentPath,  // ✅ Use path
  // documentUrl: documentUrl,  // ❌ Don't use URL
});

// 4. Backend GET will return fresh signed URL automatically
const documents = await contentService.getDocuments(lessonId);
console.log(documents[0].documentUrl);  // Fresh 7-day URL
```

### Video Upload & Create (Uploaded Source)
```typescript
// 1. Upload video
const videoResult = await fileUploadService.uploadVideo(videoFile);
const videoPath = videoResult.storagePath || videoResult.documentUrl;

// 2. Upload thumbnail
const thumbnailResult = await fileUploadService.uploadThumbnail(thumbnailFile);
const thumbnailPath = thumbnailResult.storagePath || thumbnailResult.documentUrl;

// 3. Send to backend
await contentService.createVideo(lessonId, {
  title: 'My Video',
  videoPath: videoPath,          // ✅ For uploaded videos
  videoSource: 'uploaded',
  thumbnailPath: thumbnailPath,  // ✅ For thumbnails
});
```

### Video Create (YouTube/Vimeo)
```typescript
// YouTube/Vimeo için URL kullan (path değil)
await contentService.createVideo(lessonId, {
  title: 'YouTube Video',
  videoUrl: 'https://youtube.com/watch?v=...',  // ✅ For YouTube/Vimeo
  videoSource: 'youtube',
  thumbnailPath: thumbnailPath,  // ✅ If custom thumbnail
});
```

## ✅ Test Checklist

### Document Upload
- [ ] Yeni document oluştur ve PDF yükle
- [ ] Document listesinde görüntüle (URL çalışmalı)
- [ ] Document güncelle (yeni PDF yükle)
- [ ] Eski document'leri görüntüle (backward compat)

### Video Upload (Uploaded)
- [ ] Yeni video oluştur ve video yükle
- [ ] Thumbnail yükle
- [ ] Video listesinde görüntüle
- [ ] Video player'da oynat

### Video Create (YouTube)
- [ ] YouTube URL ile video oluştur
- [ ] Custom thumbnail ekle
- [ ] Video listesinde görüntüle

### Edit Operations
- [ ] Mevcut document'i düzenle (PDF değiştirmeden)
- [ ] Mevcut document'i düzenle (yeni PDF ile)
- [ ] Mevcut video'yu düzenle (video değiştirmeden)
- [ ] Mevcut video'yu düzenle (yeni video ile)

## 🚨 Önemli Notlar

1. **storagePath Öncelik:**
   ```typescript
   // Her zaman storagePath'i tercih et
   const path = uploadResult.storagePath || uploadResult.documentUrl;
   ```

2. **Uploaded vs External Videos:**
   - Uploaded videos: `videoPath` kullan
   - YouTube/Vimeo: `videoUrl` kullan

3. **Thumbnails:**
   - Her zaman `thumbnailPath` kullan
   - URL değil, path gönder

4. **Display URLs:**
   - GET response'larındaki URL'ler taze
   - Direkt kullanabilirsin (7 gün geçerli)
   - Database'e kaydetme!

## 📊 Değişiklik Etkisi

### Değişen Dosyalar
- ✅ `fileUploadService.ts` - storagePath support
- ✅ `DocumentFormModal.tsx` - documentPath kullanımı
- ✅ `VideoFormModal.tsx` - videoPath/thumbnailPath kullanımı

### Değişmeyen Dosyalar
- ✅ `contentService.ts` - Aynı API'ler
- ✅ `trainingService.ts` - Aynı API'ler
- ✅ Display components - URL'ler otomatik geliyor

### Shared Types
- ✅ `@shared/types/training.ts` - Backend ile senkron
- ✅ Otomatik type güvenliği

## 🎉 Sonuç

Admin panel artık:
- ✅ Storage path'leri kullanıyor
- ✅ Backend ile uyumlu
- ✅ Signed URL sorunu çözüldü
- ✅ Backward compatible
- ✅ Minimum değişiklikle maksimum etki

**Deployment Sonrası:**
1. Backend deploy edildi ✅
2. Admin panel deploy edilecek ⏳
3. Test edilecek ⏳
4. Production'a alınacak ⏳

---

**Son Güncelleme:** 2026-02-11  
**Durum:** ✅ Admin Panel Implementation Complete
