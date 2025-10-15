import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePLC } from '../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { showSuccess, showError } from '../utils/toast';
import { browsePLCNodes, readPLCVariable, registerNode, searchPLCNodes } from '../services/plcApi';
import InfoModal from '../components/InfoModal';

export default function BrowseNodesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isConnected, addRegisteredNode, registeredNodes } = usePLC();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [currentPath, setCurrentPath] = useState([{ nodeId: 'RootFolder', displayName: 'Root' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showAllReferences, setShowAllReferences] = useState(true);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', message: '', details: [] });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load initial root nodes
  useEffect(() => {
    if (isConnected) {
      loadNodes('RootFolder');
    }
  }, [isConnected]);

  // Load nodes for a given parent
  const loadNodes = async (nodeId) => {
    if (!isConnected) {
      showError('Error', 'Not connected to OPC UA server');
      return;
    }

    try {
      setLoading(true);
      console.log('[BrowseNodes] Loading nodes for:', nodeId);
      const result = await browsePLCNodes(nodeId);
      console.log('[BrowseNodes] Browse result:', result);

      if (result.success) {
        console.log('[BrowseNodes] Nodes received:', result.nodes?.length);
        console.log('[BrowseNodes] All node displayNames:', result.nodes?.map(n => n.displayName).join(', '));
        if (result.nodes?.length > 0) {
          console.log('[BrowseNodes] First node sample:', result.nodes[0]);
          console.log('[BrowseNodes] All nodes:', result.nodes);
        }
        setNodes(result.nodes || []);
      } else {
        showError('Browse Failed', result.error);
        setNodes([]);
      }
    } catch (error) {
      console.error('[BrowseNodes] Error:', error);
      showError('Error', error.message);
      setNodes([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate into a node
  const navigateToNode = (node) => {
    console.log('[BrowseNodes] navigateToNode called with:', node);
    console.log('[BrowseNodes] Node class:', node.nodeClass, 'Type:', typeof node.nodeClass);
    
    // NodeClass can be either string or number
    // 1 = Object, 2 = Variable, 4 = Method, etc.
    const nodeClass = node.nodeClass?.toString() || '';
    const isObject = nodeClass === 'Object' || nodeClass === '1';
    const isFolder = nodeClass === 'Folder';
    
    if (isObject || isFolder) {
      console.log('[BrowseNodes] Navigation allowed, updating path');
      setCurrentPath([...currentPath, { nodeId: node.nodeId, displayName: node.displayName }]);
      loadNodes(node.nodeId);
      setExpandedNodes(new Set());
    } else {
      console.log('[BrowseNodes] Navigation not allowed for this node class:', nodeClass);
    }
  };

  // Navigate back
  const navigateBack = () => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      loadNodes(newPath[newPath.length - 1].nodeId);
      setExpandedNodes(new Set());
    }
  };

  // Format value for display
  const formatValueForDisplay = (value) => {
    if (value === null || value === undefined) return 'null';
    
    // Handle objects
    if (typeof value === 'object') {
      // If it's an object with a 'text' property (OPC UA LocalizedText), extract the text
      if (value.text !== undefined) {
        return String(value.text);
      }
      // If it's an object with a 'value' property, extract the value
      if (value.value !== undefined) {
        return formatValueForDisplay(value.value);
      }
      // For other objects, stringify
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return String(value);
      }
    }
    
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  // Read node value
  const handleReadNode = async (node) => {
    const nodeClassStr = node.nodeClass?.toString() || '';
    const isVariable = nodeClassStr === 'Variable' || nodeClassStr === '2';
    
    if (!isVariable) {
      showError('Error', 'Only variables can be read');
      return;
    }

    try {
      setLoading(true);
      const result = await readPLCVariable(node.nodeId);

      if (result.success) {
        const alreadyRegistered = isNodeRegistered(node.nodeId);
        setInfoModal({
          visible: true,
          title: 'Node Value',
          message: node.displayName,
          details: [
            { label: 'Value', value: formatValueForDisplay(result.value) },
            { label: 'Data Type', value: result.dataType },
            { label: 'Timestamp', value: new Date(result.timestamp).toLocaleString() },
            { label: 'Node ID', value: node.nodeId },
          ],
          icon: 'analytics-outline',
          iconColor: '#10B981',
          node: node, // Pass node for register button
          isRegistered: alreadyRegistered,
        });
      } else {
        showError('Read Failed', result.error);
      }
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy node ID to clipboard
  const copyNodeId = (nodeId) => {
    // Note: In a real app, you'd use Clipboard API
    showSuccess('Copied', 'Node ID copied to clipboard');
  };

  // Register node from browse
  const handleRegisterNode = async (node) => {
    if (!node || !node.nodeId) {
      showError('Error', 'Invalid node');
      return;
    }

    // Check if already registered
    const isAlreadyRegistered = registeredNodes.some(n => n.nodeId === node.nodeId);
    if (isAlreadyRegistered) {
      showError('Already Registered', 'This node is already registered');
      return;
    }

    try {
      setLoading(true);
      const result = await registerNode(node.nodeId);

      if (result.success) {
        const newNode = {
          nodeId: result.nodeId,
          registeredId: result.registeredId,
          timestamp: new Date().toISOString(),
        };
        addRegisteredNode(newNode);
        showSuccess('Success', `Node registered: ${result.registeredId}`);
        setInfoModal({ visible: false, title: '', message: '', details: [] });
      } else {
        showError('Registration Failed', result.error);
      }
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if node is already registered
  const isNodeRegistered = (nodeId) => {
    return registeredNodes.some(n => n.nodeId === nodeId);
  };

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (!isConnected) {
      showError('Error', 'Not connected to OPC UA server');
      return;
    }

    try {
      setIsSearching(true);
      const result = await searchPLCNodes(query.trim());
      
      if (result.success && result.results.length > 0) {
        setSearchResults(result.results);
        showSuccess('Search', `Found ${result.results.length} result(s)`);
      } else {
        setSearchResults([]);
        showError('No Results', 'No matching nodes found');
      }
    } catch (error) {
      showError('Search Error', error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate to search result
  const navigateToSearchResult = async (result) => {
    const nodeClassStr = result.nodeClass?.toString() || '';
    const isVariable = nodeClassStr === 'Variable' || nodeClassStr === '2';
    const isObject = nodeClassStr === 'Object' || nodeClassStr === '1';
    
    if (isVariable) {
      // If it's a variable, read its value (don't clear search)
      await handleReadNode(result);
    } else if (isObject) {
      // If it's an object, navigate into it and clear search
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      
      // Use breadcrumb from search result
      const breadcrumb = result.breadcrumb || [
        { nodeId: 'RootFolder', displayName: 'Root' },
        { nodeId: result.nodeId, displayName: result.displayName }
      ];
      
      setCurrentPath(breadcrumb);
      setNodes(result.children || []);
    } else {
      // For other types, just show the info
      showSuccess('Node Found', `${result.displayName} (${result.nodeClass})`);
    }
  };

  // Debug: manually browse a specific node
  const debugBrowseNode = async (nodeId) => {
    try {
      setLoading(true);
      console.log('[DEBUG] Manually browsing:', nodeId);
      const result = await browsePLCNodes(nodeId);
      console.log('[DEBUG] Result:', result);
      if (result.success) {
        setInfoModal({
          visible: true,
          title: 'Debug Browse Result',
          message: `Found ${result.nodes?.length || 0} nodes`,
          details: result.nodes?.slice(0, 10).map((n, i) => ({
            label: `Node ${i + 1}`,
            value: n.displayName,
          })) || [],
          icon: 'bug-outline',
          iconColor: '#F59E0B',
        });
      }
    } catch (error) {
      showError('Debug Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter nodes based on search
  const filteredNodes = nodes.filter((node) =>
    node.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.nodeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get node icon based on node class
  const getNodeIcon = (nodeClass) => {
    const nodeClassStr = nodeClass?.toString() || '';
    switch (nodeClassStr) {
      case 'Object':
      case '1':
        return 'cube-outline';
      case 'Variable':
      case '2':
        return 'git-commit-outline';
      case 'Method':
      case '4':
        return 'flash-outline';
      case 'ObjectType':
      case '8':
        return 'shapes-outline';
      case 'VariableType':
      case '16':
        return 'code-outline';
      case 'DataType':
      case '32':
        return 'document-text-outline';
      case 'ReferenceType':
      case '64':
        return 'link-outline';
      case 'View':
      case '128':
        return 'eye-outline';
      default:
        return 'ellipse-outline';
    }
  };

  // Get node color based on node class
  const getNodeColor = (nodeClass) => {
    const nodeClassStr = nodeClass?.toString() || '';
    switch (nodeClassStr) {
      case 'Object':
      case '1':
        return '#3B82F6';
      case 'Variable':
      case '2':
        return '#10B981';
      case 'Method':
      case '4':
        return '#F59E0B';
      case 'ObjectType':
      case '8':
        return '#8B5CF6';
      case 'VariableType':
      case '16':
        return '#06B6D4';
      case 'DataType':
      case '32':
        return '#EC4899';
      case 'ReferenceType':
      case '64':
        return '#6366F1';
      case 'View':
      case '128':
        return '#14B8A6';
      default:
        return colors.subtext;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Browse Nodes</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
        </View>
      </View>

      {/* Breadcrumb Navigation */}
      {currentPath.length > 1 && (
        <View style={[styles.breadcrumbContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={navigateBack} style={styles.breadcrumbButton}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.breadcrumbWrapper}>
            {currentPath.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.breadcrumbItem}
                onPress={() => {
                  if (index < currentPath.length - 1) {
                    // Navigate to this breadcrumb level
                    const newPath = currentPath.slice(0, index + 1);
                    setCurrentPath(newPath);
                    loadNodes(item.nodeId);
                    setExpandedNodes(new Set());
                  }
                }}
                disabled={index === currentPath.length - 1}
              >
                <Text style={[
                  styles.breadcrumbText, 
                  { color: index === currentPath.length - 1 ? colors.text : colors.primary }
                ]}>
                  {item.displayName}
                </Text>
                {index < currentPath.length - 1 && (
                  <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search nodes (e.g., DB_Data)..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {(searchQuery.length > 0 || isSearching) && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSearchResults([]);
            setIsSearching(false);
          }}>
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="close-circle" size={20} color={colors.subtext} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <ScrollView style={styles.searchResultsScrollContainer} showsVerticalScrollIndicator={false}>
          <View style={[styles.searchResultsHeader, { backgroundColor: colors.card }]}>
            <Text style={[styles.searchResultsTitle, { color: colors.text }]}>
              Search Results ({searchResults.length})
            </Text>
          </View>
          <View style={styles.searchResultsList}>
            {searchResults.map((result, index) => {
              const nodeClassStr = result.nodeClass?.toString() || '';
              const isVariable = nodeClassStr === 'Variable' || nodeClassStr === '2';
              
              return (
                <View
                  key={`search-${index}`}
                  style={[styles.searchResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.searchResultMainContent}
                    onPress={() => navigateToSearchResult(result)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.nodeIconContainer}>
                      <Ionicons
                        name={getNodeIcon(result.nodeClass)}
                        size={24}
                        color={getNodeColor(result.nodeClass)}
                      />
                    </View>

                    <View style={styles.searchResultInfo}>
                      <Text style={[styles.searchResultName, { color: colors.text }]}>
                        {result.displayName}
                      </Text>
                      <Text style={[styles.searchResultClass, { color: colors.subtext }]}>
                        {result.nodeClass}
                      </Text>
                      <Text style={[styles.searchResultPath, { color: colors.subtext }]}>
                        {result.path}
                      </Text>
                      <Text style={[styles.searchResultChildren, { color: colors.subtext }]}>
                        {result.children?.length || 0} child node(s)
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
                  </TouchableOpacity>
                  
                  {isVariable && (
                    <View style={styles.nodeActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                        onPress={() => handleReadNode(result)}
                      >
                        <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Nodes List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading nodes...</Text>
              </View>
            ) : filteredNodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={64} color={colors.subtext} />
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  {searchQuery ? 'No nodes found' : 'No nodes available'}
                </Text>
              </View>
            ) : (
              <View style={styles.nodesList}>
                {filteredNodes.map((node, index) => {
                  // NodeClass can be string or numeric
                  const nodeClassStr = node.nodeClass?.toString() || '';
                  const isNavigable = nodeClassStr === 'Object' || nodeClassStr === '1' || nodeClassStr === 'Folder';
                  const isVariable = nodeClassStr === 'Variable' || nodeClassStr === '2';
                  
                  return (
                    <View
                      key={`${node.nodeId}-${index}`}
                      style={[styles.nodeItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <TouchableOpacity
                        style={styles.nodeMainContent}
                        onPress={() => {
                          if (isNavigable) {
                            navigateToNode(node);
                          }
                        }}
                        disabled={!isNavigable}
                        activeOpacity={isNavigable ? 0.7 : 1}
                      >
                        <View style={styles.nodeIconContainer}>
                          <Ionicons
                            name={getNodeIcon(node.nodeClass)}
                            size={24}
                            color={getNodeColor(node.nodeClass)}
                          />
                        </View>

                        <View style={styles.nodeInfo}>
                          <Text style={[styles.nodeName, { color: colors.text }]}>
                            {node.displayName}
                          </Text>
                          <Text style={[styles.nodeClass, { color: colors.subtext }]}>
                            {node.nodeClass}
                          </Text>
                          <Text style={[styles.nodeId, { color: colors.subtext }]} numberOfLines={1}>
                            {node.nodeId}
                          </Text>
                        </View>

                        {isNavigable && (
                          <Ionicons name="chevron-forward" size={20} color={colors.subtext} style={styles.chevron} />
                        )}
                      </TouchableOpacity>

                      <View style={styles.nodeActions}>
                        {isVariable && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                            onPress={() => handleReadNode(node)}
                          >
                            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Summary Footer */}
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.subtext }]}>
              {filteredNodes.length} node(s) in current level
            </Text>
          </View>
        </>
      )}

      {/* Info Modal */}
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        details={infoModal.details}
        icon={infoModal.icon}
        iconColor={infoModal.iconColor}
        secondaryButton={infoModal.node ? {
          text: infoModal.isRegistered ? 'Registered' : 'Register',
          color: infoModal.isRegistered ? '#9CA3AF' : '#6366F1',
          disabled: infoModal.isRegistered,
          onPress: () => handleRegisterNode(infoModal.node)
        } : null}
        onClose={() => setInfoModal({ visible: false, title: '', message: '', details: [] })}
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
  statusCard: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  breadcrumbButton: {
    padding: 4,
    marginRight: 8,
    alignSelf: 'center',
  },
  breadcrumbWrapper: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  breadcrumb: {
    flex: 1,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
    marginVertical: 2,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  nodesList: {
    gap: 8,
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nodeMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  nodeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nodeClass: {
    fontSize: 12,
    marginBottom: 2,
  },
  nodeId: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  chevron: {
    marginLeft: 8,
  },
  nodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchResultsScrollContainer: {
    flex: 1,
    marginTop: 8,
  },
  searchResultsHeader: {
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultsList: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchResultMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultClass: {
    fontSize: 12,
    marginBottom: 2,
  },
  searchResultPath: {
    fontSize: 12,
    marginBottom: 2,
  },
  searchResultChildren: {
    fontSize: 11,
  },
});
