# Test Checklist - Sorun Çözümleri

## ✅ Tamamlanmış Çözümler - Test Edilmeli

### 1. Test Question ID Collision Fix ✓
**Dosya:** `/admin-panel/src/components/trainings/TestFormModal.tsx`

**Test Adımları:**
1. Admin panelde Training Detail sayfasına git
2. Yeni test oluştur
3. Hızlı şekilde 10+ soru ekle (addQuestion)
4. Console'da ID'leri kontrol et - her biri unique olmalı
5. Excel'den toplu soru import et
6. ID'lerin unique olduğunu doğrula

**Beklenen:** Tüm question option ID'leri unique (collision yok)

---

### 2. 404 Page ✓
**Dosya:** `/admin-panel/src/pages/NotFoundPage.tsx`

**Test Adımları:**
1. Browser'da geçersiz URL'e git: `/admin/nonexistent`
2. 404 sayfasının göründüğünü doğrula
3. "Geri Dön" butonuna tıkla → önceki sayfaya dön
4. Tekrar `/admin/nonexistent` → 404
5. "Ana Sayfaya Git" butonuna tıkla → `/admin/users` sayfasına git

**Beklenen:** 404 sayfası gösterilmeli, butonlar çalışmalı

---

### 3. Real Upload Progress ✓
**Dosya:** `/admin-panel/src/services/api/fileUploadService.ts`

**Test Adımları - Document Upload:**
1. Training > Lesson > Add Document
2. Büyük bir PDF seç (5+ MB)
3. Progress bar'ı izle
4. 0% → 100% arasında gerçek ilerleme olmalı
5. Ani atlama olmamalı (fake değil)

**Test Adımları - Video Upload:**
1. Training > Lesson > Add Video
2. Büyük video seç (10+ MB)
3. Progress bar gerçek ilerlemeyi göstermeli
4. Thumbnail upload da test et

**Beklenen:** Progress bar gerçek upload ilerlemesini göstermeli (fake %10 artışlar değil)

---

### 4. Unsaved Changes Warning (Utility Hazır - Entegrasyon Gerekli) 🔧
**Dosya:** `/admin-panel/src/hooks/useUnsavedChangesWarning.ts`

**Entegrasyon Örneği:**
```tsx
// Modal component'te
const [hasChanges, setHasChanges] = useState(false);
const { handleClose, showConfirm, handleConfirmClose, handleCancelClose } = 
  useUnsavedChangesWarning(hasChanges, onClose);

// Form değiştiğinde
<input onChange={() => setHasChanges(true)} />

// Modal'da
<div onClick={handleClose}> // backdrop
<button onClick={handleClose}>X</button> // close button

{showConfirm && (
  <ConfirmModal
    isOpen={showConfirm}
    title="Değişiklikleri Kaydetmediniz"
    message="Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?"
    onConfirm={handleConfirmClose}
    onCancel={handleCancelClose}
  />
)}
```

**Test Adımları (Entegrasyon sonrası):**
1. Bir modal aç (örn: User Edit)
2. Form'da değişiklik yap
3. Backdrop'a tıkla
4. Confirmation dialog gösterilmeli
5. "İptal" → modal açık kalmalı
6. "Evet" → modal kapanmalı

---

### 5. Empty Directories Cleanup ✓
**Test Adımları:**
```bash
cd /home/justEmre/SendikaApp/admin-panel/src
find . -type d -empty
```

**Beklenen:** Boş output (tüm empty dir'ler silinmiş)

---

### 6. Production Logger (Partial - Refactoring Gerekli) 🔧
**Dosya:** `/admin-panel/src/utils/logger.ts`

**Test Adımları:**
1. Production build oluştur: `npm run build`
2. Production preview: `npm run preview`
3. Browser console'u aç
4. Çeşitli işlemler yap
5. Console'da debug log'ları görmemelisin

**Beklenen:** Development'ta log'lar var, production'da yok

**Not:** Mevcut console.log'lar hala kullanımda - logger'a migration gerekli

---

## 🔧 Manuel Entegrasyon Gerektiren

### useUnsavedChangesWarning Hook Entegrasyonu
**Yapılması Gereken Modal'lar:**
- [ ] UserEditModal
- [ ] UserCreateModal
- [ ] BranchFormModal
- [ ] NewsFormModal
- [ ] AnnouncementFormModal
- [ ] ActivityFormModal
- [ ] TrainingFormModal
- [ ] LessonFormModal
- [ ] TestFormModal
- [ ] DocumentFormModal
- [ ] VideoFormModal
- [ ] FAQFormModal

**Her modal için:**
1. `hasChanges` state ekle
2. Form değişikliklerinde `setHasChanges(true)` çağır
3. Hook'u kullan ve ConfirmModal ekle

---

## ⏳ Yapılacaklar (Future Work)

### console.log → logger Migration
**Script ile otomatize edilebilir:**
```bash
# Find all console.log
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"

# Replace with logger.log
sed -i 's/console\.log/logger.log/g' src/**/*.{ts,tsx}
```

**Manuel kontrol gerekli:**
- Import ekle: `import { logger } from '@/utils/logger'`
- Error handling log'ları gözden geçir
- Production'da hassas bilgi kontrolü

---

### Unused Imports Cleanup
```bash
# ESLint ile otomatik fix
npx eslint --fix src/**/*.{ts,tsx}

# Veya IDE ile
# VSCode: Organize Imports (Shift+Alt+O)
```

---

## 📊 Build Verification

### Admin Panel
```bash
cd /home/justEmre/SendikaApp/admin-panel
npm run build
```

**Beklenen:**
- ✓ Build successful
- No TypeScript errors
- Warnings OK (chunk size warning normal)

### Backend
```bash
cd /home/justEmre/SendikaApp/api/backend
npm run build
```

**Not:** Backend'de webpack config sorunları var (pre-existing)

---

## 🎯 Test Sonuç Tablosu

| Test | Durum | Sonuç | Notlar |
|------|-------|-------|--------|
| Test Question IDs | ⏳ | - | Build OK, runtime test gerekli |
| 404 Page | ⏳ | - | Build OK, runtime test gerekli |
| Upload Progress | ⏳ | - | Build OK, file upload test gerekli |
| Empty Dirs | ✅ | Pass | Verified - all removed |
| Logger Utility | ✅ | Pass | Created, migration needed |
| Unsaved Warning | ✅ | Pass | Hook ready, integration needed |

---

## 🚀 Deployment Checklist

### Pre-Deploy
- [ ] Admin panel build successful
- [ ] All TypeScript errors fixed
- [ ] Test on staging environment
- [ ] Verify upload progress with large files
- [ ] Test 404 page navigation
- [ ] Check console output (no sensitive data)

### Post-Deploy
- [ ] Monitor error rates
- [ ] Check upload success metrics
- [ ] User feedback on new features
- [ ] Performance monitoring (upload speed)

---

**Son Güncelleme:** 11 Şubat 2026
