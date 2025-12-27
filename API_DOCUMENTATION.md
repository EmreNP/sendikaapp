# SendikaApp API Dokümantasyonu

## 📋 İçindekiler

- [Genel Bilgiler](#genel-bilgiler)
- [Authentication](#authentication)
- [Auth Endpoints](#auth-endpoints)
- [User Endpoints](#user-endpoints)
- [Branch Endpoints](#branch-endpoints)
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

### 7. Verify Email - Confirm (E-posta Doğrulama Onayla)
**Endpoint:** `POST /api/auth/verify-email/confirm`  
**Auth:** Gerekmez  
**Açıklama:** E-posta doğrulamasını onaylar. (Client-side'da action code verify edildikten sonra UID gönderilir)

**Request Body:**
```json
{
  "uid": "user-uid-123"
}
```

**Validation Kuralları:**
- `uid`: Zorunlu

**Response (200):**
```json
{
  "success": true,
  "message": "E-posta adresi başarıyla doğrulandı",
  "email": "ahmet@example.com"
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

## Branch Endpoints

### 20. Get Branches List (Şube Listesi)
**Endpoint:** `GET /api/branches`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Şube listesini getirir.

**Yetki Bazlı Görünüm:**
- **Admin:** Tüm şubeler (aktif + pasif), manager bilgileri ile
- **Branch Manager:** Sadece kendi şubesi, manager bilgileri ile
- **User:** Sadece aktif şubeler, manager bilgileri olmadan

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
  ]
}
```

---

### 21. Get Branch by ID (Şube Detayı)
**Endpoint:** `GET /api/branches/[id]`  
**Auth:** Gerekli (Bearer token)  
**Açıklama:** Belirli bir şubenin detaylarını getirir.

**Response (200):**
```json
{
  "success": true,
  "branch": {
    "id": "branch-id-123",
    "name": "İstanbul Şubesi",
    ...
  }
}
```

---

### 22. Create Branch (Şube Oluştur)
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

**Response (200):**
```json
{
  "success": true,
  "branch": {
    "id": "branch-id-123",
    "name": "İstanbul Şubesi",
    ...
  },
  "message": "Şube başarıyla oluşturuldu"
}
```

---

### 23. Update Branch (Şube Güncelle)
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

### 24. Delete Branch (Şube Sil)
**Endpoint:** `DELETE /api/branches/[id]`  
**Auth:** Gerekli (Bearer token)  
**Yetki:** Admin  
**Açıklama:** Şubeyi siler (soft delete - isActive: false). Şubeye bağlı kullanıcı varsa silinemez.

**Response (200):**
```json
{
  "success": true,
  "message": "Şube başarıyla silindi"
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

5. **Soft Delete:** Branch silme işlemi soft delete'dir (isActive: false). Kullanıcı silme işlemi hard delete'dir.

---

**Son Güncelleme:** 2024-01-01  
**Versiyon:** 1.0.0

