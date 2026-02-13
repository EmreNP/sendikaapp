# Production FCM Bildirim Sorunu - Çözüm Dokümantasyonu

## Sorun
Admin panel'de production ortamında bildirim gönderme çalışmıyordu.

## Kök Neden
Production ortamında Firebase Admin SDK, `applicationDefault()` credentials ile başlatılıyordu. Cloud Run'da default service account FCM (Firebase Cloud Messaging) mesajı gönderme yetkisine sahip olmayabilir.

## Çözüm
Firebase Admin SDK'yı production ortamında da **Service Account Key** ile başlatacak şekilde güncelledik.

---

## Yapılan Değişiklikler

### 1. Firebase Admin SDK Konfigürasyonu (`api/backend/src/lib/firebase/admin.ts`)

Production ortamı için service account key kullanımı eklendi. Sistem şu sırayla credential arar:

1. **`GOOGLE_APPLICATION_CREDENTIALS_JSON`** environment variable (JSON string olarak)
2. **`GOOGLE_APPLICATION_CREDENTIALS`** environment variable (dosya yolu)
3. **`serviceAccountKey.json`** dosyası (birkaç farklı konumda aranır)
4. **Fallback**: Application Default Credentials (uyarı ile)

### 2. Dockerfile Güncellemesi (`api/backend/Dockerfile`)

Dockerfile'a açıklayıcı not eklendi. Service account key dosyası Docker image'ine kopyalanmaz (güvenlik riski), bunun yerine Cloud Run'da secret olarak mount edilmeli.

---

## Deployment Talimatları

### Option 1: Cloud Run Secret Kullanımı (ÖNERİLEN)

#### Adım 1: Secret Oluştur

Firebase Console'dan indirdiğiniz `serviceAccountKey.json` dosyasını Google Cloud Secret Manager'a yükleyin:

```bash
# Secret oluştur
gcloud secrets create firebase-service-account \
  --data-file=api/backend/serviceAccountKey.json \
  --project=sendikaapp

# Cloud Run service account'a erişim izni ver
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=sendikaapp
```

**NOT:** `PROJECT_NUMBER` yerine projenizin numarasını yazın. Bulmak için:
```bash
gcloud projects describe sendikaapp --format="value(projectNumber)"
```

#### Adım 2: Cloud Run'a Secret Mount Et

Cloud Run deployment sırasında secret'ı environment variable olarak enjekte edin:

```bash
gcloud run deploy sendika-backend \
  --image=europe-west1-docker.pkg.dev/sendikaapp/sendika-repo/sendika-backend:latest \
  --platform=managed \
  --region=europe-west1 \
  --allow-unauthenticated \
  --set-secrets=GOOGLE_APPLICATION_CREDENTIALS_JSON=firebase-service-account:latest
```

**VEYA** Google Cloud Console'dan:
1. Cloud Run > sendika-backend > Edit & Deploy New Revision
2. "Variables & Secrets" sekmesinde
3. "Reference a Secret" > `GOOGLE_APPLICATION_CREDENTIALS_JSON` = `firebase-service-account` (latest version)

---

### Option 2: Environment Variable ile JSON String (Alternatif)

Secret Manager kullanmak istemiyorsanız, service account JSON'unu doğrudan environment variable olarak set edebilirsiniz:

```bash
# serviceAccountKey.json içeriğini tek satıra dönüştür
SERVICE_ACCOUNT_JSON=$(cat api/backend/serviceAccountKey.json | jq -c)

# Cloud Run'a deploy et
gcloud run deploy sendika-backend \
  --image=europe-west1-docker.pkg.dev/sendikaapp/sendika-repo/sendika-backend:latest \
  --platform=managed \
  --region=europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_APPLICATION_CREDENTIALS_JSON=${SERVICE_ACCOUNT_JSON}"
```

**UYARI:** Bu method güvenli değil. Secret Manager kullanımı önerilir.

---

### Option 3: Dosya Mount (GCP Storage Bucket)

Cloud Run'a volume mount ederek de service account key sağlayabilirsiniz, ancak bu karmaşıktır ve önerilmez.

---

## Deployment Sonrası Test

### 1. Backend Loglarını Kontrol Et

```bash
gcloud run logs read sendika-backend \
  --project=sendikaapp \
  --region=europe-west1 \
  --limit=50
```

Şu log mesajını görmelisiniz:
```
✅ Firebase Admin SDK initialized (Production with Service Account)
📋 Service account loaded from GOOGLE_APPLICATION_CREDENTIALS_JSON
   Storage bucket: sendikaapp.appspot.com
```

### 2. Admin Panel'den Bildirim Gönder

1. Admin panel'e giriş yapın
2. Duyurular veya Haberler sayfasına gidin
3. Bir içeriğe bildirim gönderin
4. Başarılı mesajı görmelisiniz

### 3. Backend Response Kontrol

Browser DevTools > Network sekmesinde `/api/notifications/send` endpoint'ine yapılan POST isteğinin response'unu kontrol edin:

**Başarılı Response:**
```json
{
  "success": true,
  "message": "Bildirim başarıyla gönderildi",
  "data": {
    "sent": 5,
    "failed": 0,
    "totalUsers": 5,
    "totalTokens": 7
  }
}
```

---

## Sorun Giderme

### Hala Bildirim Gönderilemiyor

#### 1. Service Account Key Geçerli mi?

```bash
# Key'i test et
gcloud auth activate-service-account --key-file=api/backend/serviceAccountKey.json
```

#### 2. FCM API Enabled mi?

Firebase Console > Project Settings > Cloud Messaging > kontrol edin.

VEYA:

```bash
gcloud services enable fcm.googleapis.com --project=sendikaapp
```

#### 3. Service Account Rolleri

Service account'ın şu rollere sahip olduğundan emin olun:
- **Firebase Admin SDK Administrator Service Agent**
- **Cloud Datastore User**

Firebase Console > Project Settings > Service Accounts > Firebase Admin SDK > "Generate new private key"

#### 4. Backend Loglarında Hata Kontrolü

```bash
gcloud run logs read sendika-backend \
  --project=sendikaapp \
  --region=europe-west1 \
  --limit=100 | grep -i "error\|failed\|fcm"
```

---

## Güvenlik Notları

⚠️ **Service Account Key Güvenliği:**

1. **ASLA** service account key'i Git'e commit etmeyin
2. `.gitignore` dosyasında `serviceAccountKey.json` olduğundan emin olun
3. Secret Manager kullanarak key'i yönetin
4. Key'i düzenli olarak rotate edin (6-12 ay)
5. Development ve production için farklı service account'lar kullanın

---

## Rollback

Eğer sorun yaşarsanız, eski versiyona dönebilirsiniz:

```bash
# Önceki revision'ı bul
gcloud run revisions list --service=sendika-backend --region=europe-west1

# Önceki revision'a dön
gcloud run services update-traffic sendika-backend \
  --to-revisions=sendika-backend-XXXXX=100 \
  --region=europe-west1
```

---

## Özet

✅ Firebase Admin SDK production'da service account key ile başlatılıyor
✅ Cloud Run'da secret olarak mount edilebilir
✅ Fallback mekanizması var (uyarı ile)
✅ FCM bildirimleri artık production'da çalışacak

**Deployment sonrası mutlaka test edin!**
