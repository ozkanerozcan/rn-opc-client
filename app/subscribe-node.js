import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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
  subscribeRegisteredNode,
  unsubscribeFromPLCVariable,
  getSubscriptionValue,
  getActiveSubscriptions,
} from '../services/plcApi';

export default function SubscribeNodeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isConnected, registeredNodes } = usePLC();
  const router = useRouter();

  // State
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(1000);
  const [showNotConnectedInfo, setShowNotConnectedInfo] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [subscriptionToRemove, setSubscriptionToRemove] = useState(null);

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

  // Check connection
  useEffect(() => {
    if (!isConnected) {
      setShowNotConnectedInfo(true);
    } else {
      setShowNotConnectedInfo(false);
      // Load active subscriptions from server when connected
      loadActiveSubscriptionsFromServer();
    }
  }, [isConnected]);

  // Load active subscriptions from server
  const loadActiveSubscriptionsFromServer = async () => {
    try {
      const result = await getActiveSubscriptions();
      if (result.success && result.subscriptions) {
        // Recreate subscriptions with polling
        const loadedSubs = result.subscriptions.map(sub => {
          // Start polling for this subscription
          const pollingInterval = setInterval(() => {
            getSubscriptionValue(sub.subscriptionId)
              .then(valueResult => {
                if (valueResult.success && valueResult.value) {
                  setSubscriptions(prev => prev.map(s => 
                    s.subscriptionId === sub.subscriptionId
                      ? { ...s, latestValue: valueResult.value }
                      : s
                  ));
                }
              })
              .catch(err => {
                console.error('Error getting subscription value:', err);
              });
          }, 1000); // Default interval, we don't have interval info from server
          
          return {
            subscriptionId: sub.subscriptionId,
            nodeId: sub.nodeId,
            originalNodeId: sub.originalNodeId,
            interval: 1000, // Default interval
            pollingInterval: pollingInterval,
            startedAt: new Date().toISOString(), // Current time as we don't have original start time
            latestValue: sub.latestValue || null
          };
        });
        
        setSubscriptions(loadedSubs);
      }
    } catch (error) {
      console.error('Error loading active subscriptions:', error);
    }
  };

  // Show node picker
  const handleShowNodePicker = () => {
    if (registeredNodes.length === 0) {
      showError('No Nodes', 'Please register nodes first');
      return;
    }
    setShowNodePicker(true);
  };

  // Show interval picker after node selection
  const handleNodeSelected = (value) => {
    const node = registeredNodes.find((n) => n.registeredId === value);
    
    // Check if already subscribed
    const existingSub = subscriptions.find(sub => sub.nodeId === value);
    if (existingSub) {
      showError('Already Subscribed', 'This node is already being monitored');
      setShowNodePicker(false);
      return;
    }
    
    setSelectedNode(node);
    setShowNodePicker(false);
    setShowIntervalPicker(true);
  };

  // Subscribe to selected node with chosen interval
  const handleSubscribe = async (interval) => {
    if (!selectedNode) {
      showError('Error', 'Please select a node first');
      return;
    }

    try {
      setLoading(true);
      const result = await subscribeRegisteredNode(selectedNode.registeredId, interval);

      if (result.success) {
        showSuccess('Subscribed', `Monitoring started (${interval}ms interval)`);
        
        // Create subscription object first
        const newSubscription = {
          subscriptionId: result.subscriptionId,
          nodeId: selectedNode.registeredId,
          originalNodeId: selectedNode.nodeId,
          interval: interval,
          pollingInterval: null,
          startedAt: new Date().toISOString(),
          latestValue: null
        };
        
        // Start polling for updates
        const pollingInterval = setInterval(() => {
          getSubscriptionValue(result.subscriptionId)
            .then(valueResult => {
              if (valueResult.success && valueResult.value) {
                setSubscriptions(prev => prev.map(sub => 
                  sub.subscriptionId === result.subscriptionId
                    ? { ...sub, latestValue: valueResult.value }
                    : sub
                ));
              }
            })
            .catch(err => {
              console.error('Error getting subscription value:', err);
            });
        }, interval);
        
        newSubscription.pollingInterval = pollingInterval;
        setSubscriptions(prev => [...prev, newSubscription]);
        setSelectedNode(null);
      } else {
        showError('Subscribe Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      showError('Error', error.message || 'Failed to subscribe');
    } finally {
      setLoading(false);
      setShowIntervalPicker(false);
    }
  };

  // Unsubscribe from a specific subscription
  const handleUnsubscribe = (subscription) => {
    if (!subscription) return;
    setSubscriptionToRemove(subscription);
    setShowUnsubscribeConfirm(true);
  };

  const confirmUnsubscribe = async () => {
    if (!subscriptionToRemove) return;

    try {
      setLoading(true);
      
      if (subscriptionToRemove.pollingInterval) {
        clearInterval(subscriptionToRemove.pollingInterval);
      }

      const result = await unsubscribeFromPLCVariable(subscriptionToRemove.subscriptionId);

      if (result.success) {
        setSubscriptions(prev => prev.filter(sub => sub.subscriptionId !== subscriptionToRemove.subscriptionId));
        showSuccess('Unsubscribed', 'Monitoring stopped');
      } else {
        showError('Unsubscribe Failed', result.error || 'Failed to stop monitoring');
      }
    } catch (error) {
      showError('Error', error.message || 'Failed to unsubscribe');
      console.error('Unsubscribe error:', error);
    } finally {
      setLoading(false);
      setShowUnsubscribeConfirm(false);
      setSubscriptionToRemove(null);
    }
  };

  // Clean up subscriptions for unregistered nodes
  useEffect(() => {
    if (!isConnected || subscriptions.length === 0) return;
    
    // Check if any subscription's node is no longer registered
    const validSubscriptions = subscriptions.filter(sub => {
      const nodeStillRegistered = registeredNodes.some(node => node.registeredId === sub.nodeId);
      
      if (!nodeStillRegistered) {
        // Clear polling interval for invalid subscription
        if (sub.pollingInterval) {
          clearInterval(sub.pollingInterval);
        }
        console.log(`Removing subscription for unregistered node: ${sub.nodeId}`);
        
        // Also notify server to unsubscribe (cleanup)
        unsubscribeFromPLCVariable(sub.subscriptionId).catch(console.error);
        
        return false;
      }
      return true;
    });

    if (validSubscriptions.length !== subscriptions.length) {
      setSubscriptions(validSubscriptions);
      
      if (subscriptions.length - validSubscriptions.length > 0) {
        showInfo(
          'Subscriptions Removed', 
          `${subscriptions.length - validSubscriptions.length} subscription(s) removed due to unregistered nodes`
        );
      }
    }
  }, [registeredNodes, isConnected]);

  // Clean up all subscriptions on unmount
  useEffect(() => {
    return () => {
      if (subscriptions.length > 0) {
        subscriptions.forEach(sub => {
          if (sub.pollingInterval) {
            clearInterval(sub.pollingInterval);
          }
          unsubscribeFromPLCVariable(sub.subscriptionId).catch(console.error);
        });
      }
    };
  }, []);

  const nodeOptions = registeredNodes.map((node) => ({
    label: `${node.nodeId} (ID: ${node.registeredId})`,
    value: node.registeredId,
  }));

  const intervalOptions = [
    { label: '100ms (Fast)', value: 100 },
    { label: '250ms', value: 250 },
    { label: '500ms', value: 500 },
    { label: '1 second (Default)', value: 1000 },
    { label: '2 seconds', value: 2000 },
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscribe Node</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Subscribe Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscribe to Node</Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            Select a registered node to start real-time monitoring
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              (!isConnected || loading || registeredNodes.length === 0) && styles.buttonDisabled,
            ]}
            onPress={handleShowNodePicker}
            disabled={!isConnected || loading || registeredNodes.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {registeredNodes.length === 0 ? 'No Registered Nodes' : 'Subscribe to Node'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {registeredNodes.length === 0 && (
            <TouchableOpacity
              style={[styles.linkButton]}
              onPress={() => router.push('/register-node')}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Go to Register Node →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Subscriptions Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Subscriptions
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
            {subscriptions.length} active subscription(s)
          </Text>

          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={48} color={colors.subtext} />
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                No active subscriptions
              </Text>
            </View>
          ) : (
            <View style={styles.subscriptionList}>
              {subscriptions.map((sub) => (
                <View
                  key={sub.subscriptionId}
                  style={[styles.subscriptionCard, { borderColor: colors.border }]}
                >
                  <View style={styles.subscriptionHeader}>
                    <View style={styles.subscriptionInfo}>
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={[styles.liveText, { color: '#10B981' }]}>LIVE</Text>
                      </View>
                      <Text style={[styles.subscriptionNodeId, { color: colors.text }]}>
                        {sub.originalNodeId}
                      </Text>
                      <Text style={[styles.subscriptionDetail, { color: colors.subtext }]}>
                        ID: {sub.nodeId}
                      </Text>
                      <Text style={[styles.subscriptionDetail, { color: colors.subtext }]}>
                        Interval: {sub.interval}ms
                      </Text>
                      <Text style={[styles.subscriptionDetail, { color: colors.subtext }]}>
                        Started: {new Date(sub.startedAt).toLocaleTimeString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.unsubscribeButton, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleUnsubscribe(sub)}
                      disabled={loading}
                    >
                      <Ionicons name="stop-circle-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {sub.latestValue && (
                    <View style={[styles.subscriptionValue, { backgroundColor: colors.input }]}>
                      <Text style={[styles.valueLabel, { color: colors.subtext }]}>
                        Latest Value:
                      </Text>
                      <Text style={[styles.subscriptionValueText, { color: colors.text }]}>
                        {formatValue(sub.latestValue.value, sub.latestValue.dataType)}
                      </Text>
                      <Text style={[styles.valueLabel, { color: colors.subtext }]}>
                        Type: {sub.latestValue.dataType}
                      </Text>
                      <Text style={[styles.valueLabel, { color: colors.subtext }]}>
                        Updated: {new Date(sub.latestValue.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Select Node Modal */}
      <SelectModal
        visible={showNodePicker}
        title="Select Node to Subscribe"
        options={nodeOptions}
        selectedValue={null}
        onSelect={handleNodeSelected}
        onClose={() => setShowNodePicker(false)}
      />

      {/* Select Interval Modal */}
      <SelectModal
        visible={showIntervalPicker}
        title="Select Subscription Interval"
        options={intervalOptions}
        selectedValue={selectedInterval}
        onSelect={(value) => {
          setSelectedInterval(value);
          handleSubscribe(value);
        }}
        onClose={() => {
          setShowIntervalPicker(false);
          setSelectedNode(null);
        }}
      />

      {/* Not Connected Info Modal */}
      <ConfirmModal
        visible={showNotConnectedInfo}
        title="Not Connected"
        message="Please connect to OPC UA server first to subscribe to nodes."
        confirmText="Connect"
        cancelText="Close"
        confirmColor="#3B82F6"
        onConfirm={() => {
          setShowNotConnectedInfo(false);
          router.push('/plc-connection');
        }}
        onCancel={() => setShowNotConnectedInfo(false)}
      />

      {/* Unsubscribe Confirmation Modal */}
      <ConfirmModal
        visible={showUnsubscribeConfirm}
        title="Stop Monitoring"
        message={`Are you sure you want to stop monitoring this node?\n\n${subscriptionToRemove?.originalNodeId}\n\nYou can subscribe again anytime.`}
        confirmText="Stop Monitoring"
        cancelText="Cancel"
        confirmColor="#EF4444"
        onConfirm={confirmUnsubscribe}
        onCancel={() => {
          setShowUnsubscribeConfirm(false);
          setSubscriptionToRemove(null);
        }}
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
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  subscriptionList: {
    gap: 12,
  },
  subscriptionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subscriptionInfo: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subscriptionNodeId: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subscriptionDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  unsubscribeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionValue: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  valueLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  subscriptionValueText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 4,
  },
});
