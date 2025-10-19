# 🚨 Hızlı Düzeltme - 404 Hataları

## Sorun
- `/_expo/static/css/modal.module-*.css` → 404
- `/_expo/static/js/web/entry-*.js` → 404

## Nedeni
Production build'in eski olması veya Cloudflare yapılandırması eksik.

## ✅ Hızlı Çözüm (3 Adım)

### 1. Yeni Build Oluştur

```bash
cd expo-app

# Dependency'leri yükle (webpack config için gerekli)
npm install

# Yeni production build
npm run build:web
```

### 2. Cloudflare Pages'de Yeniden Deploy

**Seçenek A: Git üzerinden (Önerilen)**
```bash
git add .
git commit -m "PWA configuration and build fix"
git push origin main
# Cloudflare otomatik deploy edecek
```

**Seçenek B: Manuel Upload**
1. Cloudflare Pages Dashboard'a gidin
2. "Upload assets" seçeneğini kullanın
3. `dist/` klasörünün tamamını upload edin

### 3. Cache'i Temizle

**Cloudflare'de:**
1. Dashboard > Caching
2. "Purge Everything" butonuna tıklayın

**Tarayıcıda:**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

## 🔍 Kontrol

Build sonrası bu dosyalar olmalı:

```
dist/
├── index.html (✅ güncellenmiş)
├── manifest.json (✅)
├── service-worker.js (✅)
├── offline.html (✅)
├── favicon.ico (✅)
├── _redirects (✅)
├── vercel.json (✅)
├── .htaccess (✅)
├── icons/ (✅)
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── _expo/ (✅ bu klasör önemli!)
    └── static/
        ├── css/
        └── js/
```

## 📦 Oluşturulan Dosyalar

1. ✅ `metro.config.js` - Metro bundler yapılandırması
2. ✅ `webpack.config.js` - Webpack yapılandırması (public klasör copy için)
3. ✅ `dist/_redirects` - Netlify/Cloudflare routing
4. ✅ `dist/vercel.json` - Vercel yapılandırması
5. ✅ `dist/.htaccess` - Apache yapılandırması
6. ✅ `nginx.conf` - Nginx yapılandırması örneği
7. ✅ `DEPLOYMENT_GUIDE.md` - Detaylı deployment rehberi
8. ✅ `dist/index.html` - PWA meta etiketleri eklendi

## 🎯 Cloudflare Pages Build Settings

Dashboard'da bu ayarları kontrol edin:

- **Framework preset:** None (veya Expo)
- **Build command:** `npm run build:web`
- **Build output directory:** `dist`
- **Root directory:** `expo-app` (eğer subdirectory ise)
- **Node.js version:** 18.x veya üzeri

## 🐛 Hala Çalışmıyorsa

### 1. Local Test
```bash
npm run serve
# http://localhost:3000 açılacak
# Burada çalışıyorsa, deployment sorunu var
```

### 2. Build Çıktısını Kontrol
```bash
ls -la dist/_expo/static/
# Bu klasör olmalı ve içinde css/, js/ klasörleri olmalı
```

### 3. Cloudflare Logs
```bash
# Cloudflare Pages > Deployments > Son deployment
# Build log'larına bakın
# Hata mesajları olup olmadığını kontrol edin
```

## 💡 Alternatif: Hızlı Test Deployment

Vercel ile hızlı test (5 dakika):

```bash
npm install -g vercel
cd expo-app
npm run build:web
vercel --prod
# Vercel bir URL verecek, orada test edin
```

## 📱 PWA Test (Deployment Sonrası)

```bash
# 1. Service Worker
https://your-domain.com/service-worker.js → 200 OK

# 2. Manifest
https://your-domain.com/manifest.json → 200 OK

# 3. Ana Sayfa
https://your-domain.com/ → 200 OK (HTML içerik)
```

## 🔄 Cloudflare Özel Notlar

Cloudflare Pages bazen cache'ler agresif tutar:

1. Build sonrası "Retry deployment" deneyin
2. Custom domain kullanıyorsanız, DNS propagation bekleyin (24 saat)
3. Cloudflare Workers kullanmıyorsanız, etkinleştirmeyin (conflict yapabilir)

## ⚡ Sonraki Build'lerde

Her deployment sonrası:

```bash
# 1. Build
npm run build:web

# 2. Commit
git add dist/
git commit -m "Production build update"
git push

# 3. Cache temizle (Cloudflare dashboard)
```

## 📞 Destek Gerekirse

Eğer sorun devam ederse paylaşın:

1. **Build log'ları** (Cloudflare dashboard'dan)
2. **Browser console hataları** (F12 > Console)
3. **Network tab** (F12 > Network, failed requests)
4. **Current URL** (deploy edilmiş site URL'i)

---

**Özet:** `npm install && npm run build:web` komutlarını çalıştırın ve Cloudflare'de yeniden deploy edin. Build sonrası `dist/_expo/` klasörü oluşmalı.
