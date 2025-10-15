import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePLC } from '../../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isConnected, connectionConfig } = usePLC();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Home</Text>

        {/* PLC Connection Status Card */}
        <TouchableOpacity
          style={[styles.statusCard, {
            backgroundColor: colors.card,
            borderLeftColor: isConnected ? '#10B981' : '#EF4444',
          }]}
          onPress={() => router.push('/plc-connection')}
        >
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, {
                backgroundColor: isConnected ? '#10B981' : '#EF4444'
              }]} />
              <View>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  PLC Connection
                </Text>
                <Text style={[styles.statusSubtitle, { color: colors.subtext }]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
          {isConnected && (
            <Text style={[styles.statusEndpoint, { color: colors.subtext }]}>
              {connectionConfig.endpoint}
            </Text>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/browse-nodes')}
            disabled={!isConnected}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="folder-open-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Browse Nodes</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>
                Explore OPC UA address space
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/plc-test')}
            disabled={!isConnected}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Read/Write Test</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>
                Test reading and writing PLC variables
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/register-node')}
            disabled={!isConnected}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="git-network" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Register Node</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>
                Register and manage OPC UA nodes
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/subscribe-node')}
            disabled={!isConnected}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="notifications" size={24} color="#EC4899" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Subscribe Node</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>
                Real-time node monitoring and subscriptions
              </Text>
            </View>
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
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    paddingTop: 16,
    paddingBottom: 8,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusEndpoint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 24,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
});