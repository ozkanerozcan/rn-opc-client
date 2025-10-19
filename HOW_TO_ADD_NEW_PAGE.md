# Yeni Sayfa Nasıl Eklenir? 📄

## TL;DR (Kısa Özet)

Yeni sayfa eklerken **HİÇBİR ŞEY YAPMANA GEREK YOK!**

Sayfa otomatik olarak korunur. Sadece oluştur ve kullan! 🎉

---

## Detaylı Rehber

### 1️⃣ Korumalı Sayfa Eklemek (Varsayılan - %99 Durum)

Yeni bir sayfa oluşturduğunuzda, **otomatik olarak giriş yapmış kullanıcılar tarafından erişilebilir**.

#### Örnek: Dashboard Sayfası

```javascript
// app/dashboard.js
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Dashboard() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Dashboard
      </Text>
      {/* Dashboard içeriği */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**Bu kadar!** Sayfa artık:
- ✅ Sadece giriş yapmış kullanıcılar tarafından erişilebilir
- ✅ Giriş yapmamış kullanıcılar `/login`'e yönlendirilir
- ✅ Hiçbir ekstra kod gerekmez

#### Sayfaya Navigasyon

```javascript
// Başka bir sayfadan:
import { useRouter } from 'expo-router';

export default function SomePage() {
  const router = useRouter();
  
  return (
    <TouchableOpacity onPress={() => router.push('/dashboard')}>
      <Text>Dashboard'a Git</Text>
    </TouchableOpacity>
  );
}
```

---

### 2️⃣ Public Sayfa Eklemek (Nadir - %1 Durum)

Eğer sayfanın **giriş yapmadan** erişilebilir olmasını istiyorsanız:

#### Adım 1: Sayfayı Oluştur

```javascript
// app/about.js
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function About() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Hakkımızda
      </Text>
      <Text style={[styles.text, { color: colors.subtext }]}>
        Bu uygulama hakkında bilgiler...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
```

#### Adım 2: Public Listeye Ekle

`components/AuthGuard.js` dosyasını aç ve `PUBLIC_ROUTES` listesine ekle:

```javascript
// components/AuthGuard.js

const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  'about',           // ← Yeni eklenen public sayfa
];
```

**Önemli:** Public sayfalar çok nadir olmalıdır. Sadece şunlar için kullanın:
- Hakkımızda
- İletişim
- Kullanım Şartları
- Gizlilik Politikası (herkes için açık)
- Şifre Sıfırlama

---

## Örnek Senaryolar

### ✅ Senaryo 1: Yeni Analytics Sayfası

```javascript
// app/analytics.js
import { View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Analytics() {
  const { user } = useAuth(); // user otomatik olarak var
  
  return (
    <View>
      <Text>Analytics for {user.email}</Text>
      {/* Analytics grafikler vs. */}
    </View>
  );
}
```

Hiçbir şey eklemediniz ama:
- ✅ Sadece giriş yapmış kullanıcılar erişebilir
- ✅ `user` verisi her zaman mevcut
- ✅ Giriş yapmamış kullanıcılar login'e yönlendirilir

### ✅ Senaryo 2: Reports Sayfası (Nested Route)

```javascript
// app/reports/monthly.js
export default function MonthlyReports() {
  return (
    <View>
      <Text>Aylık Raporlar</Text>
    </View>
  );
}
```

Nested route'lar da otomatik korunur! `/reports/monthly` sadece giriş yapmış kullanıcılar tarafından erişilebilir.

### ✅ Senaryo 3: Contact Form (Public)

```javascript
// app/contact.js
export default function Contact() {
  return (
    <View>
      <Text>İletişim Formu</Text>
      <TextInput placeholder="İsim" />
      <TextInput placeholder="Email" />
      <TextInput placeholder="Mesaj" multiline />
      <Button title="Gönder" />
    </View>
  );
}
```

Sonra `AuthGuard.js`'de:
```javascript
const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  'contact', // ← Public sayfa
];
```

---

## Tabs İçine Sayfa Eklemek

### Yeni Tab Eklemek

```javascript
// app/(tabs)/notifications.js
export default function Notifications() {
  return (
    <View>
      <Text>Bildirimler</Text>
    </View>
  );
}
```

Tab layout'ta görünür yapmak için:

```javascript
// app/(tabs)/_layout.js
<Tabs>
  {/* Mevcut tablar */}
  
  <Tabs.Screen
    name="notifications"
    options={{
      title: 'Bildirimler',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="notifications" size={size} color={color} />
      ),
    }}
  />
</Tabs>
```

---

## Modal veya Overlay Sayfa

```javascript
// app/confirmation.js
import { useRouter } from 'expo-router';

export default function Confirmation() {
  const router = useRouter();
  
  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text>İşlem başarılı!</Text>
        <Button title="Kapat" onPress={() => router.back()} />
      </View>
    </View>
  );
}
```

Modal'lar da otomatik korunur!

---

## ❌ YAPMAYIN!

### ❌ Her sayfaya koruma kodu eklemeyin

```javascript
// BUNA GEREK YOK!
export default function MyPage() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);
  
  return <View>...</View>;
}
```

### ❌ useAuth kullanmadan önce kontrol etmeyin

```javascript
// BUNA GEREK YOK!
export default function MyPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <ActivityIndicator />;
  }
  
  return <View>...</View>;
}
```

`AuthGuard` zaten kontrol ediyor!

---

## Özet Checklist

### Yeni Korumalı Sayfa (Varsayılan):
- [ ] `app/sayfa-adi.js` oluştur
- [ ] Kodunu yaz
- [ ] Kullan! (Başka bir şey yapmana gerek yok)

### Yeni Public Sayfa (Nadir):
- [ ] `app/sayfa-adi.js` oluştur
- [ ] Kodunu yaz
- [ ] `components/AuthGuard.js` içinde `PUBLIC_ROUTES` listesine ekle
- [ ] Kullan!

---

## Sorun Giderme

### Sayfa açılmıyor, login'e yönlendiriyor

**Durum:** Giriş yapmış olsanız bile sayfa açılmıyor.

**Çözüm:** Console'a bak, `[AuthGuard]` loglarını kontrol et:

```javascript
[AuthGuard] {
  user: 'user@example.com',
  currentRoute: 'my-page',
  isPublicRoute: false,
  segments: ['my-page'],
  pathname: '/my-page'
}
```

Eğer `user: 'none'` gösteriyorsa, giriş yapılmamış demektir.

### Public sayfa korumalı gibi davranıyor

**Durum:** Public olması gereken sayfa login istiyor.

**Çözüm:** `AuthGuard.js`'de `PUBLIC_ROUTES` listesini kontrol et. Sayfa adı listeye ekli mi?

```javascript
const PUBLIC_ROUTES = [
  'login',
  'register',
  'index',
  'your-page-name', // ← Bu olmalı
];
```

---

## İleri Seviye

### Role-Based Access (İleride)

Eğer bazı sayfaların sadece admin veya premium kullanıcılar tarafından erişilebilir olmasını istiyorsanız:

```javascript
// components/AuthGuard.js içine eklenebilir
const ADMIN_ONLY_ROUTES = ['admin-panel', 'user-management'];
const PREMIUM_ROUTES = ['advanced-analytics', 'export-data'];

// Kontrol:
if (ADMIN_ONLY_ROUTES.includes(currentRoute) && !user.is_admin) {
  router.replace('/(tabs)');
}
```

### Permission-Based Access

```javascript
// Daha gelişmiş:
const ROUTE_PERMISSIONS = {
  'admin-panel': ['admin'],
  'analytics': ['admin', 'premium'],
  'reports': ['admin', 'premium', 'manager'],
};

// Kontrol:
const requiredPermissions = ROUTE_PERMISSIONS[currentRoute];
if (requiredPermissions && !hasPermission(user, requiredPermissions)) {
  router.replace('/(tabs)');
}
```

---

## Sonuç

Artık yeni sayfa eklemek çok kolay! 🎉

1. Sayfayı oluştur
2. Kullan

Koruma otomatik! 🔒
