import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showError } from '../utils/toast';
import { supabase } from '../lib/supabase';

export default function DataChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef();
  const { recordingId, recordingName } = useLocalSearchParams();
  
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'assistant',
      text: recordingId 
        ? `Hello! I can help you analyze the "${recordingName}" recording. Ask me anything like:\n\n• "Show me the last 10 readings"\n• "What's the average value?"\n• "Show values above 50"\n• "When did the maximum value occur?"`
        : 'Hello! I can help you query your recorded OPC UA data. Ask me anything like:\n\n• "Show me the last 10 temperature readings"\n• "What was the average pressure today?"\n• "Get all data from yesterday"\n• "Show values where temperature > 50"',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const n8nWebhookUrl = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      showError('Error', 'n8n webhook URL is not configured');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get user for authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Sending to n8n:', {
        url: n8nWebhookUrl,
        query: userMessage.text,
        userId: user.id,
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout (300 seconds)
      
      // Send to n8n webhook
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
          userId: user.id,
          recordingId: recordingId || null,
          recordingName: recordingName || null,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('n8n error response:', errorText);
        throw new Error(`n8n returned status ${response.status}`);
      }

      const result = await response.json();
      console.log('n8n response:', result);

      // Add assistant response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: result.response || result.message || 'Received response from n8n',
        data: result.data || null,
        sql: result.sql || null,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText = 'Sorry, I encountered an error. Please try again.';
      
      if (error.name === 'AbortError') {
        errorText = 'Request timed out after 5 minutes. n8n took too long to respond.';
      } else if (error.message.includes('Network request failed')) {
        errorText = 'Network error. Please check your connection.';
      } else if (error.message.includes('status')) {
        errorText = `n8n error: ${error.message}`;
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        text: errorText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      showError('Error', errorText);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser
                ? colors.primary
                : isError
                ? colors.error
                : colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#FFFFFF' : colors.text },
            ]}
          >
            {message.text}
          </Text>

          {/* Show SQL query if available */}
          {message.sql && (
            <View
              style={[
                styles.sqlContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.sqlLabel, { color: colors.textSecondary }]}>
                SQL Query:
              </Text>
              <Text style={[styles.sqlText, { color: colors.text }]}>
                {message.sql}
              </Text>
            </View>
          )}

          {/* Show data table if available */}
          {message.data && Array.isArray(message.data) && message.data.length > 0 && (
            <View
              style={[
                styles.dataContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
                Results ({message.data.length} rows):
              </Text>
              <ScrollView
                horizontal
                style={styles.dataTable}
                showsHorizontalScrollIndicator={false}
              >
                <View>
                  {/* Table header */}
                  <View style={styles.tableRow}>
                    {Object.keys(message.data[0]).map((key) => (
                      <Text
                        key={key}
                        style={[
                          styles.tableHeader,
                          { color: colors.text, borderColor: colors.border },
                        ]}
                      >
                        {key}
                      </Text>
                    ))}
                  </View>
                  {/* Table rows */}
                  {message.data.slice(0, 10).map((row, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      {Object.values(row).map((value, i) => (
                        <Text
                          key={i}
                          style={[
                            styles.tableCell,
                            { color: colors.text, borderColor: colors.border },
                          ]}
                        >
                          {String(value)}
                        </Text>
                      ))}
                    </View>
                  ))}
                  {message.data.length > 10 && (
                    <Text
                      style={[
                        styles.moreRows,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ... and {message.data.length - 10} more rows
                    </Text>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          <Text
            style={[styles.messageTime, { color: isUser ? '#FFFFFF99' : colors.textSecondary }]}
          >
            {message.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {recordingName || 'Data Chat'}
          </Text>
          {recordingId && (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Recording Chat
            </Text>
          )}
        </View>
        <View style={styles.settingsButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          {loading && (
            <View style={[styles.loadingContainer, styles.assistantMessage]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Analyzing your query...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your data..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !loading ? colors.primary : colors.border,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !loading ? '#FFFFFF' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    padding: 4,
    width: 32,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  sqlContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  sqlLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  sqlText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dataContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataTable: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    fontSize: 11,
    fontWeight: '600',
    padding: 6,
    minWidth: 100,
    borderWidth: 1,
  },
  tableCell: {
    fontSize: 11,
    padding: 6,
    minWidth: 100,
    borderWidth: 1,
  },
  moreRows: {
    fontSize: 11,
    padding: 6,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
