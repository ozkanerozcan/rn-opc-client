# PWA Özellikleri

Bu uygulama artık Progressive Web App (PWA) özelliklerine sahiptir.

## Özellikler

### ✅ Kurulum
- **Ana ekrana ekle**: Kullanıcılar uygulamayı mobil cihazlarının ana ekranına ekleyebilir
- **Masaüstü kurulum**: Masaüstü tarayıcılarda uygulama kurulabilir

### 📱 Mobil Deneyim
- **Tam ekran mod**: Uygulama tarayıcı adres çubuğu olmadan çalışır
- **Splash screen**: Uygulama açılırken gösterilir
- **Doğru ikonlar**: Tüm cihazlar için optimize edilmiş ikonlar (128x128, 192x192, 256x256, 384x384, 512x512)

### 🔄 Offline Çalışma
- **Service Worker**: Uygulama cache'leme için service worker kullanır
- **Offline modu**: İnternet bağlantısı olmadan da çalışabilir
- **Offline sayfası**: Bağlantı kesildiğinde kullanıcıya bilgi verir

### ⚡ Performans
- **Cache stratejisi**: Network-first stratejisi ile güncel içerik
- **Hızlı yükleme**: Cache'lenmiş içerik hızlı yüklenir
- **Otomatik güncelleme**: Yeni sürümler otomatik olarak güncellenir

## Dosya Yapısı

```
expo-app/
├── public/
│   ├── manifest.json          # PWA manifest dosyası
│   ├── service-worker.js      # Service worker
│   ├── offline.html           # Offline sayfası
│   ├── favicon.ico            # Favicon
│   └── icons/                 # PWA ikonları
│       ├── icon-128x128.png
│       ├── icon-192x192.png
│       ├── icon-256x256.png
│       ├── icon-384x384.png
│       ├── icon-512x512.png
│       ├── android-chrome-192x192.png
│       ├── android-chrome-512x512.png
│       └── apple-touch-icon.png
├── app/
│   └── _layout.js             # Service worker kaydı buradadır
└── app.json                   # PWA yapılandırması
```

## Kullanım

### Web'de Test Etme

1. Uygulamayı başlatın:
   ```bash
   npm run web
   ```

2. Chrome DevTools'u açın (F12)
3. "Application" sekmesine gidin
4. "Service Workers" bölümünden service worker'ın çalıştığını kontrol edin
5. "Manifest" bölümünden manifest dosyasının doğru yüklendiğini kontrol edin

### Lighthouse ile PWA Skoru Kontrol Etme

1. Chrome DevTools'u açın (F12)
2. "Lighthouse" sekmesine gidin
3. "Progressive Web App" seçeneğini işaretleyin
4. "Analyze page load" butonuna tıklayın

### Mobil Cihazda Test Etme

1. Uygulamayı production build ile deploy edin
2. HTTPS üzerinden erişin (PWA için gerekli)
3. Mobil tarayıcıda açın
4. "Ana ekrana ekle" seçeneğini kullanın

## Yapılandırma

### Manifest Düzenleme

`public/manifest.json` dosyasını düzenleyerek:
- Uygulama adını değiştirin
- Tema rengini değiştirin
- Display modunu değiştirin (standalone, fullscreen, minimal-ui)

### Service Worker Düzenleme

`public/service-worker.js` dosyasını düzenleyerek:
- Cache stratejisini değiştirin (network-first, cache-first, stale-while-revalidate)
- Cache edilecek dosyaları belirleyin
- Cache sürümünü güncelleyin

### İkon Değiştirme

ICONS klasöründeki ikonları değiştirerek yeni ikonları ekleyin ve `manifest.json` dosyasını güncelleyin.

## Notlar

- PWA özellikleri sadece HTTPS üzerinden çalışır (localhost hariç)
- Service worker'lar production build'de daha iyi çalışır
- Offline modu için tüm gerekli kaynakların cache'lenmesi gerekir
- Cache sürümünü her güncelleme sonrası değiştirin (`CACHE_NAME` değişkeni)

## Sorun Giderme

### Service Worker Çalışmıyor

1. Tarayıcı konsolunu kontrol edin
2. HTTPS kullandığınızdan emin olun
3. Service worker'ı unregister edip tekrar kaydedin:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```

### Manifest Yüklenmiyor

1. `public/manifest.json` dosyasının erişilebilir olduğundan emin olun
2. Manifest'in geçerli JSON formatında olduğunu kontrol edin
3. Tarayıcı konsolunda hata mesajlarını kontrol edin

### Cache Güncellenmiyor

1. `service-worker.js` içindeki `CACHE_NAME` değişkenini değiştirin
2. Service worker'ı unregister edin ve tekrar kaydedin
3. Tarayıcı cache'ini temizleyin

## Kaynaklar

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Expo PWA](https://docs.expo.dev/guides/progressive-web-apps/)
