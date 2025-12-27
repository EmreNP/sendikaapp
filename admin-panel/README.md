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
VITE_API_BASE_URL=http://localhost:3001
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

- `VITE_API_BASE_URL`: Backend API base URL'i (default: `http://localhost:3001`)

## Özellikler

- ✅ Admin Dashboard
- ✅ Branch Manager Dashboard
- ✅ Kullanıcı Yönetimi
- ✅ Şube Yönetimi (Sadece Admin)
- ✅ Sidebar Navigation
- ✅ Role-based Access Control

