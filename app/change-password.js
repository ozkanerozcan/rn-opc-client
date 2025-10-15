import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { showError, showSuccess } from '../utils/toast';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { updatePassword } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showError('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showError('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsChanging(true);
    const { data, error } = await updatePassword(newPassword);
    setIsChanging(false);

    if (error) {
      showError('Change Failed', error.message || 'Could not change password');
      return;
    }

    showSuccess('Success', 'Password changed successfully');
    setTimeout(() => router.back(), 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card + 'CC', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoBox, {
          backgroundColor: colors.primary + '15',
          borderColor: colors.primary
        }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            You are logged in. Enter your new password below.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showNewPassword}
                autoComplete="off"
                textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
                autoCorrect={false}
                importantForAutofill="noExcludeDescendants"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={colors.subtext} 
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: colors.subtext }]}>
              Password must be at least 6 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showConfirmPassword}
                autoComplete="off"
                textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
                autoCorrect={false}
                importantForAutofill="noExcludeDescendants"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={colors.subtext} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card + 'CC', borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.changeButton, {
            backgroundColor: colors.primary,
            opacity: isChanging ? 0.6 : 1
          }]}
          onPress={handleChangePassword}
          disabled={isChanging}
        >
          {isChanging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.changeButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  changeButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});