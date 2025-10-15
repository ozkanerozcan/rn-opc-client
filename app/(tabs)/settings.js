import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import IOSSwitch from '../../components/IOSSwitch';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, locale, changeLanguage } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleLanguageChange = () => {
    const newLocale = locale === 'en' ? 'tr' : 'en';
    changeLanguage(newLocale);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* iOS-style Settings Title */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>

        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.profileItem}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={32} color={colors.subtext} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={[styles.profileDescription, { color: colors.subtext }]}>
                {t('accountPreferences')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#6B7280' }]}>
              <Ionicons name="moon" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('appearance')}</Text>
            <IOSSwitch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 52 }]} />

          {/* Language Selection */}
          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('language')}</Text>
            <View style={styles.settingValue}>
              <Text style={[styles.settingValueText, { color: colors.subtext }]}>
                {locale === 'en' ? t('english') : t('turkish')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Additional Settings Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/privacy')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 52 }]} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/help')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
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
  content: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
});