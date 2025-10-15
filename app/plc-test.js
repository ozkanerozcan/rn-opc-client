import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { usePLC } from '../contexts/PLCContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { showError, showSuccess, showInfo } from '../utils/toast';

export default function PLCTestScreen() {
  const { colors } = useTheme();
  const { isConnected, readVariable, writeVariable } = usePLC();
  const router = useRouter();
  
  // Read test
  const [readNodeId, setReadNodeId] = useState('ns=3;s="DB_Data"."int"');
  const [readValue, setReadValue] = useState(null);
  const [readDataType, setReadDataType] = useState(null);
  const [readTimestamp, setReadTimestamp] = useState(null);
  const [isReading, setIsReading] = useState(false);

  // Write test
  const [writeNodeId, setWriteNodeId] = useState('ns=3;s="DB_Data"."int"');
  const [writeValue, setWriteValue] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [writeError, setWriteError] = useState(null);

  useEffect(() => {
    if (!isConnected) {
      showInfo('Not Connected', 'Please connect to PLC first');
      setTimeout(() => router.replace('/plc-connection'), 2000);
    }
  }, [isConnected]);

  const handleRead = async () => {
    if (!readNodeId.trim()) {
      showError('Error', 'Please enter a Node ID');
      return;
    }

    setIsReading(true);
    try {
      const result = await readVariable(readNodeId);
      if (result.success) {
        setReadValue(result.value);
        setReadDataType(result.dataType);
        setReadTimestamp(result.timestamp);
      } else {
        showError('Read Failed', result.error || 'Failed to read variable');
      }
    } catch (error) {
      showError('Error', error.message);
    } finally {
      setIsReading(false);
    }
  };

  const validateValueFormat = (value, dataType) => {
    const trimmedValue = value.trim();
    const type = (dataType || '').toLowerCase();

    // Check for comma decimal separator
    if ((type.includes('float') || type.includes('double') ||
         type.includes('real') || type.includes('lreal')) &&
        trimmedValue.includes(',')) {
      return {
        valid: false,
        error: `Invalid format: Use dot (.) as decimal separator, not comma (,)\nExample: 2.5 instead of 2,5`
      };
    }

    // Validate integer format
    if (type.includes('int') || type.includes('byte') ||
        type.includes('word') || type.includes('dword')) {
      if (!/^-?\d+$/.test(trimmedValue)) {
        return {
          valid: false,
          error: `Invalid format for ${dataType}: Must be a whole number\nExample: 42 or -15`
        };
      }
    }

    // Validate float/double format
    if (type.includes('float') || type.includes('double') ||
        type.includes('real') || type.includes('lreal')) {
      if (!/^-?\d+\.?\d*$/.test(trimmedValue)) {
        return {
          valid: false,
          error: `Invalid format for ${dataType}: Must be a number with dot as decimal\nExample: 2.5 or -3.14`
        };
      }
    }

    // Validate boolean format
    if (type.includes('bool')) {
      const lowerValue = trimmedValue.toLowerCase();
      if (!['true', 'false', '1', '0', 'on', 'off'].includes(lowerValue)) {
        return {
          valid: false,
          error: `Invalid format for ${dataType}: Use true/false or 1/0 or on/off`
        };
      }
    }

    return { valid: true };
  };

  const handleWrite = async () => {
    // Clear previous error
    setWriteError(null);

    if (!writeNodeId.trim()) {
      const errorMsg = 'Please enter a Node ID';
      setWriteError(errorMsg);
      showError('Error', errorMsg);
      return;
    }

    if (writeValue.trim() === '') {
      const errorMsg = 'Please enter a value to write';
      setWriteError(errorMsg);
      showError('Error', errorMsg);
      return;
    }

    setIsWriting(true);
    try {
      // First, read the variable to get its data type
      console.log('Reading variable to detect data type:', writeNodeId);
      const readResult = await readVariable(writeNodeId);
      
      if (!readResult.success) {
        const errorMsg = 'Could not read variable to determine data type. ' + (readResult.error || '');
        setWriteError(errorMsg);
        showError('Error', errorMsg);
        setIsWriting(false);
        return;
      }

      const detectedDataType = readResult.dataType;
      console.log('Detected data type:', detectedDataType);

      // Validate value format before conversion
      console.log('Validating value:', writeValue, 'for type:', detectedDataType);
      const validation = validateValueFormat(writeValue, detectedDataType);
      console.log('Validation result:', validation);
      
      if (!validation.valid) {
        setWriteError(validation.error);
        showError('Invalid Value Format', validation.error);
        setIsWriting(false);
        return;
      }

      // Convert value based on detected data type
      let convertedValue = writeValue.trim();
      const dataType = (detectedDataType || '').toLowerCase();
      
      if (dataType.includes('bool')) {
        // Boolean conversion
        convertedValue = convertedValue.toLowerCase() === 'true' ||
                        convertedValue === '1' ||
                        convertedValue.toLowerCase() === 'on';
      } else if (dataType.includes('int') || dataType.includes('byte') ||
                 dataType.includes('word') || dataType.includes('dword')) {
        // Integer conversion
        convertedValue = parseInt(convertedValue);
        if (isNaN(convertedValue)) {
          const errorMsg = 'Invalid integer value for data type: ' + detectedDataType;
          setWriteError(errorMsg);
          showError('Error', errorMsg);
          setIsWriting(false);
          return;
        }
      } else if (dataType.includes('float') || dataType.includes('double') ||
                 dataType.includes('real') || dataType.includes('lreal')) {
        // Float/Double conversion
        convertedValue = parseFloat(convertedValue);
        if (isNaN(convertedValue)) {
          const errorMsg = 'Invalid numeric value for data type: ' + detectedDataType;
          setWriteError(errorMsg);
          showError('Error', errorMsg);
          setIsWriting(false);
          return;
        }
      }
      // For String type, keep as string (convertedValue stays as is)

      console.log(`Writing: ${writeNodeId} = ${convertedValue} (${detectedDataType})`);
      const result = await writeVariable(writeNodeId, convertedValue, detectedDataType);
      
      if (result.success) {
        setWriteError(null);
        showSuccess('Success', `Value written successfully as ${detectedDataType}`);
        setWriteValue('');
      } else {
        const errorMsg = result.error || 'Failed to write variable';
        setWriteError(errorMsg);
        showError('Write Failed', errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || 'Unknown error occurred';
      setWriteError(errorMsg);
      showError('Error', errorMsg);
    } finally {
      setIsWriting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatValue = (value, dataType) => {
    if (value === null || value === undefined) return '';
    
    // Normalize dataType to lowercase for comparison
    const type = (dataType || '').toLowerCase();
    
    // Boolean types
    if (type.includes('bool')) {
      return value ? 'true' : 'false';
    }
    
    // Integer types
    if (type.includes('int') || type.includes('byte') ||
        type.includes('word') || type.includes('dword') ||
        type.includes('uint') || type.includes('sint') ||
        type.includes('usint') || type.includes('udint') ||
        type.includes('lint') || type.includes('ulint')) {
      return Math.round(value).toString();
    }
    
    // Floating point types
    if (type.includes('float') || type.includes('double') ||
        type.includes('real') || type.includes('lreal')) {
      return Number(value).toFixed(2);
    }
    
    // String types
    if (type.includes('string') || type.includes('char')) {
      return value.toString();
    }
    
    // Default: show as is
    return value.toString();
  };

  const getDataTypeLabel = (dataType) => {
    if (!dataType) return '';
    
    const type = dataType.toLowerCase();
    
    if (type.includes('bool')) return 'Boolean';
    if (type.includes('int16') || type.includes('sint')) return 'Integer (16-bit)';
    if (type.includes('int32') || type.includes('dint')) return 'Integer (32-bit)';
    if (type.includes('int64') || type.includes('lint')) return 'Integer (64-bit)';
    if (type.includes('uint16') || type.includes('usint')) return 'Unsigned Integer (16-bit)';
    if (type.includes('uint32') || type.includes('udint')) return 'Unsigned Integer (32-bit)';
    if (type.includes('float')) return 'Float (32-bit)';
    if (type.includes('double')) return 'Double (64-bit)';
    if (type.includes('real')) return 'Real (32-bit)';
    if (type.includes('lreal')) return 'LReal (64-bit)';
    if (type.includes('string')) return 'String';
    if (type.includes('byte')) return 'Byte (8-bit)';
    if (type.includes('word')) return 'Word (16-bit)';
    if (type.includes('dword')) return 'DWord (32-bit)';
    
    return dataType;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card + 'CC', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Read/Write Test</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Read Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Read Variable</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>Node ID</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={readNodeId}
                onChangeText={setReadNodeId}
                placeholder='ns=3;s="DB_Data"."Variable"'
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { 
                backgroundColor: colors.primary,
                opacity: isReading || !isConnected ? 0.6 : 1
              }]}
              onPress={handleRead}
              disabled={isReading || !isConnected}
            >
              {isReading ? (
                <>
                  <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Read</Text>
                </>
              )}
            </TouchableOpacity>

            {readValue !== null && (
              <View style={[styles.resultBox, {
                backgroundColor: colors.background,
                borderColor: colors.border
              }]}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultLabel, { color: colors.subtext }]}>Value:</Text>
                  {readDataType && (
                    <Text style={[styles.dataTypeLabel, { color: colors.subtext }]}>
                      {getDataTypeLabel(readDataType)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.resultValue, { color: colors.primary }]}>
                  {formatValue(readValue, readDataType)}
                </Text>
                {readTimestamp && (
                  <Text style={[styles.resultTimestamp, { color: colors.subtext }]}>
                    {formatTimestamp(readTimestamp)}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Write Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Write Variable</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>Node ID</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={writeNodeId}
                onChangeText={setWriteNodeId}
                placeholder='ns=3;s="DB_Data"."Variable"'
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>Value</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={writeValue}
                onChangeText={setWriteValue}
                placeholder="Enter value (data type will be auto-detected)"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {writeError && (
              <View style={[styles.errorBox, {
                backgroundColor: '#FEE2E2',
                borderColor: '#EF4444'
              }]}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={[styles.errorText, { color: '#DC2626' }]}>
                  {writeError}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: '#10B981',
                opacity: isWriting || !isConnected ? 0.6 : 1
              }]}
              onPress={handleWrite}
              disabled={isWriting || !isConnected}
            >
              {isWriting ? (
                <>
                  <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Writing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Write</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, {
          backgroundColor: colors.primary + '10',
          borderColor: colors.primary
        }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Node ID format: ns=3;s="DB_Data"."Variable"
            </Text>
            <Text style={[styles.infoText, { color: colors.subtext, fontSize: 12, marginTop: 4 }]}>
              Data type will be automatically detected from PLC
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
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
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
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
  resultBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
  },
  dataTypeLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  resultTimestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});