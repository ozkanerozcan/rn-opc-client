import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePLC } from '../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectModal from '../components/SelectModal';
import ConfirmModal from '../components/ConfirmModal';
import { showSuccess, showError, showInfo } from '../utils/toast';
import {
  registerNode,
  unregisterNode,
  readRegisteredNode,
  writeRegisteredNode,
} from '../services/plcApi';

export default function RegisterNodeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isConnected, registeredNodes, addRegisteredNode, removeRegisteredNode, loadRegisteredNodesFromServer } = usePLC();
  const router = useRouter();

  // State
  const [nodeId, setNodeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [readValue, setReadValue] = useState(null);
  const [writeValue, setWriteValue] = useState('');
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [nodeToUnregister, setNodeToUnregister] = useState(null);
  const [showNotConnectedInfo, setShowNotConnectedInfo] = useState(false);

  // Format value based on data type
  const formatValue = (value, dataType) => {
    if (value === null || value === undefined) return 'null';
    
    const type = (dataType || '').toLowerCase();
    
    if (type.includes('bool')) {
      return value ? 'true' : 'false';
    }
    
    if (type.includes('int') || type.includes('byte') ||
        type.includes('word') || type.includes('dword')) {
      return Math.round(value).toString();
    }
    
    if (type.includes('float') || type.includes('double') ||
        type.includes('real') || type.includes('lreal')) {
      return Number(value).toFixed(2);
    }
    
    if (type.includes('string') || type.includes('char')) {
      return value.toString();
    }
    
    return value.toString();
  };

  // Check connection and load registered nodes
  useEffect(() => {
    if (!isConnected) {
      setShowNotConnectedInfo(true);
    } else {
      setShowNotConnectedInfo(false);
      // Load registered nodes from server
      loadRegisteredNodesFromServer();
    }
  }, [isConnected]);

  // Register node
  const handleRegisterNode = async () => {
    if (!nodeId.trim()) {
      showError('Error', 'Please enter a node ID');
      return;
    }

    if (!isConnected) {
      showError('Error', 'Not connected to OPC UA server');
      return;
    }

    try {
      setLoading(true);
      const result = await registerNode(nodeId.trim());

      if (result.success) {
        const newNode = {
          nodeId: result.nodeId,
          registeredId: result.registeredId,
          timestamp: new Date().toISOString(),
        };
        addRegisteredNode(newNode);
        setNodeId('');
        showSuccess('Success', `Node registered: ${result.registeredId}`);
      } else {
        showError('Registration Failed', result.error);
      }
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Unregister node
  const handleUnregisterNode = (node) => {
    console.log('Unregister button pressed for node:', node);
    setNodeToUnregister(node);
    setShowUnregisterConfirm(true);
  };

  const confirmUnregister = async () => {
    if (!nodeToUnregister) return;
    
    try {
      setLoading(true);
      const result = await unregisterNode(nodeToUnregister.registeredId);
      console.log('Unregister result:', result);

      if (result.success) {
        removeRegisteredNode(nodeToUnregister.registeredId);
        if (selectedNode?.registeredId === nodeToUnregister.registeredId) {
          setSelectedNode(null);
          setReadValue(null);
        }
        
        const message = result.terminatedSubscriptions > 0
          ? `Node unregistered. ${result.terminatedSubscriptions} subscription(s) terminated.`
          : 'Node unregistered';
        
        showSuccess('Success', message);
      } else {
        showError('Unregister Failed', result.error);
      }
    } catch (error) {
      console.error('Unregister error:', error);
      showError('Error', error.message);
    } finally {
      setLoading(false);
      setShowUnregisterConfirm(false);
      setNodeToUnregister(null);
    }
  };

  // Read from selected node
  const handleReadNode = async () => {
    if (!selectedNode) {
      showError('Error', 'Please select a node first');
      return;
    }

    try {
      setLoading(true);
      const result = await readRegisteredNode(selectedNode.registeredId);

      if (result.success) {
        setReadValue({
          value: result.value,
          dataType: result.dataType,
          timestamp: result.timestamp,
        });
        showSuccess('Read Success', `Value: ${result.value}`);
      } else {
        showError('Read Failed', result.error);
      }
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Write to selected node
  const handleWriteNode = async () => {
    if (!selectedNode) {
      showError('Error', 'Please select a node first');
      return;
    }

    if (!writeValue.trim()) {
      showError('Error', 'Please enter a value to write');
      return;
    }

    try {
      setLoading(true);
      
      const readResult = await readRegisteredNode(selectedNode.registeredId);
      
      if (!readResult.success) {
        showError('Error', 'Could not read variable to determine data type: ' + readResult.error);
        setLoading(false);
        return;
      }

      const detectedDataType = readResult.dataType;
      let convertedValue = writeValue.trim();
      const dataTypeLower = (detectedDataType || '').toLowerCase();
      
      if (dataTypeLower.includes('bool')) {
        convertedValue = convertedValue.toLowerCase() === 'true' ||
                        convertedValue === '1' ||
                        convertedValue.toLowerCase() === 'on';
      } else if (dataTypeLower.includes('int') || dataTypeLower.includes('byte') ||
                 dataTypeLower.includes('word') || dataTypeLower.includes('dword')) {
        convertedValue = parseInt(convertedValue);
        if (isNaN(convertedValue)) {
          showError('Error', `Invalid integer value for ${detectedDataType}`);
          setLoading(false);
          return;
        }
      } else if (dataTypeLower.includes('float') || dataTypeLower.includes('double') ||
                 dataTypeLower.includes('real') || dataTypeLower.includes('lreal')) {
        convertedValue = parseFloat(convertedValue);
        if (isNaN(convertedValue)) {
          showError('Error', `Invalid numeric value for ${detectedDataType}`);
          setLoading(false);
          return;
        }
      }

      const result = await writeRegisteredNode(
        selectedNode.registeredId,
        convertedValue,
        detectedDataType
      );

      if (result.success) {
        showSuccess('Write Success', `Value written as ${detectedDataType}`);
        setWriteValue('');
        setTimeout(() => handleReadNode(), 500);
      } else {
        showError('Write Failed', result.error);
      }
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const nodeOptions = registeredNodes.map((node) => ({
    label: `${node.nodeId} (ID: ${node.registeredId})`,
    value: node.registeredId,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Register Node</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Register Node Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Register Node</Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            Enter a node ID to register it for efficient access
          </Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="ns=2;s=MyVariable"
            placeholderTextColor={colors.placeholder}
            value={nodeId}
            onChangeText={setNodeId}
            editable={!loading}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              (!isConnected || loading) && styles.buttonDisabled,
            ]}
            onPress={handleRegisterNode}
            disabled={!isConnected || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Register Node</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Registered Nodes List */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Registered Nodes</Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            {registeredNodes.length} node(s) registered
          </Text>

          {registeredNodes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={colors.subtext} />
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                No nodes registered yet
              </Text>
            </View>
          ) : (
            <View style={styles.nodeList}>
              {registeredNodes.map((node) => (
                <View
                  key={node.registeredId}
                  style={[styles.nodeItem, { borderColor: colors.border }]}
                >
                  <View style={styles.nodeInfo}>
                    <Text style={[styles.nodeId, { color: colors.text }]}>{node.nodeId}</Text>
                    <Text style={[styles.registeredId, { color: colors.subtext }]}>
                      ID: {node.registeredId}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: loading ? '#999' : '#EF4444' }]}
                    onPress={() => {
                      console.log('Delete button tapped!', node);
                      handleUnregisterNode(node);
                    }}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Node Operations Section */}
        {registeredNodes.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Node Operations</Text>

            {/* Select Node */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
              onPress={() => setShowNodePicker(true)}
            >
              <Text style={[styles.selectButtonText, { color: colors.text }]}>
                {selectedNode
                  ? `${selectedNode.nodeId} (ID: ${selectedNode.registeredId})`
                  : 'Select a node...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.subtext} />
            </TouchableOpacity>

            {selectedNode && (
              <>
                {/* Read Section */}
                <View style={styles.operationSection}>
                  <Text style={[styles.operationTitle, { color: colors.text }]}>
                    Read Value
                  </Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#3B82F6' }]}
                    onPress={handleReadNode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Read</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {readValue && (
                    <View
                      style={[styles.valueDisplay, { backgroundColor: colors.input }]}
                    >
                      <Text style={[styles.valueLabel, { color: colors.subtext }]}>Value:</Text>
                      <Text style={[styles.valueText, { color: colors.text }]}>
                        {formatValue(readValue.value, readValue.dataType)}
                      </Text>
                      <Text style={[styles.valueLabel, { color: colors.subtext }]}>
                        Type: {readValue.dataType}
                      </Text>
                      <Text style={[styles.valueLabel, { color: colors.subtext }]}>
                        Time: {new Date(readValue.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Write Section */}
                <View style={styles.operationSection}>
                  <Text style={[styles.operationTitle, { color: colors.text }]}>Write Value</Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Enter value to write"
                    placeholderTextColor={colors.placeholder}
                    value={writeValue}
                    onChangeText={setWriteValue}
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#10B981' }]}
                    onPress={handleWriteNode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Write</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Select Node Modal */}
      <SelectModal
        visible={showNodePicker}
        title="Select Node"
        options={nodeOptions}
        selectedValue={selectedNode?.registeredId}
        onSelect={(value) => {
          const node = registeredNodes.find((n) => n.registeredId === value);
          setSelectedNode(node);
          setShowNodePicker(false);
          setReadValue(null);
        }}
        onClose={() => setShowNodePicker(false)}
      />

      {/* Unregister Confirmation Modal */}
      <ConfirmModal
        visible={showUnregisterConfirm}
        title="Unregister Node"
        message={`Are you sure you want to unregister this node?\n\n${nodeToUnregister?.nodeId}\n\nNote: All active subscriptions for this node will be terminated.`}
        confirmText="Unregister"
        cancelText="Cancel"
        confirmColor="#EF4444"
        onConfirm={confirmUnregister}
        onCancel={() => {
          setShowUnregisterConfirm(false);
          setNodeToUnregister(null);
        }}
      />

      {/* Not Connected Info Modal */}
      <ConfirmModal
        visible={showNotConnectedInfo}
        title="Not Connected"
        message="Please connect to OPC UA server first to manage nodes."
        confirmText="Connect"
        cancelText="Close"
        confirmColor="#3B82F6"
        onConfirm={() => {
          setShowNotConnectedInfo(false);
          router.push('/plc-connection');
        }}
        onCancel={() => setShowNotConnectedInfo(false)}
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
  connectionStatus: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  nodeList: {
    gap: 8,
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeId: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  registeredId: {
    fontSize: 14,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
  },
  operationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  valueDisplay: {
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  valueLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 8,
  },
});
