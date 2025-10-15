import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { signUp, user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Clear previous error
    setError(null);

    // Full name validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }

    // Email validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Password validation
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password.length > 72) {
      setError('Password must not exceed 72 characters');
      return;
    }

    // Confirm password validation
    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Terms validation
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions to continue');
      return;
    }

    setIsSubmitting(true);
    const { data, error: signUpError } = await signUp(email.trim().toLowerCase(), password, fullName.trim());
    setIsSubmitting(false);

    if (signUpError) {
      let errorMessage = 'Could not create account';
      
      if (signUpError.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (signUpError.message.includes('Invalid email')) {
        errorMessage = 'Invalid email format. Please check your email address.';
      } else if (signUpError.message.includes('Password')) {
        errorMessage = signUpError.message;
      } else {
        errorMessage = signUpError.message || errorMessage;
      }
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
      });
      setError(errorMessage);
      return;
    }

    // Show success toast and redirect immediately
    Toast.show({
      type: 'success',
      text1: t('registerSuccessTitle'),
      text2: t('registerSuccessMessage'),
      position: 'top',
      visibilityTime: 6000,
    });
    
    // Redirect to login immediately
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{t('register')}</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('registerSubtitle')}</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.inputOpacity,
                  color: colors.text,
                  borderColor: 'transparent'
                }]}
                placeholder="Full Name"
                placeholderTextColor={colors.placeholder}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />

              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.inputOpacity,
                  color: colors.text,
                  borderColor: 'transparent'
                }]}
                placeholder={t('email')}
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.inputOpacity,
                  color: colors.text,
                  borderColor: 'transparent'
                }]}
                placeholder={t('password')}
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />

              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.inputOpacity,
                  color: colors.text,
                  borderColor: 'transparent'
                }]}
                placeholder={t('confirmPassword')}
                placeholderTextColor={colors.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />

              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, { borderColor: colors.border }]}>
                  {agreedToTerms && (
                    <View style={[styles.checkboxInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.checkboxText, { color: colors.text }]}>
                  <Text style={{ color: colors.primary }}>{t('privacyPolicy')}</Text>
                  {' '}{t('and')}{' '}
                  <Text style={{ color: colors.primary }}>{t('termsOfService')}</Text>
                  {"'nı " + t('agreeTerms')}
                </Text>
              </TouchableOpacity>

              {error && (
                <View style={[styles.errorBox, {
                  backgroundColor: '#FEE2E2',
                  borderColor: '#EF4444'
                }]}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={[styles.errorText, { color: '#DC2626' }]}>
                    {error}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, {
                  backgroundColor: colors.primary,
                  opacity: (agreedToTerms && !isSubmitting) ? 1 : 0.5
                }]}
                onPress={handleRegister}
                disabled={!agreedToTerms || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>{t('registerButton')}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.subtext }]}>
                {t('haveAccount')}{' '}
                <Text 
                  style={{ color: colors.primary, fontWeight: '500' }}
                  onPress={() => router.back()}
                >
                  {t('loginButton')}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    gap: 24,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});