# SendikaApp Admin Panel

Admin ve Branch Manager paneli için React + Vite uygulaması.

## Kurulum

1. Paketleri yükleyin:
```bash
npm install
```

2. Environment variable'ları ayarlayın:
```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin:
```env
# Backend API URL
VITE_API_BASE_URL=/api  # When hosted via Firebase Hosting this will be proxied to Cloud Run

Runtime override: you can override the API base at runtime by setting `window.__API_BASE__` before your app loads, or if you open the hosted build locally (http://localhost:5000 or `vite preview`) it will automatically use `http://localhost:3001` for convenience.
```

**Production için:**
```env
VITE_API_BASE_URL=https://api.sendikaapp.com
```

## Geliştirme

Development server'ı başlatın:
```bash
npm run dev
```

Uygulama şu adreste çalışacaktır: http://localhost:3002

## Build

Production build:
```bash
npm run build
```

Build çıktısı `dist` klasöründe olacaktır.

## Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL'i (production default: `/api` — Firebase Hosting proxies `/api/**` to Cloud Run). Hosted admin panel: https://sendikaapp.web.app

## Özellikler

- ✅ Admin Dashboard
- ✅ Branch Manager Dashboard
- ✅ Kullanıcı Yönetimi
- ✅ Şube Yönetimi (Sadece Admin)
- ✅ Sidebar Navigation
- ✅ Role-based Access Control

