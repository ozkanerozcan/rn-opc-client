# Production Deployment Rehberi

## Sorun: 404 Hataları

Gördüğünüz hatalar (`/_expo/static/` yolları 404 veriyor), production build'in doğru yapılandırılması gerektiğini gösteriyor.

## Çözüm Adımları

### 1. Yeni Build Oluşturma

```bash
cd expo-app

# Önce node_modules'i temizleyin (opsiyonel ama önerilen)
rm -rf node_modules
npm install

# Yeni production build
npm run build:web

# Build tamamlandıktan sonra dist/ klasörü güncellenmiş olacak
```

### 2. Deployment Platformuna Göre Yapılandırma

#### A) Cloudflare Pages (Şu anki platformunuz)

**Cloudflare Pages Dashboard'da:**

1. Project Settings > Build & deployments
2. Build yapılandırmasını ayarlayın:
   - **Build command:** `npm run build:web`
   - **Build output directory:** `dist`
   - **Root directory:** `expo-app` (eğer subdirectory ise)

3. Environment Variables ekleyin (gerekirse):
   ```
   NODE_VERSION=18
   NPM_VERSION=9
   ```

4. Yeniden deploy edin

**dist/ klasöründe olması gerekenler:**
- ✅ `index.html` (güncellenmiş PWA meta etiketleri ile)
- ✅ `manifest.json`
- ✅ `service-worker.js`
- ✅ `_redirects` (Cloudflare için)
- ✅ `icons/` klasörü
- ✅ `_expo/` klasörü (statik assets)

#### B) Vercel

```bash
# Vercel CLI ile deploy
npm install -g vercel
vercel --prod

# Veya vercel.json zaten oluşturuldu
```

#### C) Netlify

```bash
# Netlify CLI ile deploy
npm install -g netlify-cli
netlify deploy --prod --dir=dist

# _redirects dosyası zaten oluşturuldu
```

#### D) GitHub Pages

```bash
# package.json'a ekleyin:
"homepage": "https://kullaniciadi.github.io/repo-adi"

# Deploy
npm install --save-dev gh-pages
npm run build:web
npx gh-pages -d dist
```

#### E) Kendi Sunucunuz (Apache/Nginx)

**Apache:**
```bash
# dist/ klasörünü sunucuya kopyalayın
scp -r dist/* user@server:/var/www/html/

# .htaccess zaten dist/ içinde
```

**Nginx:**
```bash
# dist/ klasörünü sunucuya kopyalayın
scp -r dist/* user@server:/var/www/html/

# nginx.conf'u kullanın (expo-app/ klasöründe)
sudo cp nginx.conf /etc/nginx/sites-available/your-site
sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. HTTPS Kontrolü

PWA'lar HTTPS gerektirir:

**Cloudflare:** Otomatik HTTPS var ✅

**Diğer platformlar:**
- Let's Encrypt kullanın (ücretsiz)
- Certbot ile SSL sertifikası alın

```bash
sudo certbot --nginx -d your-domain.com
```

### 4. Cache Temizleme

Deployment sonrası:

**Cloudflare Pages:**
1. Dashboard > Caching > Configuration
2. "Purge Everything" butonuna tıklayın

**Tarayıcı:**
```javascript
// Console'da çalıştırın
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
location.reload(true);
```

### 5. Doğrulama

Deployment sonrası kontroller:

```bash
# 1. Service Worker
curl https://your-domain.com/service-worker.js
# HTTP 200 dönmeli

# 2. Manifest
curl https://your-domain.com/manifest.json
# HTTP 200 dönmeli, JSON dökmeli

# 3. Icons
curl https://your-domain.com/icons/icon-192x192.png
# HTTP 200 dönmeli

# 4. Main page
curl https://your-domain.com/
# HTTP 200 dönmeli, HTML dökmeli
```

**Tarayıcıda:**
1. F12 > Application
2. Service Workers bölümünü kontrol edin
3. Manifest bölümünü kontrol edin
4. F12 > Network > Disable cache seçeneğini kaldırın
5. Sayfayı yenileyin

### 6. Lighthouse PWA Skoru

```bash
# Chrome DevTools
# F12 > Lighthouse > Progressive Web App
# "Generate report" tıklayın
# Skor 80+ olmalı
```

## Hızlı Düzeltme (Şu Anki Durum İçin)

Eğer hemen düzeltme istiyorsanız:

```bash
cd expo-app

# Public dosyalarını dist'e kopyalayın (zaten yapıldı)
# Cloudflare'de yeniden deploy tetikleyin

# Veya manuel upload:
# dist/ klasörünün tamamını Cloudflare Pages'e upload edin
```

## Sorun Giderme

### Hata: `/_expo/static/` dosyalar 404

**Sebep:** Build process statik dosyaları doğru kopyalamamış.

**Çözüm:**
```bash
npm run build:web
# dist/_expo/ klasörünün oluştuğunu kontrol edin
```

### Hata: Service Worker kayıt olmuyor

**Sebep:** HTTPS yok veya dosya yolu yanlış.

**Çözüm:**
1. HTTPS kullandığınızdan emin olun
2. `/service-worker.js` dosyasının erişilebilir olduğunu kontrol edin
3. Browser console'da hata mesajlarına bakın

### Hata: Manifest yüklenmiyor

**Sebep:** Dosya yolu yanlış veya Content-Type yanlış.

**Çözüm:**
1. `/manifest.json` erişilebilir olmalı
2. Content-Type: `application/manifest+json` olmalı
3. CORS header'ları gerekebilir

## Build Script Detayları

`package.json` içinde:
```json
{
  "scripts": {
    "build:web": "expo export:web",
    "serve": "npx serve dist -s"
  }
}
```

**Yerel test:**
```bash
npm run build:web
npm run serve
# http://localhost:3000 açılacak
```

## Environment Variables

`.env` dosyasında:
```env
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

Build time'da otomatik olarak eklenir.

## Production Checklist

- [ ] `npm run build:web` çalıştırıldı
- [ ] `dist/` klasörü oluşturuldu
- [ ] `dist/manifest.json` var
- [ ] `dist/service-worker.js` var
- [ ] `dist/icons/` klasörü var
- [ ] `dist/_expo/` klasörü var (statik assets)
- [ ] HTTPS aktif
- [ ] Domain SSL sertifikası var
- [ ] Service Worker kayıt oluyor
- [ ] Manifest yükleniyor
- [ ] PWA install prompt gösteriliyor
- [ ] Offline mod çalışıyor
- [ ] Lighthouse skoru 80+

## Destek

Sorun devam ederse:

1. **Browser Console:** Tüm hata mesajlarını kopyalayın
2. **Network Tab:** Failed requestlerin detaylarına bakın
3. **Application Tab:** Service Worker ve Manifest durumunu kontrol edin

## İletişim

Deployment sorunları için detaylı hata mesajlarını paylaşın.
