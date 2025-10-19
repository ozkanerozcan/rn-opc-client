# 🔒 Kimlik Doğrulama Sistemi - Hızlı Özet

## Ana Kural: Varsayılan Olarak Korumalı

**TÜM SAYFALAR OTOMATİK KORUMADIR!**

Yeni sayfa eklediğinizde hiçbir şey yapmanıza gerek yok. Sayfa otomatik olarak giriş yapmış kullanıcılar için erişilebilir olur.

---

## Sistem Nasıl Çalışır?

```
┌─────────────────────────────────────────────────────────┐
│                    KULLANICI                            │
│                  Sayfaya Gitmek İster                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   AuthGuard                             │
│          (components/AuthGuard.js)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Public Sayfa? │
              └───────┬───────┘
                      │
            ┌─────────┴─────────┐
            │                   │
         EVET                HAYIR
            │                   │
            ▼                   ▼
    ┌──────────────┐    ┌──────────────┐
    │  Erişim OK   │    │ Giriş Yapmış?│
    └──────────────┘    └──────┬───────┘
                                │
                      ┌─────────┴─────────┐
                      │                   │
                   EVET                HAYIR
                      │                   │
                      ▼                   ▼
              ┌──────────────┐    ┌──────────────┐
              │  Erişim OK   │    │ → /login     │
              └──────────────┘    └──────────────┘
```

---

## Hızlı Referans

### ✅ Yeni Sayfa Eklemek

```javascript
// app/my-new-page.js
export default function MyNewPage() {
  return <View><Text>Yeni Sayfa</Text></View>;
}
```

**Bu kadar!** Sayfa otomatik korunur.

### 🔓 Public Sayfa Eklemek

1. Sayfayı oluştur
2. `components/AuthGuard.js` içinde `PUBLIC_ROUTES` listesine ekle:

```javascript
const PUBLIC_ROUTES = [
  'login',
  'register', 
  'index',
  'my-public-page', // ← Ekle
];
```

---

## Mevcut Yapı

### 🔓 Public Sayfalar
- `/` - Index (yönlendirme)
- `/login` - Giriş
- `/register` - Kayıt

### 🔒 Korumalı Sayfalar
- Diğer tüm sayfalar!

---

## Avantajlar

✅ **Güvenli**: Yeni sayfa unutulsa bile korunur  
✅ **Basit**: Ekstra kod yazmaya gerek yok  
✅ **Merkezi**: Tek noktadan yönetim  
✅ **Ölçeklenebilir**: 100 sayfa ekleyin, hepsi otomatik korunur  

---

## Dokümantasyon

- **Detaylı Açıklama**: `AUTH_PROTECTION.md`
- **Nasıl Yapılır**: `HOW_TO_ADD_NEW_PAGE.md`
- **Bu Dosya**: Hızlı referans

---

## Sorun mu Var?

### Console'da şunu gör:
```javascript
[AuthGuard] {
  user: 'email@example.com',
  currentRoute: 'page-name',
  isPublicRoute: false,
}
```

- `user: 'none'` → Giriş yapılmamış
- `isPublicRoute: true` → Public sayfa
- `isPublicRoute: false` → Korumalı sayfa

---

## Kod Lokasyonları

- **AuthGuard**: `components/AuthGuard.js`
- **Root Layout**: `app/_layout.js` 
- **Auth Context**: `contexts/AuthContext.js`

---

## Özet

Yeni sayfa → Otomatik korumalı → Hiçbir şey yapma! 🎉
