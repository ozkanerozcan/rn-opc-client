import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { usePLC } from '../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import ConfirmModal from '../components/ConfirmModal';
import { showError, showSuccess } from '../utils/toast';

export default function PLCConnectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isConnected, connectionConfig, connect, disconnect, checkConnectionStatus } = usePLC();
  
  const [endpoint, setEndpoint] = useState(connectionConfig.endpoint);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState({
    attempt: 0,
    maxAttempts: 0,
    timeLeft: 0,
    message: '',
  });

  // Animation for loading dots
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isConnecting) {
      // Animate dots
      const animate = () => {
        Animated.sequence([
          Animated.timing(dot1Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot1Anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          if (isConnecting) {
            animate();
          }
        });
      };
      animate();
    }
  }, [isConnecting]);

  useEffect(() => {
    setEndpoint(connectionConfig.endpoint);
  }, [connectionConfig]);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const handleTestConnection = async () => {
    if (!endpoint.trim()) {
      showError('Error', 'Please enter OPC UA endpoint');
      return;
    }

    setIsConnecting(true);
    const maxRetry = parseInt(connectionConfig.maxRetry) || 3;
    
    const config = {
      ...connectionConfig,
      endpoint,
    };

    // Show initial attempt
    setConnectionProgress({
      attempt: 1,
      maxAttempts: maxRetry,
      timeLeft: 0,
      message: 'Connecting to PLC...',
    });

    try {
      const result = await connect(config);
      
      if (result.success) {
        showSuccess('Success', 'Connected to PLC');
      } else {
        // Parse error message for better user feedback
        let errorMessage = result.error || 'Failed to connect to PLC';
        
        if (errorMessage.includes('keep') && errorMessage.includes('alive')) {
          errorMessage = 'Connection timeout: Keep-alive failed. Try increasing the Keep Alive Interval in settings.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timeout: Cannot reach the OPC UA server. Check endpoint and network.';
        } else if (errorMessage.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused: OPC UA server is not running or endpoint is incorrect.';
        } else if (errorMessage.includes('EHOSTUNREACH')) {
          errorMessage = 'Host unreachable: Check network connection and firewall settings.';
        } else if (errorMessage.includes('session') && errorMessage.includes('timeout')) {
          errorMessage = 'Session timeout: Try increasing Connection Timeout in settings.';
        } else if (errorMessage.includes('parameter') || errorMessage.includes('compatible')) {
          errorMessage = 'Connection parameters incompatible: Adjust timeout and retry settings.';
        }
        
        showError('Connection Failed', errorMessage);
      }
    } catch (error) {
      console.error('Connection error:', error);
      
      // Parse error for better feedback
      let errorMessage = error.message || 'Failed to connect to PLC';
      
      if (errorMessage.includes('keep') && errorMessage.includes('alive')) {
        errorMessage = 'Keep-alive error: Connection unstable. Increase Keep Alive Interval in settings.';
      } else if (errorMessage.includes('Network')) {
        errorMessage = 'Network error: Check your internet connection and firewall.';
      }
      
      showError('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
      setConnectionProgress({ attempt: 0, maxAttempts: 0, timeLeft: 0, message: '' });
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectConfirm(true);
  };

  const confirmDisconnect = async () => {
    try {
      const result = await disconnect();
      setShowDisconnectConfirm(false);
      showSuccess('Disconnected', 'Successfully disconnected from PLC');
    } catch (error) {
      console.error('Disconnect error:', error);
      showError('Error', 'Failed to disconnect');
      setShowDisconnectConfirm(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card + 'CC', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PLC Connection</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={[styles.statusCard, {
          backgroundColor: isConnected ? '#10B98150' : colors.card,
          borderColor: isConnected ? '#10B981' : colors.border
        }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: isConnected ? '#10B981' : '#EF4444' 
            }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {isConnected && (
            <Text style={[styles.statusSubtext, { color: colors.subtext }]}>
              {endpoint}
            </Text>
          )}
        </View>

        {/* Connection Progress */}
        {isConnecting && connectionProgress.attempt > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.progressHeader}>
              <View style={[styles.progressIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="sync" size={24} color={colors.primary} />
              </View>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  {connectionProgress.message}
                </Text>
                <View style={styles.progressDetails}>
                  <View style={styles.progressItem}>
                    <Ionicons name="settings" size={16} color={colors.subtext} />
                    <Text style={[styles.progressText, { color: colors.subtext }]}>
                      Max retry attempts: {connectionProgress.maxAttempts}
                    </Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Ionicons name="time" size={16} color={colors.subtext} />
                    <Text style={[styles.progressText, { color: colors.subtext }]}>
                      Timeout: {((connectionConfig.connectionTimeout || 10000) / 1000).toFixed(0)}s per attempt
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {/* Progress Indicator */}
            <View style={styles.progressIndicator}>
              <Animated.View style={[styles.progressDot, { backgroundColor: colors.primary, opacity: dot1Anim }]} />
              <Animated.View style={[styles.progressDot, { backgroundColor: colors.primary, opacity: dot2Anim }]} />
              <Animated.View style={[styles.progressDot, { backgroundColor: colors.primary, opacity: dot3Anim }]} />
            </View>
          </View>
        )}

        <View style={styles.formSection}>
          {/* Endpoint */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>OPC UA Endpoint</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={endpoint}
              onChangeText={setEndpoint}
              placeholder="opc.tcp://192.168.1.100:4840"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              editable={!isConnected}
            />
            <Text style={[styles.hint, { color: colors.subtext }]}>
              Enter the OPC UA server endpoint URL
            </Text>
          </View>

          {/* Settings Link */}
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/opcua-settings')}
          >
            <View style={styles.settingsContent}>
              <View style={[styles.settingsIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="settings" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingsText}>
                <Text style={[styles.settingsTitle, { color: colors.text }]}>
                  Connection Settings
                </Text>
                <Text style={[styles.settingsDescription, { color: colors.subtext }]}>
                  Configure security, authentication, and advanced options
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.subtext} />
          </TouchableOpacity>

          {/* Current Settings Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Current Settings</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Security:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {connectionConfig.securityPolicy} / {connectionConfig.securityMode}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Auth:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {connectionConfig.authType === 'UserPassword' ? 'Username & Password' : 'Anonymous'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card + 'CC', borderTopColor: colors.border }]}>
        {isConnected ? (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={handleDisconnect}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Disconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, { 
              backgroundColor: colors.primary,
              opacity: isConnecting ? 0.6 : 1 
            }]}
            onPress={handleTestConnection}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Connecting...</Text>
              </>
            ) : (
              <>
                <Ionicons name="link-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        visible={showDisconnectConfirm}
        title="Disconnect from PLC"
        message="Are you sure you want to disconnect from the OPC UA server?\n\nAll active subscriptions and registered nodes will remain on the server."
        confirmText="Disconnect"
        cancelText="Cancel"
        confirmColor="#EF4444"
        onConfirm={confirmDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 24,
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingsDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressDetails: {
    gap: 4,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 13,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
});
