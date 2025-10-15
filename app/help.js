import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card + 'CC', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
        </View>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardContent}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>How do I reset my password?</Text>
              <Text style={[styles.cardDescription, { color: colors.subtext }]}>
                Learn how to reset your account password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardContent}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Account Security</Text>
              <Text style={[styles.cardDescription, { color: colors.subtext }]}>
                Tips to keep your account secure
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardContent}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>App Settings</Text>
              <Text style={[styles.cardDescription, { color: colors.subtext }]}>
                Customize your app experience
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Support</Text>
        </View>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardContent}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.cardDescription, { color: colors.subtext }]}>
                support@example.com
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardContent}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Live Chat</Text>
              <Text style={[styles.cardDescription, { color: colors.subtext }]}>
                Chat with our support team
              </Text>
            </View>
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
});