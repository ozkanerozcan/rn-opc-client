import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const translations = {
  en: {
    // Login Screen
    login: 'Login',
    loginSubtitle: 'Continue to access your account.',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    loginButton: 'Login',
    noAccount: "Don't have an account?",
    signUp: 'Sign Up',
    
    // Register Screen
    register: 'Register',
    registerSubtitle: 'Create a new account.',
    confirmPassword: 'Confirm Password',
    agreeTerms: 'I agree to the',
    privacyPolicy: 'Privacy Policy',
    and: 'and',
    termsOfService: 'Terms of Service',
    registerButton: 'Register',
    haveAccount: 'Already have an account?',
    
    // Register Success Messages
    registerSuccessTitle: 'Registration Successful! 📧',
    registerSuccessMessage: 'Please check your email and verify your account before logging in.',
    registerSuccessButton: 'OK, Go to Login',
    
    // Profile Screen
    editProfile: 'Edit Profile',
    fullName: 'Full Name',
    changePassword: 'Change Password',
    saveChanges: 'Save Changes',
    
    // Settings Screen
    settings: 'Settings',
    accountPreferences: 'Account and App Preferences',
    appearance: 'Appearance',
    language: 'Language',
    turkish: 'Turkish',
    english: 'English',
    
    // Navigation
    home: 'Home',
    explore: 'Explore',
    profile: 'Profile',
  },
  tr: {
    // Login Screen
    login: 'Giriş Yap',
    loginSubtitle: 'Hesabınıza erişmek için devam edin.',
    email: 'E-posta',
    password: 'Şifre',
    forgotPassword: 'Şifreyi mi unuttun?',
    loginButton: 'Giriş Yap',
    noAccount: 'Hesabın yok mu?',
    signUp: 'Kayıt Ol',
    
    // Register Screen
    register: 'Kayıt Ol',
    registerSubtitle: 'Yeni bir hesap oluşturun.',
    confirmPassword: 'Şifre Tekrarı',
    agreeTerms: 'kabul ediyorum.',
    privacyPolicy: 'Gizlilik Politikası',
    and: 've',
    termsOfService: 'Kullanım Koşulları',
    registerButton: 'Kayıt Ol',
    haveAccount: 'Zaten bir hesabın var mı?',
    
    // Register Success Messages
    registerSuccessTitle: 'Kayıt Başarılı! 📧',
    registerSuccessMessage: 'Lütfen e-postanızı kontrol ederek hesabınızı onaylayın.',
    registerSuccessButton: 'Tamam, Giriş Sayfasına Git',
    
    // Profile Screen
    editProfile: 'Profili Düzenle',
    fullName: 'Ad Soyad',
    changePassword: 'Şifreyi Değiştir',
    saveChanges: 'Değişiklikleri Kaydet',
    
    // Settings Screen
    settings: 'Ayarlar',
    accountPreferences: 'Hesap ve Uygulama Tercihleri',
    appearance: 'Görünüm',
    language: 'Dil',
    turkish: 'Türkçe',
    english: 'İngilizce',
    
    // Navigation
    home: 'Ana Sayfa',
    explore: 'Keşfet',
    profile: 'Profil',
  },
};

const i18n = new I18n(translations);

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLocale(savedLanguage);
        i18n.locale = savedLanguage;
      } else {
        // Safely handle Localization.locale with fallback
        const deviceLocale = Localization.locale || 'en-US';
        const deviceLanguage = deviceLocale.split('-')[0];
        const supportedLanguage = deviceLanguage === 'tr' ? 'tr' : 'en';
        setLocale(supportedLanguage);
        i18n.locale = supportedLanguage;
      }
    } catch (error) {
      console.error('Error loading language:', error);
      // Set default language on error
      setLocale('en');
      i18n.locale = 'en';
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLocale) => {
    try {
      setLocale(newLocale);
      i18n.locale = newLocale;
      await AsyncStorage.setItem('language', newLocale);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key) => i18n.t(key);

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};