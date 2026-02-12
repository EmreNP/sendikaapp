# Google Cloud Redis (Memorystore) Entegrasyonu

Backend API'niz artık Google Cloud Memorystore Redis ile entegre. Bu sayede Cloud Run'da çoklu instance çalışırken rate limiting paylaşımlı olacak.

---

## 🚀 Hızlı Kurulum (5-10 dakika)

### 1️⃣ Memorystore Redis Instance Oluştur

```bash
# Project ID'nizi set edin (değiştirin)
export PROJECT_ID="your-project-id"
export REGION="us-central1"  # veya europe-west1, asia-northeast1

gcloud config set project $PROJECT_ID

# Redis instance oluştur (1GB, Basic Tier)
gcloud redis instances create sendika-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_6_x \
  --tier=BASIC
```

**Oluşturulma süresi:** ~5 dakika

**Maliyet:** ~$30/ay (1GB Basic tier). Ücretsiz tier YOK ama ilk $300 kredisi kullanabilirsiniz.

---

### 2️⃣ VPC Connector Oluştur (Cloud Run → Redis Bağlantısı)

Cloud Run default olarak Redis'e erişemez (private IP). VPC Connector gerekli:

```bash
# VPC Connector oluştur
gcloud compute networks vpc-access connectors create sendika-connector \
  --region=$REGION \
  --network=default \
  --range=10.8.0.0/28
```

**Süre:** ~2 dakika

---

### 3️⃣ Redis IP Adresini Al

```bash
# Redis internal IP'sini görüntüle
gcloud redis instances describe sendika-redis --region=$REGION --format="get(host)"
```

Çıktı örneği: `10.0.0.3`

Redis URL'i şu formatta: `redis://10.0.0.3:6379`

---

### 4️⃣ Secret Manager'a Kaydet

```bash
# Redis URL'i secret olarak kaydet
echo "redis://10.0.0.3:6379" | gcloud secrets create REDIS_URL --data-file=-

# Cloud Run service account'a erişim ver
export SERVICE_ACCOUNT="your-cloud-run-sa@your-project.iam.gserviceaccount.com"
gcloud secrets add-iam-policy-binding REDIS_URL \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

**Not:** Cloud Run default SA: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`

Service account'ı şu komutla bulabilirsiniz:
```bash
gcloud run services describe sendika-backend --region=$REGION --format="value(spec.template.spec.serviceAccountName)"
```

---

### 5️⃣ Backend'i Redis ile Deploy Et

```bash
cd /home/justEmre/SendikaApp/api/backend

# Cloud Run'a deploy et (VPC Connector + Secret ekleyerek)
gcloud run deploy sendika-backend \
  --source . \
  --region=$REGION \
  --vpc-connector=sendika-connector \
  --set-secrets=REDIS_URL=REDIS_URL:latest \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --allow-unauthenticated
```

Deploy sırasında build olacak ve Redis bağlantısı otomatik aktif olacak.

---

## ✅ Test Et

Deploy sonrası loglarda şunu görmelisiniz:

```
✅ Rate limiter: Redis store aktif (çoklu instance desteği)
✅ Secret loaded from GCP Secret Manager: REDIS_URL
```

Test isteği at:
```bash
# Cloud Run URL'inizi alın
export BACKEND_URL=$(gcloud run services describe sendika-backend --region=$REGION --format="value(status.url)")

# Rate limit testi (10 istek arka arkaya)
for i in {1..10}; do
  curl -s -w "\nStatus: %{http_code}\n" "$BACKEND_URL/api/health"
done
```

---

## 🔧 Alternatif: Upstash Redis (Ücretsiz)

Google Cloud Memorystore maliyetli geliyorsa, ücretsiz Upstash kullanabilirsiniz:

### 1. Upstash Hesabı
- https://upstash.com → Sign up
- Create Database → **Global** seç (low latency)

### 2. REST API URL'i Kopyala
Upstash → Database → **REST API** sekmesi → UPSTASH_REDIS_REST_URL

Örnek: `https://abc-def.upstash.io`

### 3. Secret Manager'a Kaydet
```bash
echo "https://YOUR-UPSTASH-URL.upstash.io" | gcloud secrets create REDIS_URL --data-file=-
```

### 4. Deploy (VPC Connector GEREKSIZ)
```bash
gcloud run deploy sendika-backend \
  --source . \
  --region=$REGION \
  --set-secrets=REDIS_URL=REDIS_URL:latest \
  --allow-unauthenticated
```

**Avantaj:** VPC Connector gereksiz (HTTP REST API), ücretsiz 10K komut/gün

---

## 🐛 Sorun Giderme

### Redis bağlantı hatası
**Log:** `Redis connection failed, will fallback on each request`

**Çözüm:**
1. VPC Connector doğru bağlandı mı?
```bash
gcloud run services describe sendika-backend --region=$REGION --format="value(spec.template.metadata.annotations.run\.googleapis\.com/vpc-access-connector)"
```

2. Redis IP'si doğru mu?
```bash
gcloud redis instances describe sendika-redis --region=$REGION
```

3. Firewall kuralları (genelde gerekmiyor):
```bash
gcloud compute firewall-rules create allow-redis \
  --allow=tcp:6379 \
  --source-ranges=10.8.0.0/28
```

### Secret erişim hatası
**Log:** `Secret Manager'dan REDIS_URL okunamadı`

**Çözüm:** IAM izinlerini kontrol et:
```bash
gcloud secrets get-iam-policy REDIS_URL
```

Service account `secretAccessor` rolüne sahip olmalı.

---

## 📊 Maliyet Hesabı

### Google Cloud Memorystore
- **1GB Basic:** ~$30/ay (~₺1,000)
- **1GB Standard (HA):** ~$120/ay (~₺4,000)
- **Ağ trafiği:** $0.01/GB (ihmal edilebilir)

### Upstash Redis (Önerilen)
- **Free tier:** 10,000 komut/gün (günlük ~100K sayfa görüntüleme)
- **Pay-as-you-go:** $0.2 per 100K komut (~$2-5/ay)

**Öneri:** Başlangıçta Upstash, büyük trafik gelince Memorystore.

---

## 🎯 Özet

✅ **Kod hazır** — Secret Manager entegrasyonu eklendi  
✅ **Redis varsa kullan** — Yoksa in-memory fallback (tek instance için OK)  
✅ **5dk kurulum** — Upstash ücretsiz + VPC connector gereksiz  
✅ **Production ready** — Çoklu instance rate limiting

**Şimdi ne yapalım?**
1. Upstash ücretsiz hesap aç → 5dk
2. Secret Manager'a ekle → 2dk
3. Deploy et → 3dk

**Toplam:** 10 dakikada Redis entegrasyonu tamamlanır.
