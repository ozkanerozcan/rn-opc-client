import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { showError, showSuccess } from '../../utils/toast';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, profile, signOut, uploadAvatar, loading } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    console.log('[Profile] Logout pressed');
    try {
      await signOut();
      console.log('[Profile] signOut resolved');
    } catch (e) {
      console.log('[Profile] signOut error', e);
    } finally {
      router.replace('/');
      console.log('[Profile] Navigated to /');
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showError('Permission Denied', 'Sorry, we need camera roll permissions to upload a profile picture.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const { data, error } = await uploadAvatar(result.assets[0].uri);
        setUploading(false);

        if (error) {
          showError('Upload Failed', error.message || 'Could not upload profile picture');
        } else {
          showSuccess('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error) {
      setUploading(false);
      showError('Error', error.message || 'Failed to pick image');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card + 'CC', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('editProfile')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={[styles.avatar, { backgroundColor: colors.border }]}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={64} color={colors.subtext} />
              )}
              <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.username, { color: colors.text }]}>
            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={[styles.email, { color: colors.subtext }]}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.formSection}>
          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: colors.input,
              borderColor: colors.border
            }]}
            onPress={() => router.push('/personal-details')}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Personal Details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: colors.input,
              borderColor: colors.border
            }]}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Change Password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="logoutButton"
            accessibilityRole="button"
            accessibilityLabel="Logout"
            style={[styles.logoutButton, {
              backgroundColor: colors.card,
              borderColor: '#EF4444'
            }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.logoutText, { color: '#EF4444' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  formSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});