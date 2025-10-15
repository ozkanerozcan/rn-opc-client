# SelectModal Component Kullanım Rehberi

Modern, reusable select modal component. Tüm dropdown/seçim işlemleri için kullanılmalıdır.

## 📦 Import

```javascript
import SelectModal from '../components/SelectModal';
```

## 🎯 Temel Kullanım

```javascript
import { useState } from 'react';
import SelectModal from '../components/SelectModal';

export default function MyScreen() {
  const [selectedValue, setSelectedValue] = useState('option1');
  const [showModal, setShowModal] = useState(false);

  const options = [
    { 
      label: 'Option 1', 
      value: 'option1', 
      description: 'This is option 1' 
    },
    { 
      label: 'Option 2', 
      value: 'option2', 
      description: 'This is option 2' 
    },
  ];

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Text>{options.find(o => o.value === selectedValue)?.label}</Text>
      </TouchableOpacity>

      {/* Modal */}
      <SelectModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Select an Option"
        options={options}
        selectedValue={selectedValue}
        onSelect={setSelectedValue}
      />
    </>
  );
}
```

## 📋 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | boolean | ✅ | Modal görünürlüğü |
| `onClose` | function | ✅ | Modal kapanma callback'i |
| `title` | string | ✅ | Modal başlığı |
| `options` | array | ✅ | Seçenekler dizisi |
| `selectedValue` | string | ✅ | Seçili değer |
| `onSelect` | function | ✅ | Seçim callback'i (value) |

## 🎨 Options Format

```javascript
const options = [
  {
    label: 'Display Text',      // (required) Görünecek metin
    value: 'unique_value',       // (required) Unique değer
    description: 'Optional info' // (optional) Açıklama metni
  }
];
```

## 💡 Örnek Kullanımlar

### Örnek 1: Security Policy Seçimi
```javascript
const [securityPolicy, setSecurityPolicy] = useState('None');
const [showModal, setShowModal] = useState(false);

const securityPolicyOptions = [
  { 
    label: 'None', 
    value: 'None', 
    description: 'No security (development only)' 
  },
  { 
    label: 'Basic256Sha256', 
    value: 'Basic256Sha256', 
    description: '256-bit with SHA256 (recommended)' 
  },
];

return (
  <>
    <TouchableOpacity onPress={() => setShowModal(true)}>
      <Text>{securityPolicyOptions.find(o => o.value === securityPolicy)?.label}</Text>
    </TouchableOpacity>

    <SelectModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      title="Security Policy"
      options={securityPolicyOptions}
      selectedValue={securityPolicy}
      onSelect={setSecurityPolicy}
    />
  </>
);
```

### Örnek 2: Language Selection
```javascript
const [language, setLanguage] = useState('en');
const [showModal, setShowModal] = useState(false);

const languageOptions = [
  { label: 'English', value: 'en', description: 'English language' },
  { label: 'Türkçe', value: 'tr', description: 'Turkish language' },
  { label: 'Español', value: 'es', description: 'Spanish language' },
];

return (
  <>
    <TouchableOpacity onPress={() => setShowModal(true)}>
      <Text>{languageOptions.find(o => o.value === language)?.label}</Text>
    </TouchableOpacity>

    <SelectModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      title="Select Language"
      options={languageOptions}
      selectedValue={language}
      onSelect={setLanguage}
    />
  </>
);
```

### Örnek 3: Theme Selection (Açıklama Olmadan)
```javascript
const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
];

// description optional - sadece label ve value yeterli
```

### Örnek 4: Disabled State
```javascript
const [isEditable, setIsEditable] = useState(false);

<TouchableOpacity 
  onPress={() => isEditable && setShowModal(true)}
  disabled={!isEditable}
  style={{ opacity: isEditable ? 1 : 0.5 }}
>
  <Text>Select Option</Text>
</TouchableOpacity>
```

## 🎨 Görsel Özellikler

### Otomatik Dark/Light Mode
- ✅ `useTheme()` ile otomatik tema desteği
- ✅ Dark mode'da beyaz arka plan problemi yok
- ✅ Tüm renkler tema ile uyumlu

### Seçili Option Görünümü
- ✅ Açık mavi background (`colors.primary + '15'`)
- ✅ Mavi border (`colors.primary`)
- ✅ Checkmark icon
- ✅ Bold font

### Animation
- ✅ Fade-in/fade-out animation
- ✅ Overlay backdrop
- ✅ Smooth transitions

### Responsive
- ✅ Max width: 400px
- ✅ Max height: 80% ekran
- ✅ Scrollable options
- ✅ Mobile friendly

## 🔧 Customization

Component'i kendi ihtiyaçlarınıza göre özelleştirebilirsiniz:

```javascript
// components/SelectModal.js içinde stil değişiklikleri yapın
const styles = StyleSheet.create({
  modalContainer: {
    maxWidth: 400,  // Modal genişliği
    borderRadius: 16, // Köşe yuvarlama
  },
  option: {
    borderRadius: 12, // Option köşe yuvarlama
    borderWidth: 2,   // Border kalınlığı
  },
  // ... diğer stiller
});
```

## ✅ Best Practices

1. **Her zaman description kullanın:**
   - Kullanıcıya seçeneği açıklar
   - Daha profesyonel görünüm

2. **Kısa ve açık label'lar:**
   - "Basic256Sha256" ❌
   - "256-bit SHA256" ✅

3. **Mantıklı sıralama:**
   - En çok kullanılan seçenekler üstte
   - Alfabetik sıralama

4. **State management:**
   - Her modal için ayrı state
   - `useState` ile yönetim

5. **Accessibility:**
   - Anlamlı title'lar
   - Açıklayıcı description'lar

## 🚫 Kullanma Durumları

SelectModal şu durumlarda **kullanılmamalı:**

❌ Çok fazla seçenek (>20) - SearchableSelectModal kullanın
❌ Multi-select gerekli - MultiSelectModal oluşturun
❌ Date/Time picker - Native picker kullanın
❌ Number range - Slider kullanın

## 📚 İlgili Componentler

Gelecekte eklenebilecek varyasyonlar:

- `SearchableSelectModal` - Arama özellikli
- `MultiSelectModal` - Çoklu seçim
- `ConfirmModal` - Onay dialogu
- `InputModal` - Input ile modal

## 🐛 Troubleshooting

### Modal açılmıyor
```javascript
// State kontrolü
console.log('Modal visible:', showModal);

// OnPress kontrolü
<TouchableOpacity onPress={() => {
  console.log('Button pressed');
  setShowModal(true);
}}>
```

### Seçim çalışmıyor
```javascript
// OnSelect callback kontrolü
<SelectModal
  onSelect={(value) => {
    console.log('Selected:', value);
    setSelectedValue(value);
  }}
/>
```

### Tema renkleri yanlış
```javascript
// useTheme import kontrolü
import { useTheme } from '../contexts/ThemeContext';
const { colors } = useTheme();
```

---

**Bu component tüm projenizde standart select UI'ı olarak kullanılmalıdır!** 🎉