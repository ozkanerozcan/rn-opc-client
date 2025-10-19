import { Stack } from 'expo-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { PLCProvider } from '../contexts/PLCContext';
import { AuthProvider } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Platform } from 'react-native';
import 'react-native-gesture-handler';

// Web-specific viewport fix and PWA setup
if (Platform.OS === 'web') {
  // Add viewport meta tag for proper scaling
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.getElementsByTagName('head')[0].appendChild(meta);
  
  // Add theme color meta tag for PWA
  const themeColorMeta = document.createElement('meta');
  themeColorMeta.name = 'theme-color';
  themeColorMeta.content = '#ffffff';
  document.getElementsByTagName('head')[0].appendChild(themeColorMeta);
  
  // Add apple mobile web app capable
  const appleMeta = document.createElement('meta');
  appleMeta.name = 'apple-mobile-web-app-capable';
  appleMeta.content = 'yes';
  document.getElementsByTagName('head')[0].appendChild(appleMeta);
  
  // Add apple mobile web app status bar style
  const appleStatusBar = document.createElement('meta');
  appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
  appleStatusBar.content = 'default';
  document.getElementsByTagName('head')[0].appendChild(appleStatusBar);
  
  // Add manifest link
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.getElementsByTagName('head')[0].appendChild(manifestLink);
  
  // Add CSS to fix zoom issues
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      zoom: 1;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    #root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 768px) {
      html, body {
        font-size: 16px;
      }
    }
  `;
  document.getElementsByTagName('head')[0].appendChild(style);
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available, please refresh.');
              }
            });
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });

    // Handle updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

// Custom Toast Configuration
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10B981',
        borderLeftWidth: 8,
        minHeight: 80,
        paddingVertical: 12,
        width: '95%',
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingRight: 20,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 20,
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400',
        color: '#4B5563',
        lineHeight: 20,
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#EF4444',
        borderLeftWidth: 8,
        minHeight: 80,
        paddingVertical: 12,
        width: '95%',
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingRight: 20,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 20,
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400',
        color: '#4B5563',
        lineHeight: 20,
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3B82F6',
        borderLeftWidth: 8,
        minHeight: 80,
        paddingVertical: 12,
        width: '95%',
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingRight: 20,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 20,
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400',
        color: '#4B5563',
        lineHeight: 20,
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PLCProvider>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              <Toast config={toastConfig} />
            </AuthGuard>
          </PLCProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}