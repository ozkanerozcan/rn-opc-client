import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function InfoModal({
  visible,
  title,
  message,
  details = [],
  icon = 'information-circle',
  iconColor = '#3B82F6',
  buttonText = 'OK',
  onClose,
  secondaryButton = null, // { text, color, onPress }
  node = null, // For register functionality
}) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={styles.header}>
                <Ionicons name={icon} size={24} color={iconColor} />
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {message && (
                  <Text style={[styles.message, { color: colors.subtext }]}>{message}</Text>
                )}
                
                {details.length > 0 && (
                  <View style={styles.detailsContainer}>
                    {details.map((detail, index) => (
                      <View 
                        key={index} 
                        style={[styles.detailRow, { borderBottomColor: colors.border }]}
                      >
                        <Text style={[styles.detailLabel, { color: colors.subtext }]}>
                          {detail.label}:
                        </Text>
                        <Text 
                          style={[styles.detailValue, { color: colors.text }]}
                          selectable
                        >
                          {detail.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Button */}
              <View style={styles.buttonContainer}>
                {secondaryButton && (
                  <TouchableOpacity
                    style={[
                      styles.button, 
                      styles.secondaryButton, 
                      { backgroundColor: secondaryButton.color || '#6366F1' },
                      secondaryButton.disabled && styles.buttonDisabled
                    ]}
                    onPress={secondaryButton.onPress}
                    activeOpacity={0.7}
                    disabled={secondaryButton.disabled}
                  >
                    <Text style={styles.buttonText}>{secondaryButton.text}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, secondaryButton && styles.primaryButton, { backgroundColor: iconColor }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>{buttonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    maxHeight: 400,
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 0,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    // Will take flex: 1
  },
  primaryButton: {
    // Will take flex: 1
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
