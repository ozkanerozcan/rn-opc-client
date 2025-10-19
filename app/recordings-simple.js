import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getRecordingSummary } from '../services/subscriptionService';

export default function RecordingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const result = await getRecordingSummary();
      
      if (result.success) {
        console.log('Got recordings:', result.data);
        setRecordings(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 }}>My Recordings</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, color: colors.text, marginBottom: 20 }}>
          Total: {recordings.length} recordings
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          recordings.map((rec, index) => (
            <View 
              key={rec.id} 
              style={{ 
                padding: 16, 
                marginBottom: 12, 
                backgroundColor: colors.card, 
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                {rec.recording_name || 'No name'}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 14 }}>
                📊 {rec.total_values || 0} values recorded
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>
                Node: {rec.original_node_id}
              </Text>
            </View>
          ))
        )}

        {!loading && recordings.length === 0 && (
          <Text style={{ color: colors.subtext, textAlign: 'center', marginTop: 40 }}>
            No recordings yet
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
