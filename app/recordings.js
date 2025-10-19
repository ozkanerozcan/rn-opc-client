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
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { showSuccess, showError } from '../utils/toast';
import {
  getRecordingSummary,
  updateRecordingName,
  deleteRecording,
} from '../services/subscriptionService';

export default function RecordingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const result = await getRecordingSummary();
      
      if (result.success) {
        console.log('Got recordings:', result.data);
        console.log('Setting recordings state with:', result.data);
        setRecordings(result.data || []);
        console.log('State set complete');
      } else {
        showError('Error', result.error || 'Failed to load recordings');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditName = (recording) => {
    setEditingId(recording.id);
    setEditingName(recording.recording_name);
  };

  const saveRecordingName = async (recordId) => {
    if (!editingName.trim()) {
      showError('Error', 'Recording name cannot be empty');
      return;
    }

    try {
      const result = await updateRecordingName(recordId, editingName.trim());

      if (result.success) {
        showSuccess('Success', 'Recording name updated');
        setEditingId(null);
        setEditingName('');
        loadRecordings();
      } else {
        showError('Error', result.error || 'Failed to update name');
      }
    } catch (error) {
      showError('Error', error.message);
    }
  };

  const handleDeleteRecording = (recording) => {
    console.log('Delete clicked for:', recording.id);
    setRecordingToDelete(recording);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!recordingToDelete) return;
    
    try {
      console.log('Performing delete for:', recordingToDelete.id);
      setDeleteModalVisible(false);
      setLoading(true);
      
      const result = await deleteRecording(recordingToDelete.id);
      console.log('Delete result:', result);

      if (result.success) {
        showSuccess('Deleted', `Deleted ${result.deletedValues} values`);
        setRecordingToDelete(null);
        loadRecordings();
      } else {
        showError('Error', result.error || 'Failed to delete recording');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setRecordingToDelete(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'No data';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(seconds)}s`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Recordings</Text>
        <TouchableOpacity onPress={loadRecordings} style={styles.backButton}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Total Recordings</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{recordings.length}</Text>
          <Text style={[styles.summarySubtext, { color: colors.subtext }]}>
            {recordings.reduce((sum, r) => sum + (r.total_values || 0), 0).toLocaleString()} total values
          </Text>
        </View>

        {/* Recordings List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No recordings yet</Text>
          </View>
        ) : (
          recordings.map((recording) => (
            <View key={recording.id} style={[styles.recordingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Name Edit */}
              {editingId === recording.id ? (
                <View style={{ marginBottom: 12 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
                      onPress={() => saveRecordingName(recording.id)}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: '#6B7280', flex: 1 }]}
                      onPress={() => { setEditingId(null); setEditingName(''); }}
                    >
                      <Ionicons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons 
                      name={recording.is_recording ? "radio-button-on" : "stop-circle-outline"} 
                      size={20} 
                      color={recording.is_recording ? '#EF4444' : colors.subtext} 
                    />
                    <Text style={[styles.recordingName, { color: colors.text }]}>
                      {recording.recording_name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => startEditName(recording)} style={{ padding: 4 }}>
                    <Ionicons name="pencil" size={18} color={colors.subtext} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Info */}
              <View style={{ gap: 6, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="analytics-outline" size={16} color={colors.subtext} />
                  <Text style={{ color: colors.subtext, fontSize: 14 }}>
                    {recording.total_values || 0} values
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time-outline" size={16} color={colors.subtext} />
                  <Text style={{ color: colors.subtext, fontSize: 14 }}>
                    {formatDuration(recording.duration_seconds)}
                  </Text>
                </View>
              </View>

              {/* Node */}
              <View style={[styles.nodeInfo, { backgroundColor: colors.input }]}>
                <Text style={{ color: colors.placeholder, fontSize: 11 }}>Node:</Text>
                <Text style={{ color: colors.text, fontSize: 13 }}>{recording.original_node_id}</Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={() => router.push(`/data-chat?recordingId=${recording.id}&recordingName=${encodeURIComponent(recording.recording_name)}`)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFF" />
                  <Text style={styles.actionButtonText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleDeleteRecording(recording)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Recording</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Are you sure you want to delete "{recordingToDelete?.recording_name}"?
              </Text>
              <Text style={[styles.modalSubtext, { color: colors.subtext }]}>
                This will permanently delete {recordingToDelete?.total_values || 0} recorded values.
              </Text>
              <Text style={[styles.modalWarning, { color: '#EF4444' }]}>
                This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={cancelDelete}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  recordingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInfo: {
    padding: 12,
    borderRadius: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
    gap: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalSubtext: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalWarning: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
