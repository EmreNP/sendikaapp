# Kullanıcı Kayıt Süreci Dokümantasyonu

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Kayıt Akış Diyagramı](#kayıt-akış-diyagramı)
- [Adım 1: Temel Kayıt (Register Basic)](#adım-1-temel-kayıt-register-basic)
- [Adım 2: Detaylı Bilgiler (Register Details)](#adım-2-detaylı-bilgiler-register-details)
- [Adım 3: Şube Müdürü Kararı](#adım-3-şube-müdürü-kararı)
- [Admin Yönetimi](#admin-yönetimi)
- [Kullanıcı Durumları (Status)](#kullanıcı-durumları-status)
- [Kayıt Logları](#kayıt-logları)
- [Örnek Kullanım](#örnek-kullanım)
- [Hata Senaryoları](#hata-senaryoları)

---

## Genel Bakış

SendikaApp kullanıcı kayıt süreci, güvenli ve kontrollü bir iki aşamalı kayıt sistemi kullanır. Kullanıcılar önce temel bilgilerini girer, sonra detaylı bilgilerini tamamlar ve ardından şube müdürü onayından geçerler. Şube müdürü PDF belgesi yükleyerek doğrudan kullanıcıyı aktif hale getirir.

### Kayıt Sürecinin Özellikleri

- ✅ **İki Aşamalı Kayıt**: Temel bilgiler ve detaylı bilgiler ayrı aşamalarda alınır
- ✅ **Email Doğrulama**: Kayıt sırasında email doğrulama linki gönderilir
- ✅ **Onay Süreci**: Şube müdürü ve admin onayı zorunludur
- ✅ **Log Sistemi**: Tüm işlemler kayıt loglarında tutulur
- ✅ **Güvenlik**: Firebase Auth ile güvenli kimlik doğrulama

---

## Kayıt Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│  1. TEMEL KAYIT (Register Basic)                                │
│  - İsim, Soyisim, Email, Şifre, Doğum Tarihi, Cinsiyet         │
│  └─> Status: PENDING_DETAILS                                    │
│      └─> Custom Token döner                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. DETAYLI BİLGİLER (Register Details)                         │
│  - TC Kimlik No, Adres, Telefon, Şube seçimi, vb.              │
│  └─> Status: PENDING_BRANCH_REVIEW                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ŞUBE MÜDÜRÜ KARARI                                          │
│  ┌──────────────────┬──────────────────┬──────────────────┐    │
│  │ Onayla (PDF ile) │ Reddet           │ Geri Gönder      │    │
│  └─> ACTIVE         │ └─> REJECTED     │ └─> PENDING_     │    │
│      (Aktif üye)    │     (Reddedildi) │     DETAILS      │    │
└─────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## Adım 1: Temel Kayıt (Register Basic)

### Endpoint
```
POST /api/auth/register/basic
```

### Authentication
Gerekmez (Public endpoint)

### Request Body

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

### Validation Kuralları

| Alan | Zorunlu | Kurallar |
|------|---------|----------|
| `firstName` | ✅ | En az 2, en fazla 50 karakter, sadece harf ve Türkçe karakterler |
| `lastName` | ✅ | En az 2, en fazla 50 karakter, sadece harf ve Türkçe karakterler |
| `email` | ✅ | Geçerli email formatı, benzersiz olmalı |
| `password` | ✅ | En az 8 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam |
| `birthDate` | ✅ | ISO format (YYYY-MM-DD), 18-120 yaş arası |
| `gender` | ✅ | `"male"` veya `"female"` |

### İşlem Adımları

1. **Validasyon**: Tüm alanlar validate edilir
2. **Firebase Auth**: Kullanıcı Firebase Authentication'da oluşturulur
   - Email verified: `false` (tüm kullanıcılar email doğrulamalı)
3. **Firestore Belgesi**: `users` koleksiyonunda kullanıcı belgesi oluşturulur
   - `status`: `PENDING_DETAILS`
   - `role`: `USER`
   - `isActive`: `true`
4. **Email Doğrulama**: Email doğrulama linki gönderilir
5. **Custom Token**: Client tarafında kullanılmak üzere custom token oluşturulur
6. **Registration Log**: İşlem loglanır (`register_basic` action)

### Response (201 Created)

```json
{
  "success": true,
  "message": "Kayıt başarılı! Custom token ile Firebase Auth'a sign in yapabilirsiniz.",
  "data": {
    "uid": "user-uid-123",
    "email": "ahmet@example.com",
    "customToken": "firebase-custom-token-string",
    "nextStep": "/register/details"
  },
  "code": "REGISTER_BASIC_SUCCESS"
}
```

### Sonraki Adım

Kullanıcı `customToken` ile Firebase Auth'a sign in yapmalı ve `/register/details` endpoint'ini çağırarak detaylı bilgilerini girmelidir.

---

## Adım 2: Detaylı Bilgiler (Register Details)

### Endpoint
```
POST /api/auth/register/details
```

### Authentication
✅ Gerekli (Bearer token ile custom token'dan alınan Firebase ID token)

### Request Body

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

### Validation Kuralları

| Alan | Zorunlu | Kurallar |
|------|---------|----------|
| `branchId` | ✅ | Geçerli branch ID, branch aktif olmalı |
| `tcKimlikNo` | ❌ | 11 haneli, TC Kimlik algoritma kontrolü, benzersiz olmalı |
| `fatherName` | ❌ | En az 2 karakter, sadece harf ve Türkçe karakterler |
| `motherName` | ❌ | En az 2 karakter, sadece harf ve Türkçe karakterler |
| `birthPlace` | ❌ | Serbest metin |
| `education` | ❌ | `"ilkögretim"`, `"lise"`, `"yüksekokul"` |
| `kurumSicil` | ❌ | Serbest metin |
| `kadroUnvani` | ❌ | Serbest metin |
| `kadroUnvanKodu` | ❌ | Serbest metin |
| `phone` | ❌ | Türkiye telefon formatı (`+90` veya `0` ile başlayan 10 haneli) |
| `address` | ❌ | Serbest metin |
| `city` | ❌ | Serbest metin |
| `district` | ❌ | Serbest metin |

### İşlem Adımları

1. **Kullanıcı Kontrolü**: Kullanıcı belgesinin var olduğu ve temel bilgilerin tamamlandığı kontrol edilir
2. **Durum Kontrolü**: Kullanıcının durumu `PENDING_DETAILS` olmalı
3. **Branch Kontrolü**: Seçilen şube aktif olmalı
4. **Validasyon**: TC Kimlik No, telefon vb. alanlar validate edilir
5. **Status Güncelleme**: Kullanıcı durumu `PENDING_BRANCH_REVIEW` olarak güncellenir
6. **Registration Log**: İşlem loglanır (`register_details` action)

### Response (200 OK)

```json
{
  "success": true,
  "message": "Detaylar kaydedildi! Şube onayı bekleniyor.",
  "data": {
    "user": {
      "uid": "user-uid-123",
      "status": "pending_branch_review"
    }
  },
  "code": "REGISTER_DETAILS_SUCCESS"
}
```

### Sonraki Adım

Kullanıcı artık şube müdürünün onayını beklemektedir. Şube müdürü sisteme giriş yaparak kullanıcının başvurusunu inceleyip onaylayabilir veya geri gönderebilir.

---

## Adım 3: Şube Müdürü Onayı

### Endpoint
```
PATCH /api/users/[id]/status
```

### Authentication
✅ Gerekli (Bearer token - Branch Manager yetkisi)

### Yetki Kontrolleri

- ✅ Sadece kendi şubesindeki kullanıcıları görebilir ve onaylayabilir
- ✅ Sadece `PENDING_BRANCH_REVIEW` durumundaki kullanıcıları işleyebilir

### Request Body - Onaylama (PDF belgesi ile)

```json
{
  "status": "active",
  "documentUrl": "https://storage.example.com/user-docs/user-id/belge.pdf"
}
```

### Request Body - Reddetme

```json
{
  "status": "rejected",
  "rejectionReason": "Başvuru kriterlerini karşılamıyor"
}
```

### Request Body - Geri Gönderme

```json
{
  "status": "pending_details",
  "rejectionReason": "Eksik belgeler var, lütfen düzeltin"
}
```

### İşlem Adımları

1. **Yetki Kontrolü**: Kullanıcı branch manager rolünde ve kullanıcı aynı şubede olmalı
2. **Durum Kontrolü**: Hedef kullanıcının durumu `PENDING_BRANCH_REVIEW` olmalı
3. **Status Güncelleme**: 
   - Onay: `active` (PDF belgesi zorunlu, kullanıcı direkt aktif olur)
   - Red: `rejected` (rejectionReason zorunlu)
   - Geri Gönderme: `pending_details`
4. **Registration Log**: İşlem loglanır (`branch_manager_approval`, `branch_manager_rejection` veya `branch_manager_return` action)

### Response (200 OK)

```json
{
  "success": true,
  "message": "Kullanıcı durumu başarıyla güncellendi",
  "data": {
    "user": {
      "uid": "user-uid-123",
      "status": "active",
      "previousStatus": "pending_branch_review"
    }
  }
}
```

### Sonraki Adım

`active` durumuna geçen kullanıcılar sistemi tam olarak kullanabilirler. Geri gönderilen kullanıcılar detaylı bilgilerini düzelterek tekrar başvurabilirler. Reddedilen kullanıcılar yeni bir kayıt yapmalıdır.

---

## Admin Yönetimi

Admin, bekleyen üyelikleri görebilir ve gerektiğinde herhangi bir kullanıcının durumunu değiştirebilir (geri gönderme, onaylama, reddetme vb.).

### Endpoint
```
PATCH /api/users/[id]/status
```

### Authentication
✅ Gerekli (Bearer token - Admin yetkisi)

### Yetki Kontrolleri

- ✅ Tüm kullanıcıları görebilir ve durumlarını değiştirebilir
- ✅ Herhangi bir durumdaki kullanıcıyı işleyebilir

### Request Body - Onaylama

```json
{
  "status": "active"
}
```

### Request Body - Reddetme

```json
{
  "status": "rejected",
  "rejectionReason": "Başvuru kriterlerini karşılamıyor"
}
```

### Request Body - Geri Gönderme

```json
{
  "status": "pending_branch_review",
  "rejectionReason": "Şube müdürü tekrar inceleyin"
}
```

veya

```json
{
  "status": "pending_details",
  "rejectionReason": "Eksik bilgiler var"
}
```

### İşlem Adımları

1. **Yetki Kontrolü**: Kullanıcı admin rolünde olmalı
2. **Status Güncelleme**: 
   - Onay: `active` (kullanıcı aktif hale gelir)
   - Red: `rejected` (rejectionReason zorunlu)
   - Geri Gönderme: `pending_branch_review` veya `pending_details`
3. **Registration Log**: İşlem loglanır (`admin_approval`, `admin_rejection` veya `admin_return` action)

### Response (200 OK)

```json
{
  "success": true,
  "message": "Kullanıcı durumu başarıyla güncellendi",
  "data": {
    "user": {
      "uid": "user-uid-123",
      "status": "active",
      "previousStatus": "pending_branch_review"
    }
  }
}
```

### Sonraki Adım

`active` durumuna geçen kullanıcılar sistemi tam olarak kullanabilirler.

---

## Kullanıcı Durumları (Status)

### Status Değerleri ve Açıklamaları

| Status | Açıklama | Sonraki Adımlar |
|--------|----------|-----------------|
| `pending_details` | Temel kayıt tamamlandı, detaylı bilgiler bekleniyor | Kullanıcı `/register/details` endpoint'ini çağırmalı |
| `pending_branch_review` | Detaylar tamamlandı, şube müdürü onayı bekleniyor | Şube müdürü onaylamalı, reddetmeli veya geri göndermeli |
| `active` | Kullanıcı aktif, sistemi kullanabilir | - |
| `rejected` | Başvuru reddedildi | Kullanıcı tekrar başvurabilir (yeni kayıt gerekir) |

### Status Geçiş Diyagramı

```
pending_details
    │
    │ (register_details)
    ▼
pending_branch_review
    │
    ├─> (branch_manager_approval + PDF) ──> active
    │
    ├─> (branch_manager_rejection) ──> rejected
    │
    └─> (branch_manager_return) ──> pending_details

Admin de herhangi bir kullanıcıyı herhangi bir duruma geçirebilir:
  active ←→ pending_branch_review ←→ pending_details
  herhangi bir durum → rejected
```

---

## Kayıt Logları

Her kayıt işlemi `user_registration_logs` koleksiyonunda loglanır. Loglar, kullanıcının kayıt sürecindeki tüm işlemleri takip etmek için kullanılır.

### Log Yapısı

```typescript
interface UserRegistrationLog {
  id: string; // Firestore document ID
  userId: string; // İşlem yapılan kullanıcının UID'i
  action: 'register_basic' | 'register_details' | 'branch_manager_approval' | 
          'branch_manager_rejection' | 'admin_approval' | 'admin_rejection' | 
          'admin_return' | 'branch_manager_return';
  performedBy: string; // İşlemi yapan kullanıcının UID'i
  performedByRole: 'admin' | 'branch_manager' | 'user';
  previousStatus?: UserStatus; // Önceki durum
  newStatus?: UserStatus; // Yeni durum
  note?: string; // Opsiyonel not
  documentUrl?: string; // PDF belgesi URL'i (branch manager approval için)
  metadata?: {
    branchId?: string;
    email?: string;
  };
  timestamp: Timestamp; // İşlem zamanı
}
```

### Log Action Türleri

| Action | Açıklama | Performed By |
|--------|----------|--------------|
| `register_basic` | Temel kayıt işlemi | Kullanıcı kendisi |
| `register_details` | Detaylı bilgilerin eklenmesi | Kullanıcı kendisi |
| `branch_manager_approval` | Şube müdürü onayı (PDF ile aktif) | Branch Manager |
| `branch_manager_rejection` | Şube müdürü reddi | Branch Manager |
| `branch_manager_return` | Şube müdürü geri gönderme | Branch Manager |
| `admin_approval` | Admin onayı | Admin |
| `admin_rejection` | Admin reddi | Admin |
| `admin_return` | Admin geri gönderme | Admin |

### Logları Görüntüleme

```
GET /api/users/[id]/logs
```

**Yetki:**
- Admin: Herkesin loglarını görebilir
- Branch Manager: Sadece kendi şubesindeki kullanıcıların loglarını görebilir
- User: Sadece kendi loglarını görebilir

---

## Örnek Kullanım

### Tam Kayıt Süreci Örneği

#### 1. Temel Kayıt

```typescript
const registerBasic = async () => {
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
  // data.data.customToken ile Firebase Auth'a sign in yap
  const { customToken, uid } = data.data;
  
  // Firebase Auth'a sign in
  const userCredential = await signInWithCustomToken(auth, customToken);
  const idToken = await userCredential.user.getIdToken();
  
  return { uid, idToken };
};
```

#### 2. Detaylı Bilgiler

```typescript
const registerDetails = async (idToken: string) => {
  const response = await fetch('http://localhost:3001/api/auth/register/details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      branchId: 'branch-id-123',
      tcKimlikNo: '12345678901',
      fatherName: 'Mehmet',
      motherName: 'Ayşe',
      birthPlace: 'İstanbul',
      education: 'lise',
      phone: '05551234567',
      address: 'Örnek Mahalle, Örnek Sokak No:1',
      city: 'İstanbul',
      district: 'Kadıköy'
    })
  });

  const data = await response.json();
  // Kullanıcı artık pending_branch_review durumunda
  return data;
};
```

#### 3. Şube Müdürü Onayı (PDF belgesi ile)

```typescript
const approveByBranchManager = async (userId: string, branchManagerToken: string, documentUrl: string) => {
  const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${branchManagerToken}`
    },
    body: JSON.stringify({
      status: 'active',
      documentUrl: documentUrl
    })
  });

  const data = await response.json();
  // Kullanıcı artık active durumunda
  return data;
};
```

#### 4. Admin Durum Değiştirme (Gerektiğinde)

```typescript
const changeStatusByAdmin = async (userId: string, adminToken: string) => {
  const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'active'
    })
  });

  const data = await response.json();
  return data;
};
```

---

## Hata Senaryoları

### Yaygın Hatalar ve Çözümleri

#### 1. Email Zaten Kullanılıyor

```json
{
  "success": false,
  "message": "Bu e-posta adresi zaten kullanılıyor",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

**Çözüm:** Kullanıcı farklı bir email adresi kullanmalı veya giriş yapmalı.

#### 2. Geçersiz Şifre

```json
{
  "success": false,
  "message": "Şifre en az 8 karakter olmalıdır",
  "code": "VALIDATION_ERROR"
}
```

**Çözüm:** Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir.

#### 3. Yaş Sınırı

```json
{
  "success": false,
  "message": "18 yaşından küçükler kayıt olamaz",
  "code": "VALIDATION_ERROR"
}
```

**Çözüm:** Kullanıcı 18-120 yaş aralığında olmalıdır.

#### 4. TC Kimlik No Zaten Kullanılıyor

```json
{
  "success": false,
  "message": "Bu TC Kimlik No zaten kullanılıyor",
  "code": "VALIDATION_ERROR"
}
```

**Çözüm:** TC Kimlik No benzersiz olmalıdır.

#### 5. Şube Aktif Değil

```json
{
  "success": false,
  "message": "Bu şube aktif değil",
  "code": "VALIDATION_ERROR"
}
```

**Çözüm:** Aktif bir şube seçilmelidir.

#### 6. Detaylar Zaten Tamamlanmış

```json
{
  "success": false,
  "message": "Kayıt zaten tamamlanmış veya onay bekliyor",
  "code": "VALIDATION_ERROR"
}
```

**Çözüm:** Kullanıcı zaten detaylı bilgilerini girmiş ve onay sürecindedir.

---

## Önemli Notlar

1. **Email Doğrulama**: Email doğrulama zorunlu değildir (kayıt sırasında), ancak önerilir. Kullanıcı istediği zaman email doğrulayabilir.

2. **Custom Token**: Register basic endpoint'i bir custom token döner. Bu token ile Firebase Auth'a sign in yapılmalıdır. Token tek kullanımlıktır.

3. **Status Kontrolleri**: Her adımda kullanıcının mevcut durumu kontrol edilir. Yanlış durumdan çağrılan endpoint'ler hata döner.

4. **Branch Manager Yetkileri**: Branch Manager sadece kendi şubesindeki kullanıcıları görebilir ve işleyebilir.

5. **Admin Yetkileri**: Admin tüm kullanıcıları görebilir ve herhangi bir durumdaki kullanıcıyı işleyebilir.

6. **Geri Gönderme**: Hem Branch Manager hem de Admin kullanıcıları geri gönderebilir. Bu durumda kullanıcı önceki adıma döner ve bilgilerini düzeltebilir.

7. **Red İşlemi**: Şube Müdürü ve Admin kullanıcıları reddedebilir. Reddedilen kullanıcılar `rejected` durumunda kalır ve yeni bir kayıt yapmaları gerekir.

8. **Registration Logs**: Tüm işlemler kayıt loglarında tutulur. Loglar, kullanıcının kayıt sürecini tam olarak takip etmek için kullanılabilir.

9. **PDF Belgesi**: Şube müdürü kullanıcıyı onaylarken PDF belgesi yüklemesi zorunludur. Belge yüklenmeden kullanıcı aktif yapılamaz.

---

**Son Güncelleme:** 2026-02-08  
**Versiyon:** 2.0.0 (pending_admin_approval adımı kaldırıldı)

