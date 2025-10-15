import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { showError, showSuccess } from '../utils/toast';

export default function PersonalDetailsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { user, profile, updateProfile, uploadAvatar, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showError('Permission needed', 'Please allow access to your photos to change profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const { data, error } = await uploadAvatar(result.assets[0].uri);
        setIsUploading(false);

        if (error) {
          showError('Upload Failed', error.message || 'Could not upload profile picture');
        } else {
          showSuccess('Success', 'Profile picture updated successfully!');
          await refreshProfile();
        }
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Error picking image:', error);
      showError('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSaveChanges = async () => {
    if (!fullName.trim()) {
      showError('Error', 'Please enter your full name');
      return;
    }

    setIsSaving(true);
    const { data, error } = await updateProfile({ full_name: fullName.trim() });
    setIsSaving(false);

    if (error) {
      showError('Save Failed', error.message || 'Could not save changes');
      return;
    }

    showSuccess('Success', 'Your changes have been saved successfully');
    setTimeout(() => router.back(), 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card + 'CC', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={64} color={colors.subtext} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, {
                backgroundColor: colors.primary,
                opacity: isUploading ? 0.6 : 1
              }]}
              onPress={handlePickImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>
            {isUploading ? 'Uploading...' : 'Change Profile Photo'}
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>{t('fullName')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('fullName')}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Email</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.input,
                color: colors.subtext,
                borderColor: colors.border
              }]}
              value={email}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={[styles.helperText, { color: colors.subtext }]}>
              Email cannot be changed
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card + 'CC', borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, {
            backgroundColor: colors.primary,
            opacity: isSaving ? 0.6 : 1
          }]}
          onPress={handleSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 20,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});