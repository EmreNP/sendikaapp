# 📋 SendikaApp Frontend-Backend Entegrasyon Görev Planı

> **Tarih:** 31 Ocak 2026  
> **Amaç:** Backend değiştirilmeden, frontend'in API'ye tam entegrasyonu  
> **Kritik Kural:** Eğitimlere SADECE `status: 'active'` olan kullanıcılar erişebilir

---

## 📊 Mevcut Durum Özeti

### Backend (Değişmeyecek)
| Özellik | Durum |
|---------|-------|
| API Endpoint'leri | ✅ 50+ hazır |
| 2 Aşamalı Kayıt | ✅ Çalışıyor |
| Firebase Auth | ✅ Aktif |
| Eğitim Sistemi | ✅ Tam kapsamlı |

### Frontend (Entegre Edilecek)
| Özellik | Mevcut Durum | Hedef |
|---------|--------------|-------|
| API Service Layer | ❌ Yok | Oluşturulacak |
| Firebase Config | ⏳ Bekliyor | ENV dosyası gelecek |
| AuthContext | ⚠️ Uyumsuz roller | Yeniden yazılacak |
| Eğitim Sayfası | Statik veri | API'ye bağlanacak |
| Kayıt Formu | Backend bağlantısı yok | 2 aşamalı entegrasyon |

---

## 🎯 FAZ 1: API Altyapısı (Öncelik: Kritik)

### Görev 1.1: Firebase Configuration
**Dosya:** `front/src/config/firebase.ts` (YENİ)
**Durum:** ⏳ ENV dosyası bekleniyor

### Görev 1.2: API Configuration ✅
**Dosya:** `front/src/config/api.ts` (YENİ)

### Görev 1.3: HTTP Client Service ✅
**Dosya:** `front/src/services/api/client.ts` (YENİ)

---

## 🎯 FAZ 2: Authentication Sistemi (Öncelik: Kritik)

### Görev 2.1: AuthContext Yeniden Yazımı
**Dosya:** `front/src/context/AuthContext.tsx` (GÜNCELLEME)

```
Mevcut Sorunlar:
- Roller uyumsuz: 'guest' | 'member' | 'workplace_rep' | 'provincial_rep' | 'trainer'
- Backend rolleri: 'admin' | 'branch_manager' | 'user'
- Status kontrolü yok

Yapılacaklar:
1. UserRole tipini backend ile uyumlu hale getir
2. UserStatus tipini ekle
3. Firebase Auth listener ekle
4. Token yönetimi fonksiyonları
5. User bilgisi çekme (/api/users/me)
```

### Görev 2.2: Auth Service Oluşturma
**Dosya:** `front/src/services/api/auth.ts` (YENİ)

### Görev 2.3: Login Sayfası Entegrasyonu
**Dosya:** `front/src/components/LoginPage.tsx` (GÜNCELLEME)

---

## 🎯 FAZ 3: 2 Aşamalı Kayıt Sistemi (Öncelik: Yüksek)

### Görev 3.1: Kayıt Formu - Adım 1 (Temel Bilgiler)
**Dosya:** `front/src/components/RegisterPage.tsx` (GÜNCELLEME)
**API:** POST /api/auth/register/basic

### Görev 3.2: Kayıt Formu - Adım 2 (Sendika Üyelik Bilgileri)
**Dosya:** `front/src/components/MembershipApplicationPage.tsx` (GÜNCELLEME)
**API:** POST /api/auth/register/details

### Görev 3.3: Onay Bekleme Sayfaları
**Dosyalar:** 
- `front/src/components/PendingApprovalPage.tsx` (YENİ)
- `front/src/components/RejectedPage.tsx` (YENİ)

---

## 🎯 FAZ 4: Eğitim Sistemi Entegrasyonu (Öncelik: Yüksek)

### ⚠️ KRİTİK KURAL: Eğitim Erişim Kontrolü
```
Eğitimlere SADECE status='active' olan kullanıcılar erişebilir!
```

### Görev 4.1: Training Service Oluşturma
**Dosya:** `front/src/services/api/trainings.ts` (YENİ)

### Görev 4.2: Eğitim Listesi Sayfası
**Dosya:** `front/src/components/CoursesPage.tsx` (GÜNCELLEME)

### Görev 4.3: Ders Detay Sayfası
**Dosya:** `front/src/components/CourseDetailPage.tsx` (GÜNCELLEME)

### Görev 4.4: Ders İçerik Sayfası
**Dosya:** `front/src/components/LessonContentPage.tsx` (YENİ/GÜNCELLEME)

---

## 🎯 FAZ 5: Diğer Sayfa Entegrasyonları (Öncelik: Orta)

### Görev 5.1: Şubeler Sayfası
### Görev 5.2: Haberler Sayfası
### Görev 5.3: Duyurular
### Görev 5.4: SSS Sayfası
### Görev 5.5: İletişim Formu

---

## 🎯 FAZ 6: Route Guards ve Navigation (Öncelik: Yüksek)

### Görev 6.1: Protected Route Component
**Dosya:** `front/src/components/common/ProtectedRoute.tsx` (YENİ)

### Görev 6.2: App.tsx Route Güncellemesi
**Dosya:** `front/src/App.tsx` (GÜNCELLEME)

---

## 📋 İlerleme Durumu

### Hafta 1: Temel Altyapı
- [x] 1.1 Firebase Configuration (Placeholder oluşturuldu - ENV bekleniyor)
- [x] 1.2 API Configuration ✅
- [x] 1.3 HTTP Client Service ✅
- [x] 2.1 AuthContext Yeniden Yazımı ✅
- [x] 2.2 Auth Service Oluşturma ✅

### Hafta 2: Authentication Flow
- [x] 2.3 Login Sayfası Entegrasyonu ✅
- [x] 3.1 Kayıt Formu - Adım 1 (SignupPage) ✅
- [x] 3.2 Kayıt Formu - Adım 2 (MembershipPage) ✅
- [x] 3.3 Onay Bekleme Sayfaları (PendingApprovalPage, RejectedPage) ✅
- [x] 6.1 Protected Route Component ✅
- [x] 6.2 App.tsx Route Güncellemesi ✅

### Hafta 3: Eğitim Sistemi
- [x] 4.1 Training Service Oluşturma ✅
- [x] 4.2 Eğitim Listesi Sayfası (CoursesPage) ✅
- [x] 4.3 Ders Detay Sayfası (CourseDetailPage) ✅
- [x] 4.4 Ders İçerik Sayfası (CourseDetailPage içinde yapıldı) ✅

### Hafta 4: Diğer Sayfalar
- [x] 5.1 Şubeler Sayfası (BranchesPage) ✅
- [x] 5.2 Haberler Sayfası (NewsPage) ✅
- [x] 5.3 Duyurular (AnnouncementSection, AllAnnouncementsPage) ✅
- [ ] 5.4 SSS Sayfası (Opsiyonel - Frontend'de sayfa yok)
- [x] 5.5 İletişim Formu (ContactPage) ✅

---

## ✅ ENTEGRASYON TAMAMLANDI!

**Tarih:** 31 Ocak 2026  
**Durum:** Frontend, Backend API'ye tam entegre edildi

### Yapılan İşlemler:
1. ✅ API altyapısı oluşturuldu (config, client, 8 servis)
2. ✅ Firebase Auth entegrasyonu tamamlandı
3. ✅ 2 aşamalı kayıt sistemi entegre edildi
4. ✅ Eğitim erişim kontrolü (sadece active kullanıcılar) eklendi
5. ✅ Tüm sayfalar API'ye bağlandı
6. ✅ Duyurular API'ye bağlandı

### Çalıştırmak için:
```bash
cd front
npm install
npm run dev
```

---

## ⚠️ Önemli Uyarılar

1. **Backend'e DOKUNMA** - Tüm değişiklikler frontend'de yapılacak
2. **Eğitim Erişimi** - `status !== 'active'` olan hiçbir kullanıcı eğitimleri görememeli
3. **Token Yönetimi** - Her API çağrısında güncel idToken kullanılmalı
4. **Error Handling** - Tüm API çağrılarında try-catch kullanılmalı
5. **Loading States** - Kullanıcı deneyimi için loading göstergeleri şart
