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
import { usePLC } from '../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { showSuccess, showError } from '../utils/toast';
import {
  registerNode,
  subscribeRegisteredNode,
  unsubscribeFromPLCVariable,
  getSubscriptionValue,
} from '../services/plcApi';
import {
  createSubscriptionRecord,
  updateRecordingStatus,
  saveSubscriptionValue,
} from '../services/subscriptionService';

export default function QuickRecordScreen() {
  const { colors } = useTheme();
  const { isConnected } = usePLC();
  const router = useRouter();

  // State
  const [nodeId, setNodeId] = useState('ns=3;s="DB_Data"."int"');
  const [recordingName, setRecordingName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentValue, setCurrentValue] = useState(null);
  const [valueCount, setValueCount] = useState(0);
  
  // Recording state
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [registeredNodeId, setRegisteredNodeId] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (subscriptionId) {
        unsubscribeFromPLCVariable(subscriptionId).catch(console.error);
      }
    };
  }, []);

  // Format value
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
    
    return value.toString();
  };

  // Start recording
  const startRecording = async () => {
    if (!isConnected) {
      showError('Error', 'Not connected to PLC');
      return;
    }

    if (!nodeId.trim()) {
      showError('Error', 'Please enter a node ID');
      return;
    }

    try {
      setLoading(true);

      // 1. Register node
      const registerResult = await registerNode(nodeId);
      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register node');
      }
      setRegisteredNodeId(registerResult.registeredId);

      // 2. Subscribe
      const subscribeResult = await subscribeRegisteredNode(registerResult.registeredId, 1000);
      if (!subscribeResult.success) {
        throw new Error(subscribeResult.error || 'Failed to subscribe');
      }
      setSubscriptionId(subscribeResult.subscriptionId);

      // 3. Create record in database
      const name = recordingName.trim() || `Recording ${new Date().toLocaleString()}`;
      const createRecordResult = await createSubscriptionRecord(
        subscribeResult.subscriptionId,
        registerResult.registeredId,
        nodeId,
        name
      );

      if (!createRecordResult.success) {
        throw new Error(createRecordResult.error || 'Failed to create record');
      }
      setRecordId(createRecordResult.data.id);

      // 4. Update status to recording
      const updateResult = await updateRecordingStatus(createRecordResult.data.id, true);
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to start recording');
      }

      // 5. Start polling
      const interval = setInterval(async () => {
        try {
          const valueResult = await getSubscriptionValue(subscribeResult.subscriptionId);
          
          if (valueResult.success && valueResult.value !== null) {
            const value = valueResult.value;
            setCurrentValue(value);

            // Save to database
            await saveSubscriptionValue(
              createRecordResult.data.id,
              subscribeResult.subscriptionId,
              registerResult.registeredId,
              nodeId,
              value
            );

            setValueCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1000);

      setPollingInterval(interval);
      setIsRecording(true);
      showSuccess('Recording Started', `Recording ${name}`);
    } catch (error) {
      console.error('Start recording error:', error);
      showError('Error', error.message);
      
      // Cleanup on error
      if (subscriptionId) {
        await unsubscribeFromPLCVariable(subscriptionId);
      }
    } finally {
      setLoading(false);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      setLoading(true);

      // 1. Stop polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }

      // 2. Update status
      if (recordId) {
        await updateRecordingStatus(recordId, false);
      }

      // 3. Unsubscribe
      if (subscriptionId) {
        await unsubscribeFromPLCVariable(subscriptionId);
      }

      setIsRecording(false);
      showSuccess('Recording Stopped', `Saved ${valueCount} values`);
      
      // Reset
      setSubscriptionId(null);
      setRegisteredNodeId(null);
      setRecordId(null);
      setCurrentValue(null);
      setValueCount(0);
    } catch (error) {
      console.error('Stop recording error:', error);
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Quick Record</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Connection Status */}
        {!isConnected && (
          <View style={[styles.warningCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <Text style={{ color: '#92400E', fontSize: 14, flex: 1 }}>
              Not connected to PLC. Connect first to start recording.
            </Text>
          </View>
        )}

        {/* Node ID Input */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Node ID</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.input, 
              color: colors.text, 
              borderColor: colors.border 
            }]}
            value={nodeId}
            onChangeText={setNodeId}
            placeholder='ns=3;s="DB_Data"."int"'
            placeholderTextColor={colors.placeholder}
            editable={!isRecording}
          />
          <Text style={[styles.hint, { color: colors.subtext }]}>
            Enter the OPC UA node ID you want to record
          </Text>
        </View>

        {/* Recording Name Input */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Recording Name (Optional)</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.input, 
              color: colors.text, 
              borderColor: colors.border 
            }]}
            value={recordingName}
            onChangeText={setRecordingName}
            placeholder="My Recording"
            placeholderTextColor={colors.placeholder}
            editable={!isRecording}
          />
          <Text style={[styles.hint, { color: colors.subtext }]}>
            Leave empty for auto-generated name
          </Text>
        </View>

        {/* Current Status */}
        {isRecording && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.statusRow}>
              <View style={[styles.recordingIndicator, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>Recording...</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Current Value</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {currentValue ? formatValue(currentValue.value, currentValue.dataType) : '--'}
                </Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Values Recorded</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {valueCount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Control Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isRecording ? '#EF4444' : colors.primary },
            !isConnected && { opacity: 0.5 }
          ]}
          onPress={toggleRecording}
          disabled={loading || !isConnected}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons 
                name={isRecording ? "stop-circle" : "radio-button-on"} 
                size={24} 
                color="#FFF" 
              />
              <Text style={styles.controlButtonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.input }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.subtext} />
          <Text style={[styles.infoText, { color: colors.subtext }]}>
            This screen allows you to quickly start recording values from an OPC UA node. 
            All steps (register, subscribe, record) happen automatically in one click.
          </Text>
        </View>

        {/* View Recordings Button */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => router.push('/recordings')}
        >
          <Ionicons name="list-outline" size={20} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            View My Recordings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 12,
    marginBottom: 16,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
