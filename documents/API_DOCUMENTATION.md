# SendikaApp API Dokümantasyonu

## 📋 İçindekiler

- [Genel Bilgiler](#genel-bilgiler)
- [Authentication](#authentication)
- [Auth Endpoints](#auth-endpoints)
- [User Endpoints](#user-endpoints)
- [News Endpoints](#news-endpoints)
- [Branch Endpoints](#branch-endpoints)
- [File Upload Endpoints](#file-upload-endpoints)
- [Validation Kuralları](#validation-kuralları)
- [Hata Kodları](#hata-kodları)

---

## Genel Bilgiler

### Base URL
```
http://localhost:3001/api
```

### Authentication
Tüm endpoint'ler (health hariç) `Authorization` header'ı gerektirir:
```
Authorization: Bearer <firebase-id-token>
```

### Response Format
Tüm başarılı response'lar:
```json
{
  "success": true,
  "message": "İşlem başarılı",
  "data": { ... },
  "code": "SUCCESS_CODE"
}
```

Hata response'ları:
```json
{
  "success": false,
  "message": "Hata mesajı",
  "code": "ERROR_CODE",
  "details": "Detaylı hata bilgisi (sadece development'ta)"
}
```

---

## Auth Endpoints

### 1. Health Check
**Endpoint:** `GET /api/health`  
**Auth:** Gerekmez  
**Açıklama:** API'nin çalışıp çalışmadığını kontrol eder.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "SendikaApp Backend"
}
```

---

### 2. Register - Basic (Temel Kayıt)
**Endpoint:** `POST /api/auth/register/basic`  
**Auth:** Gerekmez  
**Açıklama:** Kullanıcının temel bilgileriyle kayıt olmasını sağlar.

**Request Body:**
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@example.com",
  "password": "SecurePass123",
  "birthDate": "1990-01-01",
  "gender": "male"
}
```

**Validation Kuralları:**
- `firstName`: Zorunlu, en az 2 karakter, en fazla 50 karakter, sadece harf ve Türkçe karakterler
- `lastName`: Zorunlu, en az 2 karakter, en fazla 50 karakter, sadece harf ve Türkçe karakterler
- `email`: Zorunlu, geçerli email formatı
- `password`: Zorunlu, en az 8 karakter, en az 1 büyük harf, en az 1 küçük harf, en az 1 rakam
- `birthDate`: Zorunlu, ISO format (YYYY-MM-DD), en az 18 yaşında, en fazla 120 yaşında
- `gender`: Zorunlu, sadece `"male"` veya `"female"`

**Response (201):**
```json
{
  "success": true,
  "uid": "user-uid-123",
  "message": "Kayıt başarılı! Custom token ile Firebase Auth'a sign in yapabilirsiniz.",
  "nextStep": "/register/details",
  "customToken": "firebase-custom-token",
  "email": "ahmet@example.com"
}
```

---

### 3. Register - Details (Detaylı Bilgiler)
**Endpoint:** `POST /api/auth/register/details`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Kullanıcının detaylı bilgilerini ekler.

**Request Body:**
```json
{
  "branchId": "branch-id-123",
  "tcKimlikNo": "12345678901",
  "fatherName": "Mehmet",
  "motherName": "Ayşe",
  "birthPlace": "İstanbul",
  "education": "lise",
  "kurumSicil": "12345",
  "kadroUnvani": "Memur",
  "kadroUnvanKodu": "M001",
  "phone": "05551234567",
  "address": "Örnek Mahalle, Örnek Sokak No:1",
  "city": "İstanbul",
  "district": "Kadıköy"
}
```

**Validation Kuralları:**
- `branchId`: Zorunlu, geçerli branch ID olmalı, branch aktif olmalı
- `tcKimlikNo`: Opsiyonel, 11 haneli, TC Kimlik algoritma kontrolü, başka kullanıcıda kullanılmamalı
- `phone`: Opsiyonel, Türkiye telefon formatı (`+90` veya `0` ile başlayan 10 haneli)
- `education`: Opsiyonel, sadece `"ilkögretim"`, `"lise"`, `"yüksekokul"`

**Response (200):**
```json
{
  "success": true,
  "message": "Detaylar kaydedildi! Şube onayı bekleniyor.",
  "user": {
    "uid": "user-uid-123",
    "status": "pending_branch_review"
  }
}
```

---

### 4. Password Change (Şifre Değiştir)
**Endpoint:** `POST /api/auth/password/change`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Kullanıcının şifresini değiştirir.

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

**Validation Kuralları:**
- `currentPassword`: Zorunlu
- `newPassword`: Zorunlu, mevcut şifre ile aynı olamaz, en az 8 karakter, en az 1 büyük harf, en az 1 küçük harf, en az 1 rakam

**Response (200):**
```json
{
  "success": true,
  "message": "Şifre başarıyla değiştirildi"
}
```

---

### 5. Password Reset Request (Şifre Sıfırlama İsteği)
**Endpoint:** `POST /api/auth/password/reset-request`  
**Auth:** Gerekmez  
**Açıklama:** Şifre sıfırlama linki oluşturur.

**Request Body:**
```json
{
  "email": "ahmet@example.com"
}
```

**Validation Kuralları:**
- `email`: Zorunlu, geçerli email formatı

**Response (200):**
```json
{
  "success": true,
  "message": "Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderildi",
  "resetLink": "https://..." // Sadece development'ta
}
```

---

### 6. Verify Email - Send (E-posta Doğrulama Linki Gönder)
**Endpoint:** `POST /api/auth/verify-email/send`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** E-posta doğrulama linki oluşturur.

**Request Body:** Yok

**Response (200):**
```json
{
  "success": true,
  "message": "E-posta doğrulama linki oluşturuldu",
  "verificationLink": "https://..." // Sadece development'ta
}
```

---

## User Endpoints

### 8. Get Current User (Kendi Bilgilerini Getir)
**Endpoint:** `GET /api/users/me`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Giriş yapmış kullanıcının kendi bilgilerini getirir.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "uid": "user-uid-123",
    "email": "ahmet@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "role": "user",
    "status": "active",
    "isActive": true,
    ...
  }
}
```

---

### 9. Update Current User (Kendi Bilgilerini Güncelle)
**Endpoint:** `PUT /api/users/me`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Giriş yapmış kullanıcının kendi bilgilerini günceller.

**Request Body:**
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "birthDate": "1990-01-01",
  "gender": "male",
  "phone": "05551234567",
  "tcKimlikNo": "12345678901",
  "fatherName": "Mehmet",
  "motherName": "Ayşe",
  "birthPlace": "İstanbul",
  "education": "lise",
  "address": "Örnek Mahalle",
  "city": "İstanbul",
  "district": "Kadıköy",
  "kurumSicil": "12345",
  "kadroUnvani": "Memur",
  "kadroUnvanKodu": "M001"
}
```

**Validation Kuralları:**
- `firstName`: Opsiyonel, en az 2 karakter, en fazla 50 karakter, sadece harf ve Türkçe karakterler
- `lastName`: Opsiyonel, en az 2 karakter, en fazla 50 karakter, sadece harf ve Türkçe karakterler
- `birthDate`: Opsiyonel, ISO format, en az 18 yaşında, en fazla 120 yaşında
- `gender`: Opsiyonel, sadece `"male"` veya `"female"`
- `phone`: Opsiyonel, Türkiye telefon formatı
- `tcKimlikNo`: Opsiyonel, 11 haneli, TC Kimlik algoritma kontrolü, başka kullanıcıda kullanılmamalı
- `fatherName`: Opsiyonel, en az 2 karakter, sadece harf ve Türkçe karakterler
- `motherName`: Opsiyonel, en az 2 karakter, sadece harf ve Türkçe karakterler
- `education`: Opsiyonel, sadece `"ilkögretim"`, `"lise"`, `"yüksekokul"`

**Güncellenemeyen Alanlar:**
- `uid`, `email`, `role`, `status`, `createdAt`, `branchId`, `isActive`

**Response (200):**
```json
{
  "success": true,
  "message": "Bilgileriniz başarıyla güncellendi",
  "user": {
    "uid": "user-uid-123",
    ...
  }
}
```

---

### 10. Get Users List (Kullanıcı Listesi)
**Endpoint:** `GET /api/users`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Kullanıcı listesini getirir.

**Query Parameters:**
- `status`: Kullanıcı durumu filtresi (`pending_details`, `pending_branch_review`, `pending_admin_approval`, `active`, `rejected`)
- `role`: Rol filtresi (`admin`, `branch_manager`, `user`)
- `branchId`: Şube ID filtresi (sadece Admin)
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20)
- `search`: Arama metni (isim veya email)

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "uid": "user-uid-123",
      "email": "ahmet@example.com",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### 11. Create User (Kullanıcı Oluştur)
**Endpoint:** `POST /api/users`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Yeni kullanıcı oluşturur.

**Request Body:**
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@example.com",
  "password": "SecurePass123",
  "role": "user",
  "branchId": "branch-id-123",
  "status": "active",
  "birthDate": "1990-01-01",
  "gender": "male",
  "phone": "05551234567"
}
```

**Validation Kuralları:**
- `firstName`: Zorunlu, en az 2 karakter, en fazla 50 karakter
- `lastName`: Zorunlu, en az 2 karakter, en fazla 50 karakter
- `email`: Zorunlu, geçerli email formatı
- `password`: Zorunlu, en az 8 karakter, en az 1 büyük harf, en az 1 küçük harf, en az 1 rakam
- `role`: Opsiyonel, default: `"user"` (Branch Manager sadece `"user"` oluşturabilir)
- `branchId`: Opsiyonel (Branch Manager için otomatik atanır)
- `status`: Opsiyonel, default: Admin için `"active"`, Branch Manager için `"pending_admin_approval"`

**Response (201):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "user": {
    "uid": "user-uid-123",
    "email": "ahmet@example.com",
    "role": "user",
    "status": "active"
  }
}
```

---

### 12. Get User by ID (Kullanıcı Detayı)
**Endpoint:** `GET /api/users/[id]`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir kullanıcının detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "uid": "user-uid-123",
    "email": "ahmet@example.com",
    ...
  }
}
```

---

### 13. Delete User (Kullanıcı Sil)
**Endpoint:** `DELETE /api/users/[id]`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Kullanıcıyı kalıcı olarak siler (hard delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Kullanıcı kalıcı olarak silindi"
}
```

---

### 14. Update User Status (Kullanıcı Durumu Güncelle)
**Endpoint:** `PATCH /api/users/[id]/status`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Kullanıcının durumunu günceller.

**Request Body:**
```json
{
  "status": "active",
  "rejectionReason": "Reddetme nedeni (sadece rejected durumunda)"
}
```

**Validation Kuralları:**
- `status`: Zorunlu, sadece geçerli status değerleri
- `rejectionReason`: Zorunlu (sadece `status: "rejected"` ise)

**Status Değerleri:**
- `pending_details`: Detaylar bekleniyor
- `pending_branch_review`: Şube onayı bekleniyor
- `pending_admin_approval`: Admin onayı bekleniyor
- `active`: Aktif
- `rejected`: Reddedildi

**Branch Manager Yetkileri:**
- Sadece `pending_branch_review` durumundaki kullanıcıları `pending_admin_approval` veya `pending_details` yapabilir
- `active` ve `rejected` yapamaz

**Response (200):**
```json
{
  "success": true,
  "message": "Kullanıcı durumu başarıyla güncellendi",
  "user": {
    "uid": "user-uid-123",
    "status": "active",
    "previousStatus": "pending_admin_approval"
  }
}
```

---

### 15. Update User Role (Kullanıcı Rolü Güncelle)
**Endpoint:** `PATCH /api/users/[id]/role`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Kullanıcının rolünü günceller.

**Request Body:**
```json
{
  "role": "branch_manager",
  "branchId": "branch-id-123"
}
```

**Validation Kuralları:**
- `role`: Zorunlu, sadece `"admin"`, `"branch_manager"`, `"user"`
- `branchId`: Zorunlu (sadece `role: "branch_manager"` ise), geçerli branch ID olmalı

**Response (200):**
```json
{
  "success": true,
  "message": "Kullanıcı rolü başarıyla güncellendi",
  "user": {
    "uid": "user-uid-123",
    "role": "branch_manager",
    "branchId": "branch-id-123",
    "previousRole": "user"
  }
}
```

---

### 16. Update User Branch (Kullanıcı Şube Ataması)
**Endpoint:** `PATCH /api/users/[id]/branch`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Kullanıcının şube atamasını günceller.

**Request Body:**
```json
{
  "branchId": "branch-id-123"
}
```
veya şube atamasını kaldırmak için:
```json
{
  "branchId": null
}
```

**Validation Kuralları:**
- `branchId`: Zorunlu (null gönderilebilir), geçerli branch ID olmalı, branch aktif olmalı

**Response (200):**
```json
{
  "success": true,
  "message": "Şube ataması başarıyla güncellendi",
  "user": {
    "uid": "user-uid-123",
    "branchId": "branch-id-123",
    "previousBranchId": "old-branch-id"
  }
}
```

---

### 17. Activate User (Kullanıcı Aktif Et)
**Endpoint:** `PATCH /api/users/[id]/activate`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Kullanıcıyı aktif eder.

**Response (200):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla aktif edildi",
  "user": {
    "uid": "user-uid-123",
    "isActive": true
  }
}
```

---

### 18. Deactivate User (Kullanıcı Deaktif Et)
**Endpoint:** `PATCH /api/users/[id]/deactivate`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager, User (sadece kendi hesabı)  
**Açıklama:** Kullanıcıyı deaktif eder.

**Response (200):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla deaktif edildi",
  "user": {
    "uid": "user-uid-123",
    "isActive": false
  }
}
```

---

### 19. Get User Stats (Kullanıcı İstatistikleri)
**Endpoint:** `GET /api/users/stats`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Kullanıcı istatistiklerini getirir.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "active": 80,
    "inactive": 20,
    "pending": 10,
    "rejected": 5,
    "byRole": {
      "admin": 2,
      "branch_manager": 5,
      "user": 93
    },
    "byStatus": {
      "pending_details": 3,
      "pending_branch_review": 4,
      "pending_admin_approval": 3,
      "active": 80,
      "rejected": 5
    }
  }
}
```

---

### 19.5. Bulk User Operations (Kullanıcı Toplu İşlemler)
**Endpoint:** `POST /api/users/bulk`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Birden fazla kullanıcı için toplu işlem yapar (delete, activate, deactivate).

**İşlem Tipleri:**
- `delete`: Kullanıcıları kalıcı olarak siler (sadece Admin)
- `activate`: Kullanıcıları aktif eder
- `deactivate`: Kullanıcıları deaktif eder

**Yetki Kısıtlamaları:**
- **Delete:** Sadece Admin yapabilir
- **Activate/Deactivate:** Admin ve Branch Manager yapabilir (Branch Manager sadece kendi şubesindeki kullanıcıları işleyebilir)

**Request Body:**
```json
{
  "action": "activate",
  "userIds": ["user-id-1", "user-id-2", "user-id-3"]
}
```

**Validation Kuralları:**
- `action`: Zorunlu, sadece `"delete"`, `"activate"`, `"deactivate"`
- `userIds`: Zorunlu, array, en az 1, en fazla 100 kullanıcı
- Kendi hesabınızı delete veya deactivate edemezsiniz

**Response (200 - Tüm işlemler başarılı):**
```json
{
  "success": true,
  "message": "3 kullanıcı için toplu işlem başarıyla tamamlandı",
  "data": {
    "success": true,
    "successCount": 3,
    "failureCount": 0
  },
  "code": "BULK_USER_ACTION_SUCCESS"
}
```

**Response (207 - Kısmi başarı):**
```json
{
  "success": true,
  "message": "Toplu işlem kısmen tamamlandı. Başarılı: 2, Başarısız: 1",
  "data": {
    "success": false,
    "successCount": 2,
    "failureCount": 1,
    "errors": [
      {
        "userId": "user-id-3",
        "error": "Kullanıcı bulunamadı"
      }
    ]
  },
  "code": "BULK_USER_ACTION_PARTIAL"
}
```

**Hata Örnekleri:**
- Kullanıcı bulunamadı
- Bu kullanıcıya erişim yetkiniz yok (Branch Manager başka şube kullanıcısını işlemeye çalışırsa)
- Kendi hesabınızı bu işlem için seçemezsiniz
- Kullanıcı zaten aktif/deaktif

---

## News Endpoints

### 20. Get News List (Haber Listesi)
**Endpoint:** `GET /api/news`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Haber listesini getirir.

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20)
- `isPublished`: Yayın durumu filtresi (`true` veya `false`)
- `isFeatured`: Öne çıkan haber filtresi (`true` veya `false`)
- `search`: Başlık arama metni

**Response (200):**
```json
{
  "success": true,
  "news": [
    {
      "id": "news-id-123",
      "title": "Haber Başlığı",
      "content": "<p>Haber içeriği</p>",
      "imageUrl": "https://storage.example.com/news/image.jpg",
      "isPublished": true,
      "isFeatured": false,
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": "admin-uid-123",
      "updatedBy": "admin-uid-123"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### 21. Create News (Haber Oluştur)
**Endpoint:** `POST /api/news`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Yeni haber oluşturur.

**Request Body:**
```json
{
  "title": "Yeni Haber Başlığı",
  "content": "<p>Haber içeriği HTML formatında</p>",
  "imageUrl": "https://storage.example.com/news/image.jpg",
  "isPublished": false,
  "isFeatured": false
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `content`: Zorunlu, HTML formatında içerik
- `isPublished`: Opsiyonel, default: `false`
- `isFeatured`: Opsiyonel, default: `false`

**Response (201):**
```json
{
  "success": true,
  "message": "Haber başarıyla oluşturuldu",
  "news": {
    "id": "news-id-123",
    "title": "Yeni Haber Başlığı",
    ...
  }
}
```

---

### 22. Get News by ID (Haber Detayı)
**Endpoint:** `GET /api/news/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Belirli bir haberin detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "news": {
    "id": "news-id-123",
    "title": "Haber Başlığı",
    ...
  }
}
```

---

### 23. Update News (Haber Güncelle)
**Endpoint:** `PUT /api/news/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Haber bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "content": "<p>Güncellenmiş içerik</p>",
  "isPublished": true,
  "isFeatured": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Haber başarıyla güncellendi",
  "news": {
    "id": "news-id-123",
    ...
  }
}
```

---

### 24. Delete News (Haber Sil)
**Endpoint:** `DELETE /api/news/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Haberi kalıcı olarak siler (hard delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Haber kalıcı olarak silindi"
}
```

---

### 25. Bulk News Operations (Haber Toplu İşlemler)
**Endpoint:** `POST /api/news/bulk`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Birden fazla haber için toplu işlem yapar (delete, publish, unpublish).

**İşlem Tipleri:**
- `delete`: Haberleri kalıcı olarak siler
- `publish`: Haberleri yayınlar
- `unpublish`: Haberleri yayından kaldırır

**Request Body:**
```json
{
  "action": "publish",
  "newsIds": ["news-id-1", "news-id-2", "news-id-3"]
}
```

**Validation Kuralları:**
- `action`: Zorunlu, sadece `"delete"`, `"publish"`, `"unpublish"`
- `newsIds`: Zorunlu, array, en az 1, en fazla 100 haber

**Response (200 - Tüm işlemler başarılı):**
```json
{
  "success": true,
  "message": "3 haber için toplu işlem başarıyla tamamlandı",
  "data": {
    "success": true,
    "successCount": 3,
    "failureCount": 0
  },
  "code": "BULK_NEWS_ACTION_SUCCESS"
}
```

**Response (207 - Kısmi başarı):**
```json
{
  "success": true,
  "message": "Toplu işlem kısmen tamamlandı. Başarılı: 2, Başarısız: 1",
  "data": {
    "success": false,
    "successCount": 2,
    "failureCount": 1,
    "errors": [
      {
        "newsId": "news-id-3",
        "error": "Haber bulunamadı"
      }
    ]
  },
  "code": "BULK_NEWS_ACTION_PARTIAL"
}
```

---

## Announcements Endpoints

### 25. Get Announcements List (Duyuru Listesi)
**Endpoint:** `GET /api/announcements`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Duyuru listesini getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Tüm duyurular (yayında + taslak)
- **Branch Manager/User:** Sadece yayınlanan duyurular

**Query Parameters:**
- `page` (opsiyonel): Sayfa numarası (default: 1)
- `limit` (opsiyonel): Sayfa başına kayıt sayısı (default: 20, max: 100)
- `isPublished` (opsiyonel): Yayın durumu filtresi (sadece admin)
- `isFeatured` (opsiyonel): Öne çıkan duyuru filtresi (sadece admin)
- `search` (opsiyonel): Başlık arama metni

**Response (200):**
```json
{
  "success": true,
  "announcements": [
    {
      "id": "announcement-id-123",
      "title": "Duyuru Başlığı",
      "content": "<p>Duyuru içeriği</p>",
      "externalUrl": null,
      "imageUrl": "https://storage.example.com/announcements/image.jpg",
      "isPublished": true,
      "isFeatured": false,
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": "admin-uid-123",
      "updatedBy": "admin-uid-123"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### 26. Create Announcement (Duyuru Oluştur)
**Endpoint:** `POST /api/announcements`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Yeni duyuru oluşturur.

**Request Body:**
```json
{
  "title": "Yeni Duyuru Başlığı",
  "content": "<p>Duyuru içeriği HTML formatında</p>",
  "imageUrl": "https://storage.example.com/announcements/image.jpg",
  "isPublished": false,
  "isFeatured": false
}
```

veya dış link için:
```json
{
  "title": "Yeni Duyuru Başlığı",
  "externalUrl": "https://example.com/announcement",
  "imageUrl": "https://storage.example.com/announcements/image.jpg",
  "isPublished": false,
  "isFeatured": false
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `content` veya `externalUrl`: En az biri zorunlu (ikisi birlikte olamaz)
- `imageUrl`: Opsiyonel
- `isPublished`: Opsiyonel, default: `false`
- `isFeatured`: Opsiyonel, default: `false`

**Response (201):**
```json
{
  "success": true,
  "message": "Duyuru başarıyla oluşturuldu",
  "announcement": {
    "id": "announcement-id-123",
    "title": "Yeni Duyuru Başlığı",
    ...
  }
}
```

---

### 27. Get Announcement by ID (Duyuru Detayı)
**Endpoint:** `GET /api/announcements/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Belirli bir duyurunun detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "announcement": {
    "id": "announcement-id-123",
    "title": "Duyuru Başlığı",
    ...
  }
}
```

---

### 28. Update Announcement (Duyuru Güncelle)
**Endpoint:** `PUT /api/announcements/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Duyuru bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "content": "<p>Güncellenmiş içerik</p>",
  "isPublished": true,
  "isFeatured": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Duyuru başarıyla güncellendi",
  "announcement": {
    "id": "announcement-id-123",
    ...
  }
}
```

---

### 29. Delete Announcement (Duyuru Sil)
**Endpoint:** `DELETE /api/announcements/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Duyuruyu kalıcı olarak siler.

**Response (200):**
```json
{
  "success": true,
  "message": "Duyuru başarıyla silindi"
}
```

---

### 30. Bulk Announcement Actions (Duyuru Toplu İşlemler)
**Endpoint:** `POST /api/announcements/bulk`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Birden fazla duyuru için toplu işlem yapar.

**Request Body:**
```json
{
  "action": "delete",
  "announcementIds": ["announcement-id-1", "announcement-id-2", "announcement-id-3"]
}
```

**İşlem Tipleri:**
- `delete`: Duyuruları kalıcı olarak sil
- `publish`: Duyuruları yayınla
- `unpublish`: Duyuruları yayından kaldır

**Response (200 - Tüm işlemler başarılı):**
```json
{
  "success": true,
  "message": "3 duyuru için toplu işlem başarıyla tamamlandı",
  "data": {
    "success": true,
    "successCount": 3,
    "failureCount": 0
  },
  "code": "BULK_ANNOUNCEMENT_ACTION_SUCCESS"
}
```

**Response (207 - Kısmi başarı):**
```json
{
  "success": true,
  "message": "Toplu işlem kısmen tamamlandı. Başarılı: 2, Başarısız: 1",
  "data": {
    "success": false,
    "successCount": 2,
    "failureCount": 1,
    "errors": [
      {
        "announcementId": "announcement-id-3",
        "error": "Duyuru bulunamadı"
      }
    ]
  },
  "code": "BULK_ANNOUNCEMENT_ACTION_PARTIAL"
}
```

---

## Branch Endpoints

### 26. Get Branches List (Şube Listesi)
**Endpoint:** `GET /api/branches`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Şube listesini getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Tüm şubeler (aktif + pasif), manager bilgileri ile
- **Branch Manager:** Sadece kendi şubesi, manager bilgileri ile
- **User:** Sadece aktif şubeler, manager bilgileri olmadan

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20)

**Response (200):**
```json
{
  "success": true,
  "branches": [
    {
      "id": "branch-id-123",
      "name": "İstanbul Şubesi",
      "code": "IST-001",
      "address": "Örnek Mahalle",
      "city": "İstanbul",
      "district": "Kadıköy",
      "phone": "02121234567",
      "email": "istanbul@sendika.com",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "managers": [
        {
          "uid": "manager-uid-123",
          "firstName": "Mehmet",
          "lastName": "Demir",
          "email": "mehmet@example.com"
        }
      ]
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### 27. Get Branch by ID (Şube Detayı)
**Endpoint:** `GET /api/branches/[id]`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir şubenin detaylarını getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Tüm şubeleri görebilir (aktif + pasif), manager bilgileri ile
- **Branch Manager:** Sadece kendi şubesini görebilir, manager bilgileri ile
- **User:** Sadece aktif şubeleri görebilir, manager bilgileri olmadan

**Response (200):**
```json
{
  "success": true,
  "branch": {
    "id": "branch-id-123",
    "name": "İstanbul Şubesi",
    "code": "IST-001",
    "address": "Örnek Mahalle",
    "city": "İstanbul",
    "district": "Kadıköy",
    "phone": "02121234567",
    "email": "istanbul@sendika.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "managers": [
      {
        "uid": "manager-uid-123",
        "firstName": "Mehmet",
        "lastName": "Demir",
        "email": "mehmet@example.com"
      }
    ]
  }
}
```

---

### 28. Create Branch (Şube Oluştur)
**Endpoint:** `POST /api/branches`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Yeni şube oluşturur.

**Request Body:**
```json
{
  "name": "İstanbul Şubesi",
  "code": "IST-001",
  "address": "Örnek Mahalle, Örnek Sokak No:1",
  "city": "İstanbul",
  "district": "Kadıköy",
  "phone": "02121234567",
  "email": "istanbul@sendika.com"
}
```

**Validation Kuralları:**
- `name`: Zorunlu, en az 2 karakter, en fazla 100 karakter
- `code`: Opsiyonel, en az 1 karakter, en fazla 20 karakter, sadece harf, rakam, tire (`-`) ve alt çizgi (`_`)
- `email`: Opsiyonel, geçerli email formatı
- `phone`: Opsiyonel, Türkiye telefon formatı

**Response (201):**
```json
{
  "success": true,
  "branch": {
    "id": "branch-id-123",
    "name": "İstanbul Şubesi",
    "code": "IST-001",
    "address": "Örnek Mahalle, Örnek Sokak No:1",
    "city": "İstanbul",
    "district": "Kadıköy",
    "phone": "02121234567",
    "email": "istanbul@sendika.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Şube başarıyla oluşturuldu"
}
```

---

### 29. Update Branch (Şube Güncelle)
**Endpoint:** `PUT /api/branches/[id]`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Şube bilgilerini günceller.

**Request Body:**
```json
{
  "name": "İstanbul Şubesi - Yeni",
  "code": "IST-002",
  "address": "Yeni Adres",
  "city": "İstanbul",
  "district": "Beşiktaş",
  "phone": "02129876543",
  "email": "istanbul-yeni@sendika.com",
  "isActive": true
}
```

**Validation Kuralları:**
- `name`: Opsiyonel (undefined değilse), en az 2 karakter, en fazla 100 karakter
- `code`: Opsiyonel, en az 1 karakter, en fazla 20 karakter, sadece harf, rakam, tire ve alt çizgi
- `email`: Opsiyonel, geçerli email formatı
- `phone`: Opsiyonel, Türkiye telefon formatı
- `isActive`: Opsiyonel, boolean

**Response (200):**
```json
{
  "success": true,
  "branch": {
    "id": "branch-id-123",
    ...
  },
  "message": "Şube başarıyla güncellendi"
}
```

---

### 30. Delete Branch (Şube Sil)
**Endpoint:** `DELETE /api/branches/[id]`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Şubeyi kalıcı olarak siler (hard delete). Şubeye bağlı kullanıcı varsa silinemez.

**Response (200):**
```json
{
  "success": true,
  "message": "Şube başarıyla silindi"
}
```

---

### 31. Get User Registration Logs (Kullanıcı Kayıt Logları)
**Endpoint:** `GET /api/users/[id]/logs`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager, User (sadece kendi logları)  
**Açıklama:** Kullanıcının kayıt sürecindeki tüm loglarını getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Herkesin loglarını görebilir
- **Branch Manager:** Sadece kendi şubesindeki kullanıcıların loglarını görebilir
- **User:** Sadece kendi loglarını görebilir

**Response (200):**
```json
{
  "success": true,
  "message": "Kayıt logları başarıyla alındı",
  "logs": [
    {
      "id": "log-id-123",
      "userId": "user-uid-123",
      "action": "register_basic",
      "performedBy": "user-uid-123",
      "performedByRole": "user",
      "previousStatus": null,
      "newStatus": "pending_details",
      "note": null,
      "documentUrl": null,
      "metadata": {
        "email": "ahmet@example.com"
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "log-id-124",
      "userId": "user-uid-123",
      "action": "branch_manager_approval",
      "performedBy": "manager-uid-123",
      "performedByRole": "branch_manager",
      "previousStatus": "pending_branch_review",
      "newStatus": "pending_admin_approval",
      "note": "Başvuru onaylandı",
      "documentUrl": "https://storage.example.com/form.pdf",
      "metadata": null,
      "timestamp": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Log Action Türleri:**
- `register_basic`: Temel kayıt işlemi
- `register_details`: Detaylı bilgilerin eklenmesi
- `branch_manager_approval`: Şube müdürü onayı
- `admin_approval`: Admin onayı
- `admin_rejection`: Admin reddi
- `admin_return`: Admin'in geri göndermesi
- `branch_manager_return`: Şube müdürünün geri göndermesi

---

## File Upload Endpoints

### 32. Upload File (Dosya Yükle)
**Endpoint:** `POST /api/files/{category}/upload`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Kategoriye göre değişir (aşağıda detaylı)  
**Content-Type:** `multipart/form-data`  
**Açıklama:** Belirtilen kategoride dosya yükler. Firebase Storage'a yüklenir ve public URL döner.

---

#### Kategoriler ve Özellikleri

##### 1. `news` - Haber Görselleri

**Yetki:** Sadece Admin

**Dosya Formatları:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)

**Dosya Boyutu:**
- Maksimum: 10MB

**Storage Path:**
```
news/{timestamp}-{sanitized-filename}
```

**Request Örneği:**
```bash
POST /api/files/news/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [binary image data]
```

---

##### 2. `announcements` - Duyuru Görselleri

**Yetki:** Sadece Admin

**Dosya Formatları:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)

**Dosya Boyutu:**
- Maksimum: 10MB

**Storage Path:**
```
announcements/{timestamp}-{sanitized-filename}
```

**Request Örneği:**
```bash
POST /api/files/announcements/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [binary image data]
```

---

##### 3. `user-documents` - Kullanıcı Belgeleri

**Yetki:** Admin, Branch Manager

**Dosya Formatları:**
- PDF (`.pdf`)

**Dosya Boyutu:**
- Maksimum: 10MB

**Storage Path:**
```
user-documents/{userId}/{timestamp}-{sanitized-filename}
```

**⚠️ ÖNEMLİ:** Bu kategori için `userId` parametresi **zorunludur**.

**Request Örneği:**
```bash
POST /api/files/user-documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [binary PDF data]
userId: user-uid-123
```

**Request Body (Form Data):**
```
file: [binary file]
userId: user-uid-123  ← ZORUNLU
```

---

#### Request Format

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File (binary) | ✅ Evet | Yüklenecek dosya |
| `userId` | String | ⚠️ Sadece `user-documents` için | Kullanıcı ID'si |

---

#### Response Format

**Success Response (201):**
```json
{
  "success": true,
  "message": "Görsel başarıyla yüklendi",  // veya "Döküman başarıyla yüklendi"
  "data": {
    "imageUrl": "https://storage.googleapis.com/bucket-name/news/1704067200000-filename.jpg",
    "documentUrl": "https://storage.googleapis.com/bucket-name/news/1704067200000-filename.jpg",
    "fileUrl": "https://storage.googleapis.com/bucket-name/news/1704067200000-filename.jpg",
    "fileName": "1704067200000-filename.jpg",
    "size": 1024000,
    "contentType": "image/jpeg",
    "category": "news"
  },
  "code": "IMAGE_UPLOAD_SUCCESS"  // veya "DOCUMENT_UPLOAD_SUCCESS"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `imageUrl` | String (URI) | Public URL (backward compatibility için) |
| `documentUrl` | String (URI) | Public URL (user-documents için) |
| `fileUrl` | String (URI) | Generic public URL (tüm kategoriler için) |
| `fileName` | String | Yüklenen dosyanın adı (timestamp ile birlikte) |
| `size` | Integer | Dosya boyutu (bytes) |
| `contentType` | String | Dosya MIME type (örn: `image/jpeg`, `application/pdf`) |
| `category` | String | Yüklenen dosyanın kategorisi (`news` veya `user-documents`) |

**Not:** `imageUrl`, `documentUrl` ve `fileUrl` tümü aynı değeri içerir. Backward compatibility ve farklı kullanım senaryoları için farklı isimlerle döner.

---

#### Validation Kuralları

**Kategori Validasyonu:**
- Sadece `news`, `announcements` ve `user-documents` kategorileri desteklenir
- Diğer kategoriler için 400 hatası döner

**Dosya Formatı Validasyonu:**

**news ve announcements kategorileri için:**
- MIME Type: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Uzantı: `.jpg`, `.jpeg`, `.png`, `.webp`
- Maksimum boyut: 10MB

**user-documents kategorisi için:**
- MIME Type: `application/pdf`
- Uzantı: `.pdf`
- Maksimum boyut: 10MB

**Dosya Adı Güvenliği:**
- Dosya adları otomatik olarak sanitize edilir
- Tehlikeli karakterler (`/`, `\`, `..`, vb.) temizlenir
- Timestamp eklenerek benzersizlik sağlanır (format: `{timestamp}-{original-filename}`)
- Maksimum dosya adı uzunluğu: 255 karakter

**Özel Validasyonlar:**
- `user-documents` kategorisi için `userId` parametresi zorunludur
- Dosya boş olamaz
- Dosya formatı kontrolü yapılır (MIME type ve uzantı)

---

#### Hata Durumları

**400 - Validation Error:**

```json
{
  "success": false,
  "message": "Geçersiz kategori. İzin verilen kategoriler: news, user-documents",
  "code": "VALIDATION_ERROR"
}
```

Olası hata mesajları:
- `"Dosya bulunamadı"` - Form-data'da `file` field'ı eksik
- `"Geçersiz dosya formatı"` - Desteklenmeyen dosya formatı
- `"Dosya boyutu çok büyük. Maksimum boyut: 10MB"` - Dosya limit aşımı
- `"User ID gerekli"` - `user-documents` için `userId` eksik
- `"Geçersiz kategori"` - Desteklenmeyen kategori

**401 - Unauthorized:**

```json
{
  "success": false,
  "message": "Yetkilendirme token'ı gerekli",
  "code": "AUTHENTICATION_REQUIRED"
}
```

**403 - Forbidden:**

```json
{
  "success": false,
  "message": "Bu işlem için admin yetkisi gerekli",
  "code": "UNAUTHORIZED"
}
```

- `news` kategorisi için admin olmayan kullanıcılar
- `user-documents` kategorisi için admin/branch_manager olmayan kullanıcılar

**500 - Server Error:**

```json
{
  "success": false,
  "message": "Storage yapılandırma hatası. Lütfen Firebase Storage ayarlarını kontrol edin.",
  "code": "SERVER_ERROR",
  "details": "Detaylı hata mesajı (sadece development'ta)"
}
```

Olası nedenler:
- Firebase Storage bucket yapılandırılmamış
- Bucket bulunamadı
- Dosya storage'a kaydedilemedi

---

#### Kullanım Örnekleri

##### JavaScript/TypeScript (Fetch API)

```typescript
// News görseli yükle
async function uploadNewsImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3001/api/files/news/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.data.fileUrl; // Public URL
}

// User document yükle
async function uploadUserDocument(file: File, userId: string, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId); // ZORUNLU

  const response = await fetch('http://localhost:3001/api/files/user-documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.data.documentUrl; // Public URL
}
```

##### cURL

```bash
# News görseli yükle
curl -X POST http://localhost:3001/api/files/news/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"

# User document yükle
curl -X POST http://localhost:3001/api/files/user-documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "userId=user-uid-123"
```

##### Axios

```typescript
import axios from 'axios';

// News görseli yükle
const uploadNewsImage = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    'http://localhost:3001/api/files/news/upload',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data.fileUrl;
};
```

---

#### Notlar

1. **Dosya Adı Formatı:** Yüklenen dosyalar `{timestamp}-{original-filename}` formatında saklanır. Bu sayede dosya adı çakışmaları önlenir.

2. **Public URL:** Tüm dosyalar otomatik olarak public yapılır ve direkt erişilebilir URL döner.

3. **Storage Bucket:** Firebase Storage bucket'ı environment variable (`FIREBASE_STORAGE_BUCKET`) veya default bucket kullanılır.

4. **Güvenlik:** Dosya adları sanitize edilir, tehlikeli karakterler temizlenir. Sadece belirli formatlar kabul edilir.

5. **Backward Compatibility:** Response'da `imageUrl`, `documentUrl` ve `fileUrl` alanları aynı değeri içerir. Farklı kullanım senaryoları için farklı isimlerle döner.

6. **Yetki Kontrolü:** Her kategori için yetki kontrolü yapılır. Admin olmayan kullanıcılar `news` kategorisine dosya yükleyemez.

7. **User Documents:** `user-documents` kategorisi için `userId` parametresi zorunludur ve dosyalar kullanıcı ID'sine göre klasörlendirilir.

---

## Topics Endpoints (İletişim Konuları)

### 33. Get Topics List (Konu Listesi)
**Endpoint:** `GET /api/topics`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Aktif konuları listeler. Herkes aktif konuları görebilir.

**Response (200):**
```json
{
  "success": true,
  "topics": [
    {
      "id": "topic-id-123",
      "name": "Genel Bilgi",
      "description": "Genel bilgi talepleri",
      "isVisibleToBranchManager": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 34. Create Topic (Konu Oluştur)
**Endpoint:** `POST /api/topics`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Yeni konu oluşturur.

**Request Body:**
```json
{
  "name": "Genel Bilgi",
  "isVisibleToBranchManager": true,
  "description": "Genel bilgi talepleri",
  "isActive": true
}
```

**Validation Kuralları:**
- `name`: Zorunlu, 2-100 karakter arasında
- `isVisibleToBranchManager`: Zorunlu, boolean (true = branch manager görsün, false = sadece admin görsün)
- `description`: Opsiyonel
- `isActive`: Opsiyonel, default: `true`

**Response (201):**
```json
{
  "success": true,
  "message": "Konu başarıyla oluşturuldu",
  "topic": {
    "id": "topic-id-123",
    "name": "Genel Bilgi",
    ...
  }
}
```

---

### 35. Get Topic by ID (Konu Detayı)
**Endpoint:** `GET /api/topics/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir konunun detaylarını getirir. Admin olmayan kullanıcılar sadece aktif konuları görebilir.

**Response (200):**
```json
{
  "success": true,
  "topic": {
    "id": "topic-id-123",
    "name": "Genel Bilgi",
    ...
  }
}
```

---

### 36. Update Topic (Konu Güncelle)
**Endpoint:** `PUT /api/topics/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Konu bilgilerini günceller.

**Request Body:**
```json
{
  "name": "Güncellenmiş Konu Adı",
  "isVisibleToBranchManager": false,
  "description": "Güncellenmiş açıklama",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Konu başarıyla güncellendi",
  "topic": {
    "id": "topic-id-123",
    ...
  }
}
```

---

### 37. Delete Topic (Konu Sil)
**Endpoint:** `DELETE /api/topics/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Konuyu soft delete yapar (isActive: false).

**Response (200):**
```json
{
  "success": true,
  "message": "Konu başarıyla silindi"
}
```

---

## Contact Messages Endpoints (İletişim Mesajları)

### 38. Get Contact Messages List (Mesaj Listesi)
**Endpoint:** `GET /api/contact-messages`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Mesaj listesini getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Tüm mesajları görür
- **Branch Manager:** Sadece kendi şubesindeki ve branch manager'a görünür konulara ait mesajları görür
- **User:** Sadece kendi mesajlarını görür

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20, max: 100)
- `topicId`: Konu ID filtresi
- `isRead`: Okundu filtresi (`true` veya `false`)

**Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "message-id-123",
      "userId": "user-uid-123",
      "branchId": "branch-id-123",
      "topicId": "topic-id-123",
      "message": "Mesaj içeriği",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### 39. Create Contact Message (Mesaj Oluştur)
**Endpoint:** `POST /api/contact-messages`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Yeni mesaj oluşturur.

**Request Body:**
```json
{
  "topicId": "topic-id-123",
  "message": "Mesaj içeriği"
}
```

**Validation Kuralları:**
- `topicId`: Zorunlu, geçerli ve aktif topic ID olmalı
- `message`: Zorunlu, boş olamaz, en fazla 5000 karakter

**Response (201):**
```json
{
  "success": true,
  "message": "Mesaj başarıyla gönderildi",
  "data": {
    "message": {
      "id": "message-id-123",
      ...
    }
  }
}
```

---

### 40. Get Contact Message by ID (Mesaj Detayı)
**Endpoint:** `GET /api/contact-messages/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir mesajın detaylarını getirir.

**Yetki Kontrolü:**
- **User:** Sadece kendi mesajlarını görebilir
- **Branch Manager:** Sadece kendi şubesindeki ve branch manager'a görünür konulara ait mesajları görebilir
- **Admin:** Tüm mesajları görebilir

**Response (200):**
```json
{
  "success": true,
  "message": {
    "id": "message-id-123",
    "userId": "user-uid-123",
    "topicId": "topic-id-123",
    "message": "Mesaj içeriği",
    "isRead": false,
    ...
  }
}
```

---

### 41. Update Contact Message (Mesaj Güncelle - Okundu İşaretleme)
**Endpoint:** `PUT /api/contact-messages/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin, Branch Manager  
**Açıklama:** Mesajı okundu/okunmadı olarak işaretler.

**Request Body:**
```json
{
  "isRead": true
}
```

**Validation Kuralları:**
- `isRead`: Zorunlu, boolean

**Response (200):**
```json
{
  "success": true,
  "message": "Mesaj başarıyla güncellendi",
  "data": {
    "message": {
      "id": "message-id-123",
      "isRead": true,
      "readBy": "admin-uid-123",
      "readAt": "2024-01-01T00:00:00.000Z",
      ...
    }
  }
}
```

---

## Trainings Endpoints (Eğitimler)

### 42. Get Trainings List (Eğitim Listesi)
**Endpoint:** `GET /api/trainings`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Eğitim listesini getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Tüm eğitimler (aktif + pasif)
- **Branch Manager/User:** Sadece aktif eğitimler

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20, max: 100)
- `isActive`: Aktif durum filtresi (sadece Admin)
- `search`: Başlık arama metni

**Response (200):**
```json
{
  "success": true,
  "trainings": [
    {
      "id": "training-id-123",
      "title": "Eğitim Başlığı",
      "description": "<p>Eğitim açıklaması</p>",
      "isActive": true,
      "order": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": "admin-uid-123"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### 43. Create Training (Eğitim Oluştur)
**Endpoint:** `POST /api/trainings`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Yeni eğitim oluşturur.

**Request Body:**
```json
{
  "title": "Yeni Eğitim Başlığı",
  "description": "<p>Eğitim açıklaması HTML formatında</p>",
  "isActive": true,
  "order": 1
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `description`: Opsiyonel, HTML formatında içerik
- `isActive`: Opsiyonel, default: `true`
- `order`: Opsiyonel, pozitif sayı (belirtilmezse en yüksek order + 1)

**Response (201):**
```json
{
  "success": true,
  "message": "Eğitim başarıyla oluşturuldu",
  "data": {
    "training": {
      "id": "training-id-123",
      ...
    }
  }
}
```

---

### 44. Get Training by ID (Eğitim Detayı)
**Endpoint:** `GET /api/trainings/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir eğitimin detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "training": {
    "id": "training-id-123",
    "title": "Eğitim Başlığı",
    ...
  }
}
```

---

### 45. Update Training (Eğitim Güncelle)
**Endpoint:** `PUT /api/trainings/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Eğitim bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "description": "<p>Güncellenmiş açıklama</p>",
  "isActive": true,
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Eğitim başarıyla güncellendi",
  "data": {
    "training": {
      "id": "training-id-123",
      ...
    }
  }
}
```

---

### 46. Delete Training (Eğitim Sil)
**Endpoint:** `DELETE /api/trainings/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Eğitimi kalıcı olarak siler (hard delete). Altındaki tüm dersler ve içerikler cascade olarak silinir.

**Response (200):**
```json
{
  "success": true,
  "message": "Eğitim başarıyla silindi"
}
```

---

### 47. Bulk Training Operations (Eğitim Toplu İşlemler)
**Endpoint:** `POST /api/trainings/bulk`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Birden fazla eğitim için toplu işlem yapar (delete, activate, deactivate).

**İşlem Tipleri:**
- `delete`: Eğitimleri kalıcı olarak siler (cascade ile tüm alt içerikler silinir)
- `activate`: Eğitimleri aktif eder
- `deactivate`: Eğitimleri deaktif eder

**Request Body:**
```json
{
  "action": "activate",
  "trainingIds": ["training-id-1", "training-id-2", "training-id-3"]
}
```

**Validation Kuralları:**
- `action`: Zorunlu, sadece `"delete"`, `"activate"`, `"deactivate"`
- `trainingIds`: Zorunlu, array, en az 1, en fazla 100 eğitim

**Response (200 - Tüm işlemler başarılı):**
```json
{
  "success": true,
  "message": "3 eğitim için toplu işlem başarıyla tamamlandı",
  "data": {
    "success": true,
    "successCount": 3,
    "failureCount": 0
  },
  "code": "BULK_TRAINING_ACTION_SUCCESS"
}
```

**Response (207 - Kısmi başarı):**
```json
{
  "success": true,
  "message": "Toplu işlem kısmen tamamlandı. Başarılı: 2, Başarısız: 1",
  "data": {
    "success": false,
    "successCount": 2,
    "failureCount": 1,
    "errors": [
      {
        "trainingId": "training-id-3",
        "error": "Eğitim bulunamadı"
      }
    ]
  },
  "code": "BULK_TRAINING_ACTION_PARTIAL"
}
```

---

### 48. Get Training Lessons (Eğitimin Derslerini Listele)
**Endpoint:** `GET /api/trainings/{id}/lessons`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir eğitimin derslerini listeler.

**Query Parameters:**
- `isActive`: Aktif durum filtresi (sadece Admin)

**Response (200):**
```json
{
  "success": true,
  "lessons": [
    {
      "id": "lesson-id-123",
      "trainingId": "training-id-123",
      "title": "Ders Başlığı",
      "description": "<p>Ders açıklaması</p>",
      "order": 1,
      "isActive": true,
      ...
    }
  ]
}
```

---

### 49. Create Training Lesson (Eğitime Ders Ekle)
**Endpoint:** `POST /api/trainings/{id}/lessons`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Belirli bir eğitime yeni ders ekler.

**Request Body:**
```json
{
  "title": "Yeni Ders Başlığı",
  "description": "<p>Ders açıklaması</p>",
  "isActive": true,
  "order": 1
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `description`: Opsiyonel, HTML formatında içerik
- `isActive`: Opsiyonel, default: `true`
- `order`: Opsiyonel, pozitif sayı (belirtilmezse en yüksek order + 1)

**Response (201):**
```json
{
  "success": true,
  "message": "Ders başarıyla oluşturuldu",
  "data": {
    "lesson": {
      "id": "lesson-id-123",
      ...
    }
  }
}
```

---

## Lessons Endpoints (Dersler)

### 50. Get Lesson by ID (Ders Detayı)
**Endpoint:** `GET /api/lessons/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir dersin detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "lesson": {
    "id": "lesson-id-123",
    "trainingId": "training-id-123",
    "title": "Ders Başlığı",
    "description": "<p>Ders açıklaması</p>",
    "order": 1,
    "isActive": true,
    ...
  }
}
```

---

### 51. Update Lesson (Ders Güncelle)
**Endpoint:** `PUT /api/lessons/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Ders bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "description": "<p>Güncellenmiş açıklama</p>",
  "isActive": true,
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ders başarıyla güncellendi",
  "data": {
    "lesson": {
      "id": "lesson-id-123",
      ...
    }
  }
}
```

---

### 52. Delete Lesson (Ders Sil)
**Endpoint:** `DELETE /api/lessons/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Dersi kalıcı olarak siler (hard delete). Altındaki tüm içerikler (video, document, test) cascade olarak silinir.

**Response (200):**
```json
{
  "success": true,
  "message": "Ders başarıyla silindi"
}
```

---

### 53. Get Lesson Contents (Ders İçeriklerini Listele)
**Endpoint:** `GET /api/lessons/{id}/contents`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir dersin tüm içeriklerini listeler (video, document, test birleştirilmiş).

**Query Parameters:**
- `type`: İçerik tipi filtresi (`video`, `document`, `test`)
- `isActive`: Aktif durum filtresi (sadece Admin)

**Response (200):**
```json
{
  "success": true,
  "contents": [
    {
      "id": "content-id-123",
      "type": "video",
      "lessonId": "lesson-id-123",
      "title": "Video Başlığı",
      "order": 1,
      ...
    },
    {
      "id": "content-id-124",
      "type": "document",
      "lessonId": "lesson-id-123",
      "title": "Doküman Başlığı",
      "order": 2,
      ...
    }
  ]
}
```

---

### 54. Get Lesson Videos (Ders Videolarını Listele)
**Endpoint:** `GET /api/lessons/{id}/videos`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir dersin videolarını listeler.

**Query Parameters:**
- `isActive`: Aktif durum filtresi (sadece Admin)

**Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "video-id-123",
      "type": "video",
      "lessonId": "lesson-id-123",
      "title": "Video Başlığı",
      "videoUrl": "https://example.com/video.mp4",
      "videoSource": "youtube",
      "order": 1,
      "isActive": true,
      ...
    }
  ]
}
```

---

### 55. Create Lesson Video (Derse Video Ekle)
**Endpoint:** `POST /api/lessons/{id}/videos`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Belirli bir derse yeni video ekler.

**Request Body:**
```json
{
  "title": "Video Başlığı",
  "description": "Video açıklaması",
  "videoUrl": "https://youtube.com/watch?v=...",
  "videoSource": "youtube",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "duration": 3600,
  "isActive": true,
  "order": 1
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `videoUrl`: Zorunlu, geçerli URL
- `videoSource`: Zorunlu, sadece `"youtube"` veya `"vimeo"`
- `order`: Opsiyonel, pozitif sayı

**Response (201):**
```json
{
  "success": true,
  "message": "Video başarıyla oluşturuldu",
  "data": {
    "video": {
      "id": "video-id-123",
      ...
    }
  }
}
```

---

### 56. Get Lesson Documents (Ders Dokümanlarını Listele)
**Endpoint:** `GET /api/lessons/{id}/documents`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir dersin dokümanlarını listeler.

**Query Parameters:**
- `isActive`: Aktif durum filtresi (sadece Admin)

**Response (200):**
```json
{
  "success": true,
  "documents": [
    {
      "id": "document-id-123",
      "type": "document",
      "lessonId": "lesson-id-123",
      "title": "Doküman Başlığı",
      "documentUrl": "https://example.com/doc.pdf",
      "documentType": "pdf",
      "order": 1,
      "isActive": true,
      ...
    }
  ]
}
```

---

### 57. Create Lesson Document (Derse Doküman Ekle)
**Endpoint:** `POST /api/lessons/{id}/documents`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Belirli bir derse yeni doküman ekler.

**Request Body:**
```json
{
  "title": "Doküman Başlığı",
  "description": "Doküman açıklaması",
  "documentUrl": "https://example.com/document.pdf",
  "fileSize": 1024000,
  "isActive": true,
  "order": 1
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `documentUrl`: Zorunlu, geçerli URL (PDF)
- `fileSize`: Opsiyonel, bytes cinsinden
- `order`: Opsiyonel, pozitif sayı

**Response (201):**
```json
{
  "success": true,
  "message": "Döküman başarıyla oluşturuldu",
  "data": {
    "document": {
      "id": "document-id-123",
      ...
    }
  }
}
```

---

### 58. Get Lesson Tests (Ders Testlerini Listele)
**Endpoint:** `GET /api/lessons/{id}/tests`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir dersin testlerini listeler.

**Query Parameters:**
- `isActive`: Aktif durum filtresi (sadece Admin)

**Response (200):**
```json
{
  "success": true,
  "tests": [
    {
      "id": "test-id-123",
      "type": "test",
      "lessonId": "lesson-id-123",
      "title": "Test Başlığı",
      "questions": [
        {
          "id": "q-1",
          "question": "Soru metni",
          "type": "multiple_choice",
          "options": [
            {
              "id": "opt-1",
              "text": "Seçenek 1",
              "isCorrect": true
            }
          ]
        }
      ],
      "timeLimit": 3600,
      "order": 1,
      "isActive": true,
      ...
    }
  ]
}
```

---

### 59. Create Lesson Test (Derse Test Ekle)
**Endpoint:** `POST /api/lessons/{id}/tests`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Belirli bir derse yeni test ekler.

**Request Body:**
```json
{
  "title": "Test Başlığı",
  "description": "Test açıklaması",
  "questions": [
    {
      "question": "Soru metni",
      "type": "multiple_choice",
      "options": [
        {
          "text": "Seçenek 1",
          "isCorrect": true
        },
        {
          "text": "Seçenek 2",
          "isCorrect": false
        }
      ]
    }
  ],
  "timeLimit": 3600,
  "isActive": true,
  "order": 1
}
```

**Validation Kuralları:**
- `title`: Zorunlu, en az 2 karakter, en fazla 200 karakter
- `questions`: Zorunlu, array, en az 1 soru
- `timeLimit`: Opsiyonel, saniye cinsinden
- `order`: Opsiyonel, pozitif sayı

**Response (201):**
```json
{
  "success": true,
  "message": "Test başarıyla oluşturuldu",
  "data": {
    "test": {
      "id": "test-id-123",
      ...
    }
  }
}
```

---

## Content Endpoints (İçerikler)

### 60. Get Video by ID (Video Detayı)
**Endpoint:** `GET /api/videos/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir videonun detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "video": {
    "id": "video-id-123",
    "type": "video",
    "lessonId": "lesson-id-123",
    "title": "Video Başlığı",
    "videoUrl": "https://example.com/video.mp4",
    ...
  }
}
```

---

### 61. Update Video (Video Güncelle)
**Endpoint:** `PUT /api/videos/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Video bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "description": "Güncellenmiş açıklama",
  "videoUrl": "https://example.com/new-video.mp4",
  "videoSource": "youtube",
  "isActive": true,
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Video başarıyla güncellendi",
  "data": {
    "video": {
      "id": "video-id-123",
      ...
    }
  }
}
```

---

### 62. Delete Video (Video Sil)
**Endpoint:** `DELETE /api/videos/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Videoyu kalıcı olarak siler (hard delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Video başarıyla silindi"
}
```

---

### 63. Get Document by ID (Doküman Detayı)
**Endpoint:** `GET /api/documents/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir dokümanın detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "document": {
    "id": "document-id-123",
    "type": "document",
    "lessonId": "lesson-id-123",
    "title": "Doküman Başlığı",
    "documentUrl": "https://example.com/doc.pdf",
    ...
  }
}
```

---

### 64. Update Document (Doküman Güncelle)
**Endpoint:** `PUT /api/documents/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Doküman bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "description": "Güncellenmiş açıklama",
  "documentUrl": "https://example.com/new-doc.pdf",
  "isActive": true,
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Döküman başarıyla güncellendi",
  "data": {
    "document": {
      "id": "document-id-123",
      ...
    }
  }
}
```

---

### 65. Delete Document (Doküman Sil)
**Endpoint:** `DELETE /api/documents/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Dokümanı kalıcı olarak siler (hard delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Döküman başarıyla silindi"
}
```

---

### 66. Get Test by ID (Test Detayı)
**Endpoint:** `GET /api/tests/{id}`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir testin detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "test": {
    "id": "test-id-123",
    "type": "test",
    "lessonId": "lesson-id-123",
    "title": "Test Başlığı",
    "questions": [...],
    ...
  }
}
```

---

### 67. Update Test (Test Güncelle)
**Endpoint:** `PUT /api/tests/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Test bilgilerini günceller.

**Request Body:**
```json
{
  "title": "Güncellenmiş Başlık",
  "description": "Güncellenmiş açıklama",
  "questions": [
    {
      "id": "q-1",
      "question": "Güncellenmiş soru",
      "type": "multiple_choice",
      "options": [...]
    }
  ],
  "timeLimit": 3600,
  "isActive": true,
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Test başarıyla güncellendi",
  "data": {
    "test": {
      "id": "test-id-123",
      ...
    }
  }
}
```

---

### 68. Delete Test (Test Sil)
**Endpoint:** `DELETE /api/tests/{id}`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Testi kalıcı olarak siler (hard delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Test başarıyla silindi"
}
```

---

## Validation Kuralları

### Email
- Format: `user@domain.com`
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password
- Minimum 8 karakter
- En az 1 büyük harf (A-Z)
- En az 1 küçük harf (a-z)
- En az 1 rakam (0-9)

### Phone Number (Türkiye)
- Format: `+90` veya `0` ile başlayan 10 haneli
- Örnek: `+905551234567`, `05551234567`
- Regex: `/^(\+90|0)?[0-9]{10}$/`

### TC Kimlik No
- 11 haneli, sadece rakam
- Algoritma kontrolü (checksum)

### Name (İsim, Soyisim)
- Minimum 2 karakter
- Maximum 50 karakter
- Sadece harf, boşluk ve Türkçe karakterler (`çğıöşüÇĞIİÖŞÜ`)
- Regex: `/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/`

### Birth Date (Doğum Tarihi)
- Format: ISO date string (`YYYY-MM-DD`)
- Minimum yaş: 18
- Maximum yaş: 120

### Gender (Cinsiyet)
- Sadece: `"male"` veya `"female"`

### Education (Eğitim Seviyesi)
- Sadece: `"ilkögretim"`, `"lise"`, `"yüksekokul"`

### User Status
- `pending_details`: Detaylar bekleniyor
- `pending_branch_review`: Şube onayı bekleniyor
- `pending_admin_approval`: Admin onayı bekleniyor
- `active`: Aktif
- `rejected`: Reddedildi

### User Role
- `admin`: Yönetici
- `branch_manager`: Şube Müdürü
- `user`: Kullanıcı

### Branch Name
- Minimum 2 karakter
- Maximum 100 karakter

### Branch Code
- Minimum 1 karakter
- Maximum 20 karakter
- Sadece harf, rakam, tire (`-`) ve alt çizgi (`_`)
- Regex: `/^[a-zA-Z0-9_-]+$/`

---

## Hata Kodları

### HTTP Status Codes

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek (validation hatası) |
| 401 | Yetkilendirme gerekli |
| 403 | Yetki yok |
| 404 | Bulunamadı |
| 500 | Sunucu hatası |

### Hata Mesajları

**Validation Hataları:**
```json
{
  "error": "Şifre en az 8 karakter olmalıdır"
}
```

**Yetki Hataları:**
```json
{
  "error": "Bu işlem için admin yetkisi gerekli"
}
```

**Bulunamadı:**
```json
{
  "error": "Kullanıcı bulunamadı"
}
```

---

## Örnek Kullanım

### JavaScript/TypeScript (Fetch API)

```typescript
// Register Basic
const response = await fetch('http://localhost:3001/api/auth/register/basic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet@example.com',
    password: 'SecurePass123',
    birthDate: '1990-01-01',
    gender: 'male'
  })
});

const data = await response.json();
console.log(data);

// Get Current User (with auth)
const authResponse = await fetch('http://localhost:3001/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
    'Content-Type': 'application/json',
  }
});

const userData = await authResponse.json();
console.log(userData);
```

### Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = getFirebaseIdToken(); // Your token getter
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register Basic
const registerResponse = await api.post('/auth/register/basic', {
  firstName: 'Ahmet',
  lastName: 'Yılmaz',
  email: 'ahmet@example.com',
  password: 'SecurePass123',
  birthDate: '1990-01-01',
  gender: 'male'
});

// Get Current User
const userResponse = await api.get('/users/me');
```

---

## Notlar

1. **Custom Token:** Register basic endpoint'i bir `customToken` döner. Bu token ile Firebase Auth'a sign in yapılmalıdır.

2. **Email Verification:** Email doğrulama client-side'da yapılmalıdır. Action code verify edildikten sonra UID backend'e gönderilir.

3. **Password Reset:** Password reset linki oluşturulur ancak email servisi henüz entegre edilmemiştir (TODO).

4. **Branch Manager Yetkileri:**
   - Sadece kendi şubesindeki kullanıcıları görebilir
   - Sadece `user` rolü oluşturabilir
   - Status güncelleme yetkileri sınırlıdır

5. **Delete İşlemleri:**
   - Branch silme işlemi hard delete'dir (kalıcı olarak silinir)
   - Kullanıcı silme işlemi hard delete'dir (Firebase Auth ve Firestore'dan tamamen silinir)
   - Branch silmeden önce şubeye bağlı kullanıcı olup olmadığı kontrol edilir

6. **Registration Logs:** Tüm kullanıcı kayıt süreci işlemleri loglanır. Loglar, kullanıcının durum değişikliklerini, kim tarafından yapıldığını ve ilgili notları içerir.

---

**Son Güncelleme:** 2024-12-28  
**Versiyon:** 2.0.0

**Değişiklikler:**
- Bulk user operations endpoint'i eklendi (`POST /api/users/bulk`)
- News endpoints eklendi (`GET`, `POST`, `PUT`, `DELETE /api/news`)
- Bulk news operations endpoint'i eklendi (`POST /api/news/bulk`)
- File upload endpoint'i eklendi (`POST /api/files/{category}/upload`)
- Topics endpoints eklendi (`GET`, `POST`, `PUT`, `DELETE /api/topics`)
- Contact Messages endpoints eklendi (`GET`, `POST`, `PUT /api/contact-messages`)
- Trainings endpoints eklendi (`GET`, `POST`, `PUT`, `DELETE /api/trainings`, `POST /api/trainings/bulk`, `GET`, `POST /api/trainings/{id}/lessons`)
- Lessons endpoints eklendi (`GET`, `PUT`, `DELETE /api/lessons/{id}`, `GET /api/lessons/{id}/contents`, `GET`, `POST /api/lessons/{id}/videos`, `GET`, `POST /api/lessons/{id}/documents`, `GET`, `POST /api/lessons/{id}/tests`)
- Content endpoints eklendi (`GET`, `PUT`, `DELETE /api/videos/{id}`, `GET`, `PUT`, `DELETE /api/documents/{id}`, `GET`, `PUT`, `DELETE /api/tests/{id}`)

