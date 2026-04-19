# 📋 Frontend Sorun Analiz Raporu

**Tarih:** 14 Mart 2026  
**Kapsam:** `mobile/src/` — 31 ekran, 11 bileşen, 1 navigasyon dosyası  
**Analiz Eden:** Frontend Uzmanı

---

## 📊 Özet Tablo

| Kategori | Kritik | Yüksek | Orta | Düşük | Toplam |
|----------|--------|--------|------|-------|--------|
| 🌑 Dark Mode | 1 (sistemik) | 3 | 28+ | — | 32+ |
| 📐 Taşma / Overflow | — | 2 | 14 | 3 | 19 |
| 📏 Layout / Responsive | 2 | 4 | 8 | 6 | 20 |
| ⌨️ Klavye / Form | — | 1 | — | 2 | 3 |
| 🔤 Metin Kesme | — | 1 | 8 | 5 | 14 |
| ⚙️ Platform Uyumluluk | — | 2 | 2 | — | 4 |
| **TOPLAM** | **3** | **13** | **60+** | **16** | **92+** |

---

## 🔴 KRİTİK SEVİYE SORUNLAR

### K1 — Dark Mode Altyapısı Yok (Sistemik)

**Etki:** 31 ekranın tamamı + 11 bileşen  
**Dosya:** `src/constants/theme.ts`

Tema dosyasında yalnızca light mode renkleri tanımlı. Hiçbir ekranda `useColorScheme()` kullanılmıyor. Dark mode kullanan telefonlarda:
- Beyaz arka planlar değişmiyor → Göz yorucu
- Koyu metin renkleri koyu arka plana karışıyor → Okunamaz
- Kartlar, butonlar, inputlar hep light tema → Uyumsuz görünüm

```
// theme.ts — Mevcut durum (sadece light)
export const COLORS = {
  background: '#f8fafc',   // ❌ Dark mode karşılığı yok
  surface: '#ffffff',       // ❌ Dark mode karşılığı yok
  text: '#1e293b',          // ❌ Dark mode karşılığı yok
  textSecondary: '#64748b', // ❌ Dark mode karşılığı yok
};
```

### K2 — Modül Seviyesinde `Dimensions.get()` (4 dosya)

Ekran boyutları modül yüklendiğinde bir kez alınıyor ve bir daha güncellENMİYOR. Cihaz döndürüldüğünde, katlanabilir telefon açıldığında veya split-screen kullanıldığında layout bozuluyor.

| Dosya | Satır | Kod |
|-------|-------|-----|
| `screens/HomeScreen.tsx` | ~L62 | `const _initDim = Dimensions.get('window')` |
| `screens/WelcomeScreen.tsx` | ~L21 | `const { width, height } = Dimensions.get('window')` |
| `components/HamburgerMenu.tsx` | ~L22 | `const { width: _initWidth } = Dimensions.get('window')` |
| `components/SkeletonLoader.tsx` | ~L14 | `const { width: SCREEN_WIDTH } = Dimensions.get('window')` |

### K3 — Modül Seviyesinde `Dimensions` + PDF Görüntüleyici

**Dosya:** `screens/DocumentScreen.tsx`  
**Satır:** ~L16

```tsx
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Bu stale değer PDF genişliğinde kullanılıyor → Döndürmede PDF yanlış boyutta
```

---

## 🔴 YÜKSEK SEVİYE SORUNLAR

### Y1 — MuktesepScreen: Klavye Formu Kapatıyor

**Dosya:** `screens/MuktesepScreen.tsx`  
**Satır:** ~L265+

Ekranda TextInput alanları var ama `KeyboardAvoidingView` ve `keyboardShouldPersistTaps` eksik. Klavye açıldığında input alanları klavyenin altında kalıyor ve kullanıcı göremez.

### Y2 — CourseDetailScreen: İçerik Başlıkları Taşıyor

**Dosya:** `screens/CourseDetailScreen.tsx`  
**Satır:** ~L570-571

```tsx
// ❌ numberOfLines yok — uzun başlıklar tamamlanma ikonunu ekran dışına itiyor
<Text style={styles.contentTitle}>{item.title}</Text>
<Text style={styles.contentDescription}>{item.description}</Text>
```

Row layout'ta uzun başlıklar sağdaki completion icon'u ekran dışına itiyor.

### Y3 — PartnerDetailScreen: 280px Sabit Header

**Dosya:** `screens/PartnerDetailScreen.tsx`  
**Satır:** ~L350

```tsx
headerImage: { height: 280 }
// iPhone SE (568px): Ekranın %50'sini kaplıyor!
```

Küçük ekranlarda header neredeyse tüm ekranı kaplayıp içeriğe yer bırakmıyor.

### Y4 — ProfileDetailScreen: Stale Dimensions

**Dosya:** `screens/ProfileDetailScreen.tsx`  
**Satır:** ~L1

```tsx
const { width: SCREEN_W } = Dimensions.get('window');
```

Modül seviyesinde çağrılıyor, ekran döndürmede güncellenmez.

### Y5 — HamburgerMenu: Sabit paddingTop (60px)

**Dosya:** `components/HamburgerMenu.tsx`  
**Satır:** ~L464

```tsx
paddingTop: 60,
// ❌ Farklı cihazlarda status bar yükseklikleri farklı
// Notch'lu ve notch'suz telefon, iPad = farklı yükseklik
```

`useSafeAreaInsets()` kullanılmalı.

### Y6 — BirthDatePickerModal: Sabit 34px Safe Area

**Dosya:** `components/BirthDatePickerModal.tsx`  
**Satır:** ~L313

```tsx
paddingBottom: Platform.OS === 'ios' ? 34 : 16,
// ❌ 34px sadece Face ID'li iPhone'larda doğru
// iPad, eski iPhone, SE = yanlış inset
```

### Y7 — CustomInput: Emoji Şifre Toggle

**Dosya:** `components/CustomInput.tsx`  
**Satır:** ~L68

```tsx
<Text>👁️</Text>  // veya 🙈
// ❌ Emoji boyutları Android/iOS arasında farklı render ediliyor
// Bazı Android cihazlarda compound emoji desteklenmiyor
```

Zaten projede kullanılan `Ionicons` kütüphanesi ile değiştirilmeli.

### Y8 — HomeScreen: İmperatif StatusBar

**Dosya:** `screens/HomeScreen.tsx`  
**Satır:** ~L130-133

```tsx
useEffect(() => {
  StatusBar.setBarStyle('dark-content');
  // ❌ Cleanup yok — Login/Welcome gibi dark ekranlara geçince resetlenmez
}, []);
```

### Y9 — HtmlContent: Tüm Renkler Hardcoded

**Dosya:** `components/HtmlContent.tsx`

HTML içerik (duyurular, haberler) render edilirken `tagsStyles` içindeki tüm renkler light mode için sabitlenmiş. Dark mode'da:
- Gövde metni (`#374151`) koyu arka planda görünmez
- Tablo kenarlıkları (`#e2e8f0`) kaybolur
- Blockquote arka planı (`#f0f9ff`) bozuk görünür
- Kod blokları (`#1f2937`) karanlıkta karışır

---

## 🟡 ORTA SEVİYE SORUNLAR

### O1 — Hardcoded Renkler (29/31 Ekran)

Aşağıdaki ekranlar `theme.ts` sabitlerini kullanmak yerine inline hardcoded renkler kullanıyor:

| Ekran | Hardcoded Renk Sayısı |
|-------|----------------------|
| HomeScreen | 80+ |
| HamburgerMenu | 40+ |
| ProfileScreen | 20+ |
| ProfileDetailScreen | 30+ |
| CoursesScreen | 20+ |
| CourseDetailScreen | 25+ |
| NotificationsScreen | 20+ |
| BranchesScreen | 20+ |
| BranchDetailScreen | 20+ |
| ContactScreen | 20+ |
| PartnerInstitutionsScreen | 20+ |
| PartnerDetailScreen | 20+ |
| AllAnnouncementsScreen | 15+ |
| AllNewsScreen | 15+ |
| AnnouncementDetailScreen | 15+ |
| NewsDetailScreen | 15+ |
| MembershipScreen | 15+ |
| MuktesepScreen | 15+ |
| DocumentScreen | 15+ |
| ChangePasswordScreen | 15+ |
| ForgotPasswordScreen | 15+ |
| AboutScreen | 10+ |
| KvkkScreen | 10+ |
| TermsScreen | 10+ |
| **Bileşenler** | |
| ErrorBoundary | 8 |
| UpdateModal | 10+ |
| SkeletonLoader | 5 |
| OfflineBanner | 3 |
| AppNavigator | 8 |

**Toplam:** ~500+ hardcoded renk değeri

### O2 — `numberOfLines` Eksik Metin Alanları

| Dosya | Satır | Element | Risk |
|-------|-------|---------|------|
| `HamburgerMenu.tsx` | ~11 yerde | userName, userRole, contactValue, address, cardTitle, vb. | Adres çok uzunsa menüyü bozar |
| `ProfileScreen.tsx` | 2 yerde | userName, userEmail | Uzun isim/email header'ı bozar |
| `ProfileDetailScreen.tsx` | 2 yerde | fullName, email | Aynı sorun |
| `CourseDetailScreen.tsx` | 2 yerde | contentTitle, contentDescription | Row layout taşması |
| `BranchesScreen.tsx` | 1 yerde | branchName | Badge'i ekran dışına iter |
| `BranchDetailScreen.tsx` | 2 yerde | branchName, infoValue (email) | Taşma riski |
| `PartnerInstitutionsScreen.tsx` | 1 yerde | partnerName | Kart yüksekliği dengesiz |
| `NotificationsScreen.tsx` | 1 yerde | image height: 140px sabit | Responsive değil |
| `AllNewsScreen.tsx` | 1 yerde | card image 110×100 sabit | Küçük ekranlarda %34 genişlik |

### O3 — Sabit Piksel Yükseklikler

| Dosya | Element | Değer | Sorun |
|-------|---------|-------|-------|
| `PartnerDetailScreen.tsx` | headerImage | `280px` | Küçük ekranın %50'si |
| `CourseDetailScreen.tsx` | headerImage | `220px` | Orantısız |
| `NotificationsScreen.tsx` | notificationImage | `140px` | Responsive değil |
| `AllNewsScreen.tsx` | newsImage | `110×100px` | Küçük ekranlarda sıkışık |
| `CourseDetailScreen.tsx` | lessonItem | `width: 280px` | Scroll item sabit |
| `MembershipScreen.tsx` | progressConnector | sabit genişlik | Adapte olmaz |

### O4 — AllNewsScreen: Slider Snap Hizalama Sorunu

**Dosya:** `screens/AllNewsScreen.tsx`

```tsx
<FlatList
  pagingEnabled  // ← pagingEnabled tam ekran genişliğine snap yapar
  // AMA slide item'lar padding yüzünden (screenWidth - 32) genişliğinde
  // → Snap pozisyonları yanlış hizalanır
/>
```

`snapToInterval={screenWidth - 32}` + `decelerationRate="fast"` kullanılmalı.

### O5 — PartnerInstitutionsScreen: Çift SafeArea + Negatif Margin

**Dosya:** `screens/PartnerInstitutionsScreen.tsx`

```tsx
// SafeAreaView + paddingTop: 44 → Notch'lu telefonlarda çift inset
headerContainer: { paddingTop: 44 }
contentContainer: { marginTop: -64 } // Kırılgan overlap efekti
```

### O6 — AppNavigator: Dark Theme Desteği Yok

**Dosya:** `navigation/AppNavigator.tsx`

```tsx
<NavigationContainer>  // ← theme prop yok
  // Tab bar renkleri hardcoded light mode
  tabBarActiveTintColor: '#1e40af',
  tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e2e8f0' }
```

React Navigation'ın `DarkTheme` / `DefaultTheme` kullanılmalı.

### O7 — BranchesScreen: Absolute Badge Overlap

**Dosya:** `screens/BranchesScreen.tsx`

Absolute-positioned `memberBadge` dar ekranlarda branch name metni ile çakışıyor.

### O8 — PartnerDetailScreen: Negatif Margin Badge

**Dosya:** `screens/PartnerDetailScreen.tsx`

Badge elementi negatif margin ile konumlandırılmış, altındaki content `paddingTop` ile telafi ediyor — kırılgan bir yapı.

---

## 🟢 DÜŞÜK SEVİYE SORUNLAR

| # | Dosya | Sorun |
|---|-------|-------|
| D1 | `IslamicTileBackground.tsx` | Sabit 200px tile boyutu — responsive değil |
| D2 | `CircularPersianMotif.tsx` | Sabit default size prop |
| D3 | `SkeletonLoader.tsx` | Shimmer renkleri dark mode'da yanlış |
| D4 | `OfflineBanner.tsx` | Safe area top padding eksik (notch cihazlar) |
| D5 | `UpdateModal.tsx` | Modal max genişliği sabit piksel |
| D6 | `ForgotPasswordScreen.tsx` | Başarı state'inde ScrollView'da `keyboardShouldPersistTaps` eksik |
| D7 | `BranchesScreen.tsx` | FlatList `estimatedItemSize: 140` gerçek boyutla uyumsuz olabilir |
| D8 | `BranchDetailScreen.tsx` | Stat sayıları için büyük font — çok küçük ekranlarda taşabilir |
| D9 | `PartnerDetailScreen.tsx` | Alt kısımda `paddingBottom: 100` — küçük ekranlarda aşırı |
| D10 | `CourseDetailScreen.tsx` | Header title'da `numberOfLines` yok |

---

## 🏗️ ÖNCELİKLİ AKSİYON PLANI

### Faz 1: Kritik Düzeltmeler (Hemen)

| # | Aksiyon | Dosyalar | Tahmini Süre |
|---|---------|----------|-------------|
| 1 | Dark mode tema altyapısı oluştur | `theme.ts`, yeni `ThemeContext.tsx` | 2 saat |
| 2 | `Dimensions.get()` → `useWindowDimensions()` | HomeScreen, WelcomeScreen, HamburgerMenu, SkeletonLoader, DocumentScreen, ProfileDetailScreen | 1 saat |
| 3 | MuktesepScreen'e `KeyboardAvoidingView` ekle | MuktesepScreen | 15 dk |
| 4 | CourseDetailScreen content item overflow | CourseDetailScreen | 15 dk |
| 5 | PartnerDetailScreen header responsive yap | PartnerDetailScreen | 15 dk |

### Faz 2: Yüksek Öncelikli Düzeltmeler (1 hafta)

| # | Aksiyon | Dosyalar |
|---|---------|----------|
| 6 | Sabit safe area inset'leri → `useSafeAreaInsets()` | HamburgerMenu, BirthDatePickerModal |
| 7 | Emoji toggle → Ionicons | CustomInput |
| 8 | StatusBar yönetimini deklaratif yap | HomeScreen, AppNavigator |
| 9 | HtmlContent dark mode desteği | HtmlContent |
| 10 | AppNavigator dark theme prop | AppNavigator |

### Faz 3: Orta Öncelikli Düzeltmeler (2-3 hafta)

| # | Aksiyon | Dosyalar |
|---|---------|----------|
| 11 | ~500 hardcoded rengi tema sabitine taşı | 29 ekran + 5 bileşen |
| 12 | Eksik `numberOfLines` ekle | HamburgerMenu (11), Profile (4), Branches (3), vb. |
| 13 | Sabit piksel yükseklikleri responsive yap | 6 dosya |
| 14 | AllNewsScreen slider snap düzelt | AllNewsScreen |
| 15 | Çift SafeArea / negatif margin yapıları düzelt | PartnerInstitutions, PartnerDetail |

### Faz 4: İyileştirmeler (Devam eden)

| # | Aksiyon |
|---|---------|
| 16 | Tüm bileşenlere accessibility label/role ekle |
| 17 | Dekoratif SVG bileşenlerini screen reader'dan gizle |
| 18 | Responsive font scaling desteği |

---

## 📱 Etkilenen Cihaz Profilleri

| Sorun | iPhone SE | iPhone 15 | iPad | Katlanabilir | Android (küçük) |
|-------|-----------|-----------|------|-------------|-----------------|
| Dark mode | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sabit header yükseklikleri | ❌❌ | ✅ | ✅ | ✅ | ❌❌ |
| Stale dimensions | ✅ | ✅ | ❌❌ | ❌❌ | ✅ |
| Metin taşması | ❌ | ⚠️ | ✅ | ✅ | ❌❌ |
| Klavye overlap | ❌❌ | ❌ | ⚠️ | ❌ | ❌❌ |

**Açıklama:** ❌❌ = Ciddi etkileniyor | ❌ = Etkileniyor | ⚠️ = Kısmen | ✅ = Etkilenmiyor

---

## 🔑 Sonuç

Uygulamanın en büyük sistemik sorunu **dark mode altyapısının hiç bulunmaması**dır. 500+ hardcoded renk değeri ile bu sorunun ekran ekran düzeltilmesi yerine, merkezi bir tema sistemi (`ThemeContext` + `useTheme` hook) oluşturulup tüm renklerin oradan çekilmesi önerilir.

İkinci kritik sorun **modül seviyesindeki `Dimensions.get()`** çağrılarıdır — bu 6 dosyada ekran döndürme ve katlanabilir cihaz desteğini tamamen bozar.

Üçüncü önemli alan **metin taşması** sorunlarıdır — özellikle `HamburgerMenu` ve `CourseDetailScreen`'de uzun metinler layout'u bozabilir.

Bu üç alan düzeltildiğinde, uygulamanın frontend kalitesi önemli ölçüde artacaktır.
