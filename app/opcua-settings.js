import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { usePLC } from '../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectModal from '../components/SelectModal';
import { showSuccess, showError } from '../utils/toast';

export default function OPCUASettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { connectionConfig, saveConnectionConfig } = usePLC();

  // Connection settings
  const [securityPolicy, setSecurityPolicy] = useState(connectionConfig.securityPolicy);
  const [securityMode, setSecurityMode] = useState(connectionConfig.securityMode);
  const [authType, setAuthType] = useState(connectionConfig.authType);
  const [username, setUsername] = useState(connectionConfig.username);
  const [password, setPassword] = useState(connectionConfig.password);
  const [showPassword, setShowPassword] = useState(false);

  // Advanced settings
  const [connectionTimeout, setConnectionTimeout] = useState(
    connectionConfig.connectionTimeout?.toString() || '10000'
  );
  const [maxRetry, setMaxRetry] = useState(
    connectionConfig.maxRetry?.toString() || '3'
  );
  const [requestTimeout, setRequestTimeout] = useState(
    connectionConfig.requestTimeout?.toString() || '30000'
  );
  const [keepAliveInterval, setKeepAliveInterval] = useState(
    connectionConfig.keepAliveInterval?.toString() || '5000'
  );

  // Modal states
  const [showSecurityPolicyModal, setShowSecurityPolicyModal] = useState(false);
  const [showSecurityModeModal, setShowSecurityModeModal] = useState(false);
  const [showAuthTypeModal, setShowAuthTypeModal] = useState(false);

  // Options for modals
  const securityPolicyOptions = [
    { label: 'None', value: 'None', description: 'No security (recommended for development)' },
    { label: 'Basic128Rsa15', value: 'Basic128Rsa15', description: 'Basic 128-bit encryption' },
    { label: 'Basic256', value: 'Basic256', description: '256-bit encryption' },
    { label: 'Basic256Sha256', value: 'Basic256Sha256', description: '256-bit with SHA256 (recommended for production)' },
  ];

  const securityModeOptions = [
    { label: 'None', value: 'None', description: 'No security' },
    { label: 'Sign', value: 'Sign', description: 'Message signing only' },
    { label: 'Sign & Encrypt', value: 'SignAndEncrypt', description: 'Sign and encrypt messages (recommended)' },
  ];

  const authTypeOptions = [
    { label: 'Anonymous', value: 'Anonymous', description: 'No authentication required' },
    { label: 'Username & Password', value: 'UserPassword', description: 'Authenticate with credentials' },
  ];

  useEffect(() => {
    // Update form when context config changes
    setSecurityPolicy(connectionConfig.securityPolicy);
    setSecurityMode(connectionConfig.securityMode);
    setAuthType(connectionConfig.authType);
    setUsername(connectionConfig.username);
    setPassword(connectionConfig.password);
    setConnectionTimeout(connectionConfig.connectionTimeout?.toString() || '10000');
    setMaxRetry(connectionConfig.maxRetry?.toString() || '3');
    setRequestTimeout(connectionConfig.requestTimeout?.toString() || '30000');
    setKeepAliveInterval(connectionConfig.keepAliveInterval?.toString() || '5000');
  }, [connectionConfig]);

  const handleSaveSettings = () => {
    try {
      const config = {
        ...connectionConfig,
        securityPolicy,
        securityMode,
        authType,
        username: authType === 'UserPassword' ? username : '',
        password: authType === 'UserPassword' ? password : '',
        connectionTimeout: parseInt(connectionTimeout) || 10000,
        maxRetry: parseInt(maxRetry) || 3,
        requestTimeout: parseInt(requestTimeout) || 30000,
        keepAliveInterval: parseInt(keepAliveInterval) || 5000,
      };

      saveConnectionConfig(config);
      showSuccess('Settings Saved', 'OPC UA connection settings have been saved');
      router.back();
    } catch (error) {
      showError('Error', 'Failed to save settings');
      console.error('Save settings error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>OPC UA Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Settings</Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            Configure security policy and mode
          </Text>

          {/* Security Policy */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Security Policy</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowSecurityPolicyModal(true)}
            >
              <Text style={[styles.selectButtonText, { color: colors.text }]}>{securityPolicy}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Security Mode */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Security Mode</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowSecurityModeModal(true)}
            >
              <Text style={[styles.selectButtonText, { color: colors.text }]}>{securityMode}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Authentication */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Authentication</Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            Configure authentication method
          </Text>

          {/* Auth Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Authentication Type</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowAuthTypeModal(true)}
            >
              <Text style={[styles.selectButtonText, { color: colors.text }]}>
                {authType === 'UserPassword' ? 'Username & Password' : 'Anonymous'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Username & Password (only if UserPassword is selected) */}
          {authType === 'UserPassword' && (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter username"
                  placeholderTextColor={colors.placeholder}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter password"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.subtext}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Advanced Connection Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Advanced Settings</Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            Fine-tune connection parameters
          </Text>

          {/* Connection Timeout */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Connection Timeout (ms)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="10000"
              placeholderTextColor={colors.placeholder}
              value={connectionTimeout}
              onChangeText={setConnectionTimeout}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: colors.subtext }]}>
              Time to wait for connection establishment (default: 10000ms)
            </Text>
          </View>

          {/* Max Retry */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Max Retry Attempts</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="3"
              placeholderTextColor={colors.placeholder}
              value={maxRetry}
              onChangeText={setMaxRetry}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: colors.subtext }]}>
              Number of connection retry attempts (default: 3)
            </Text>
          </View>

          {/* Request Timeout */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Request Timeout (ms)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="30000"
              placeholderTextColor={colors.placeholder}
              value={requestTimeout}
              onChangeText={setRequestTimeout}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: colors.subtext }]}>
              Timeout for individual requests (default: 30000ms)
            </Text>
          </View>

          {/* Keep Alive Interval */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Keep Alive Interval (ms)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="5000"
              placeholderTextColor={colors.placeholder}
              value={keepAliveInterval}
              onChangeText={setKeepAliveInterval}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: colors.subtext }]}>
              Interval for keep-alive messages (default: 5000ms)
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            These settings will be applied on next connection. Disconnect and reconnect to apply changes.
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveSettings}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <SelectModal
        visible={showSecurityPolicyModal}
        onClose={() => setShowSecurityPolicyModal(false)}
        title="Security Policy"
        options={securityPolicyOptions}
        selectedValue={securityPolicy}
        onSelect={setSecurityPolicy}
      />

      <SelectModal
        visible={showSecurityModeModal}
        onClose={() => setShowSecurityModeModal(false)}
        title="Security Mode"
        options={securityModeOptions}
        selectedValue={securityMode}
        onSelect={setSecurityMode}
      />

      <SelectModal
        visible={showAuthTypeModal}
        onClose={() => setShowAuthTypeModal(false)}
        title="Authentication"
        options={authTypeOptions}
        selectedValue={authType}
        onSelect={setAuthType}
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
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  selectButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
