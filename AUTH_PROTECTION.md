# Authentication Protection System

## Overview
Sistematik ve ölçeklenebilir bir kimlik doğrulama koruma sistemi implementasyonu.

## Koruma Stratejisi

### 🔒 Varsayılan Olarak Korumalı (Default Protected)
**TÜM SAYFALAR VARSAYILAN OLARAK KORUMADIR!**

Bu sistem "whitelist" yaklaşımı kullanır:
- Yeni eklenen her sayfa **otomatik olarak korumalıdır**
- Sadece açıkça belirtilen sayfalar herkese açıktır
- Korumayı kaldırmak için sayfa manuel olarak public listesine eklenmelidir

### ✅ Avantajlar
1. **Güvenlik Öncelikli**: Unutulan veya yeni eklenen sayfalar otomatik korunur
2. **Bakım Kolaylığı**: Her sayfaya ayrı koruma kodu eklemeye gerek yok
3. **Tek Noktadan Yönetim**: Tüm kontrol `AuthGuard` bileşeninde
4. **Hata Toleransı**: Yeni sayfa eklerken koruma unutulsa bile güvende

## Implementasyon

### 1. AuthGuard Bileşeni (`components/AuthGuard.js`)

```javascript
// Public routes - Sadece bu sayfalar kimlik doğrulaması gerektirmez
const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  '', // root
];

// Yeni bir public sayfa eklemek için:
// 1. Yukarıdaki listeye sayfa adını ekleyin
// 2. Başka bir şey yapmanıza gerek yok!
```

### 2. Yeni Sayfa Ekleme

#### Korumalı Sayfa Eklemek (Varsayılan):
```javascript
// app/new-feature.js
export default function NewFeature() {
  // Hiçbir ek kod gerekmez!
  // Sayfa otomatik olarak korumalıdır
  return <View>...</View>;
}
```

#### Public Sayfa Eklemek (Nadir):
```javascript
// 1. Sayfayı oluştur: app/terms.js
export default function Terms() {
  return <View>...</View>;
}

// 2. AuthGuard.js içinde PUBLIC_ROUTES'a ekle:
const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  'terms', // ← Yeni eklenen
];
```

## Mevcut Sayfa Yapısı

### 🔓 Public Sayfalar (Kimlik doğrulaması gerekmez)
- `/` (index) - Yönlendirme sayfası
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası

### 🔒 Korumalı Sayfalar (Kimlik doğrulaması gerekir)
- `/(tabs)` - Ana uygulama (tabs)
  - `/(tabs)/index` - Ana sayfa
  - `/(tabs)/explore` - Keşfet
  - `/(tabs)/settings` - Ayarlar
  - `/(tabs)/profile` - Profil
- `/plc-connection` - PLC bağlantı yönetimi
- `/browse-nodes` - Node tarama
- `/subscribe-node` - Node abonelik
- `/plc-test` - PLC test
- `/opcua-settings` - OPC UA ayarları
- `/personal-details` - Kişisel bilgiler
- `/change-password` - Şifre değiştirme
- `/help` - Yardım
- `/privacy` - Gizlilik

### ➕ Yeni Eklenen Her Sayfa
- **Otomatik olarak korumalıdır**
- Ek kod gerektirmez
- Public yapmak için açıkça belirtilmesi gerekir

## Kimlik Doğrulama Akışı

```
Kullanıcı Sayfaya Giriş Yapmaya Çalışır
           ↓
    AuthGuard Kontrolü
           ↓
    ┌──────────────────────┐
    │ Sayfa Public mu?     │
    └──────────────────────┘
           ↓           ↓
        EVET          HAYIR
           ↓           ↓
      Erişim OK   Kullanıcı giriş yapmış mı?
                       ↓           ↓
                    EVET          HAYIR
                       ↓           ↓
                  Erişim OK   Redirect /login
```

### Giriş Yapmamış Kullanıcı:
1. Herhangi bir sayfaya gitmek ister
2. `AuthGuard` kontrol eder
3. Public değilse → `/login`'e yönlendirilir
4. Sadece `/login` ve `/register` erişilebilir

### Giriş Yapmış Kullanıcı:
1. Tüm korumalı sayfalara erişebilir
2. `/login` veya `/register`'a giderse → `/(tabs)`'a yönlendirilir
3. Çıkış yapınca otomatik `/login`'e yönlendirilir

## Kod Örnekleri

### ❌ YANLIŞ - Her sayfaya koruma eklemek
```javascript
// BUNA GEREK YOK!
export default function MyPage() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);
  
  return <View>...</View>;
}
```

### ✅ DOĞRU - Hiçbir şey eklememek
```javascript
// Sayfa otomatik korunur!
export default function MyPage() {
  return <View>...</View>;
}
```

### ✅ DOĞRU - Public sayfa eklemek
```javascript
// AuthGuard.js içinde:
const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  'forgot-password', // Yeni public sayfa
];

// Sayfa:
export default function ForgotPassword() {
  return <View>...</View>;
}
```

## Debug ve Test

### Console Logları
`AuthGuard` her route değişiminde log yazdırır:
```javascript
[AuthGuard] {
  user: 'user@example.com', // veya 'none'
  currentRoute: 'plc-connection',
  isPublicRoute: false,
  segments: ['plc-connection'],
  pathname: '/plc-connection'
}
```

### Test Senaryoları

#### ✅ Giriş Yapmamış Kullanıcı:
- [ ] Direkt `/plc-connection` açılmaz → `/login`'e yönlendirilir
- [ ] Direkt `/(tabs)` açılmaz → `/login`'e yönlendirilir
- [ ] `/login` açılır
- [ ] `/register` açılır
- [ ] Giriş yapınca `/(tabs)` açılır

#### ✅ Giriş Yapmış Kullanıcı:
- [ ] Tüm sayfalara erişebilir
- [ ] `/login` açılmaz → `/(tabs)` yönlendirilir
- [ ] `/register` açılmaz → `/(tabs)` yönlendirilir
- [ ] Çıkış yapınca `/login`'e yönlendirilir

#### ✅ Yeni Sayfa Ekleme:
- [ ] `app/new-page.js` oluştur
- [ ] Hiçbir koruma kodu ekleme
- [ ] Giriş yapmadan erişmeye çalış → `/login`'e gitmeli
- [ ] Giriş yapınca erişebilmeli

## Önemli Notlar

1. **Yeni Sayfa Güvenliği**: Yeni sayfa eklediğinizde VARSAYILAN OLARAK KORUNUR
2. **Public Sayfa**: Public yapmak istiyorsanız `PUBLIC_ROUTES` listesine eklemelisiniz
3. **Tek Nokta Yönetim**: Tüm kontrol `AuthGuard` bileşeninde
4. **Performans**: Route değişimlerinde minimal kontrol
5. **Deep Linking**: Tüm deep linkler de korunur

## Gelecekte Ekleme Önerileri

### Public Sayfa Eklemek İstiyorsanız:
```javascript
// AuthGuard.js
const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  'forgot-password',    // Şifre sıfırlama
  'terms-of-service',   // Kullanım şartları
  'contact',            // İletişim
];
```

### Role-Based Access (İleride):
```javascript
// AuthGuard içine eklenebilir
const ADMIN_ONLY_ROUTES = ['admin', 'users', 'settings'];
const PREMIUM_ROUTES = ['premium-feature', 'analytics'];
```

## Bağımlılıklar
- `expo-router` - Routing
- `@supabase/supabase-js` - Authentication
- React Context API - State management

## Özet

✅ **Varsayılan olarak her sayfa korumalı**  
✅ **Yeni sayfa = Otomatik korumalı**  
✅ **Tek noktadan yönetim**  
✅ **Bakımı kolay**  
✅ **Güvenli**  

Artık yeni sayfa eklerken koruma için ekstra bir şey yapmanıza gerek yok! 🎉

