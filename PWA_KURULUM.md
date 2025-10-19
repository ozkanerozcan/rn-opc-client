# PWA Kurulum ve Kullanım Rehberi

## ✅ Yapılan Değişiklikler

### 1. PWA Dosyaları Oluşturuldu
- ✅ `public/manifest.json` - PWA manifest dosyası
- ✅ `public/service-worker.js` - Offline çalışma için service worker
- ✅ `public/offline.html` - İnternet kesildiğinde gösterilen sayfa
- ✅ `public/icons/` - Tüm PWA ikonları (ICONS klasöründen kopyalandı)

### 2. Yapılandırma Güncellendi
- ✅ `app.json` - PWA ayarları eklendi (manifest, service worker, tema rengi)
- ✅ `app/_layout.js` - Service worker kaydı ve PWA meta etiketleri eklendi

### 3. Ek Bileşenler
- ✅ `components/InstallPWA.js` - "Uygulamayı Yükle" butonu komponenti
- ✅ `PWA_README.md` - Detaylı PWA dokümantasyonu

## 🚀 Hızlı Başlangıç

### 1. Uygulamayı Web Modunda Başlatın

```bash
cd expo-app
npm run web
```

### 2. Tarayıcıda Test Edin

1. Chrome veya Edge tarayıcısında `http://localhost:8081` adresini açın
2. F12 ile Developer Tools'u açın
3. "Application" sekmesine gidin
4. Sol menüden "Service Workers" seçeneğini kontrol edin
5. Sol menüden "Manifest" seçeneğini kontrol edin

### 3. PWA Olarak Yükleyin

#### Desktop (Chrome/Edge):
1. Adres çubuğunun sağında "Yükle" simgesine tıklayın
2. Veya menüden "Uygulamayı yükle" seçeneğini seçin

#### Mobil (Chrome/Safari):
1. Tarayıcı menüsünü açın
2. "Ana ekrana ekle" seçeneğini tıklayın
3. Uygulama ana ekranınıza eklenecek

## 📱 InstallPWA Bileşenini Kullanma

Uygulamanızın herhangi bir sayfasına "Yükle" butonu eklemek için:

```javascript
import InstallPWA from '../components/InstallPWA';

export default function HomePage() {
  return (
    <View>
      {/* Diğer içerikler */}
      <InstallPWA />
    </View>
  );
}
```

Bu bileşen:
- Sadece web platformunda görünür
- Uygulama zaten yüklüyse gizlenir
- Tarayıcı PWA yüklemeyi desteklemiyorsa gizlenir
- Kullanıcıya yükleme istemi gösterir

## 🔍 PWA Özelliklerini Test Etme

### 1. Service Worker Test

```bash
# Chrome DevTools > Application > Service Workers
# "Update on reload" seçeneğini işaretleyin
# Sayfayı yenileyin ve service worker'ın aktif olduğunu görün
```

### 2. Offline Modu Test

```bash
# Chrome DevTools > Network
# "Offline" seçeneğini işaretleyin
# Sayfa hala çalışmalı (cache'lenmiş içerik gösterilmeli)
```

### 3. Manifest Test

```bash
# Chrome DevTools > Application > Manifest
# Tüm bilgilerin doğru göründüğünden emin olun
# İkonların doğru yüklendiğini kontrol edin
```

### 4. Lighthouse PWA Skoru

```bash
# Chrome DevTools > Lighthouse
# "Progressive Web App" seçeneğini işaretleyin
# "Generate report" butonuna tıklayın
# PWA skorunun 80+ olmasını hedefleyin
```

## 🌐 Production'a Deploy Etme

PWA'nın tam olarak çalışması için:

1. **HTTPS gereklidir** (localhost hariç)
2. Service worker sadece production build'de düzgün çalışır
3. Tüm ikonların erişilebilir olduğundan emin olun

### Production Build

```bash
# Web için production build
npx expo export:web

# Oluşturulan dosyaları bir web sunucusuna deploy edin
# Dosyalar web-build/ klasöründe olacak
```

### Deploy Seçenekleri

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=web-build
```

**GitHub Pages:**
```bash
# package.json'a ekleyin:
"homepage": "https://kullaniciadi.github.io/repo-adi",
"predeploy": "expo export:web",
"deploy": "gh-pages -d web-build"

npm install --save-dev gh-pages
npm run deploy
```

## ⚙️ Özelleştirme

### Manifest Düzenleme

`public/manifest.json` dosyasını düzenleyin:

```json
{
  "short_name": "Kısa Adı",
  "name": "Tam Uygulama Adı",
  "theme_color": "#yourcolor",
  "background_color": "#yourcolor",
  "display": "standalone"  // veya "fullscreen", "minimal-ui"
}
```

### Service Worker Stratejisi Değiştirme

`public/service-worker.js` dosyasında cache stratejisini değiştirin:

- **Network First** (Mevcut): Önce network'ten al, başarısız olursa cache'den
- **Cache First**: Önce cache'den al, yoksa network'ten
- **Stale While Revalidate**: Cache'den hemen göster, arka planda güncelle

### Cache Sürümü Güncelleme

Her deployment'ta cache sürümünü güncelleyin:

```javascript
// public/service-worker.js
const CACHE_NAME = 'opcua-app-v2'; // v1'den v2'ye değiştirin
```

## 🐛 Sorun Giderme

### Service Worker Kayıt Olmuyor

```javascript
// app/_layout.js içinde kontrol edin
if ('serviceWorker' in navigator) {
  console.log('Service Worker destekleniyor');
} else {
  console.log('Service Worker desteklenmiyor');
}
```

### Cache Güncellenmiyor

```javascript
// Tarayıcı konsolunda çalıştırın:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
// Sonra sayfayı yenileyin
```

### İkonlar Görünmüyor

1. `public/icons/` klasöründe ikonların olduğundan emin olun
2. `manifest.json` dosyasındaki icon yollarını kontrol edin
3. Tarayıcı konsolunda 404 hataları olup olmadığını kontrol edin

## 📊 PWA Kontrol Listesi

- [x] Manifest dosyası var
- [x] Service worker kayıtlı
- [x] İkonlar mevcut (192x192 ve 512x512 minimum)
- [x] HTTPS üzerinden sunuluyor (production'da)
- [x] Offline sayfası var
- [x] Meta etiketler eklendi
- [x] Theme color ayarlandı
- [x] Viewport ayarları yapıldı

## 🎯 Sonraki Adımlar

1. Uygulamayı web modunda test edin
2. PWA olarak yükleyip çalıştığını doğrulayın
3. Offline modunu test edin
4. Lighthouse skorunu kontrol edin
5. Production'a deploy edin
6. Mobil cihazlarda test edin

## 📚 Kaynaklar

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [Expo PWA Docs](https://docs.expo.dev/guides/progressive-web-apps/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)

## 🆘 Destek

Sorun yaşarsanız:

1. Tarayıcı konsolunu kontrol edin
2. Chrome DevTools > Application sekmesini inceleyin
3. Service worker log'larına bakın
4. Cache durumunu kontrol edin

---

**Not:** PWA özellikleri sadece web platformunda çalışır. Native iOS ve Android uygulamalar bundan etkilenmez.
