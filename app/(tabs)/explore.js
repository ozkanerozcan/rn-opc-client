import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const opcuaFeatures = [
    {
      id: 'connection',
      title: 'PLC Connection',
      description: 'Connect to OPC UA server',
      icon: 'link-outline',
      route: '/plc-connection',
      color: '#3B82F6',
    },
    {
      id: 'test',
      title: 'PLC Testing',
      description: 'Test read/write operations',
      icon: 'flask-outline',
      route: '/plc-test',
      color: '#10B981',
    },
    {
      id: 'register',
      title: 'Register Node',
      description: 'Register nodes for efficient access',
      icon: 'add-circle-outline',
      route: '/register-node',
      color: '#8B5CF6',
    },
    {
      id: 'subscribe',
      title: 'Subscribe Node',
      description: 'Monitor node value changes',
      icon: 'notifications-outline',
      route: '/subscribe-node',
      color: '#EC4899',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('explore')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputOpacity }]}>
          <Ionicons name="search" size={20} color={colors.subtext} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>OPC UA Features</Text>
          
          {opcuaFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.listItem, { backgroundColor: colors.card }]}
              onPress={() => router.push(feature.route)}
            >
              <View style={[styles.itemIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon} size={24} color={feature.color} />
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.subtext }]}>
                  {feature.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
            </TouchableOpacity>
          ))}
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
  },
});