import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Pressable,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Modern, reusable select modal component with search
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Close callback
 * @param {string} title - Modal title
 * @param {Array} options - Array of options [{label, value, description?}]
 * @param {string} selectedValue - Currently selected value
 * @param {function} onSelect - Select callback (value)
 * @param {boolean} searchable - Enable search functionality (default: true)
 */
export default function SelectModal({ 
  visible, 
  onClose, 
  title, 
  options, 
  selectedValue, 
  onSelect,
  searchable = true
}) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (value) => {
    onSelect(value);
    setSearchQuery(''); // Reset search on select
    onClose();
  };

  const handleClose = () => {
    setSearchQuery(''); // Reset search on close
    onClose();
  };

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={handleClose}
      >
        <Pressable 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.card,
              // Fix height when searching to prevent jumping
              ...(searchQuery.length > 0 && { height: 350 })
            }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          {searchable && options.length > 5 && (
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.subtext} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.subtext} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Options */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.subtext} />
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  No results found
                </Text>
              </View>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      { 
                        backgroundColor: isSelected 
                          ? colors.primary + '15' 
                          : 'transparent',
                        borderColor: isSelected 
                          ? colors.primary 
                          : colors.border
                      }
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionTextContainer}>
                        <Text 
                          style={[
                            styles.optionLabel, 
                            { 
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? '600' : '400'
                            }
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.description && (
                          <Text 
                            style={[styles.optionDescription, { color: colors.subtext }]}
                          >
                            {option.description}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={24} 
                          color={colors.primary} 
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
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
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  optionsList: {
    flex: 1,
  },
  optionsContent: {
    paddingTop: 4,      // İlk elemanın marginTop ile toplam 16px (4+12=16)
    paddingBottom: 16,  // Son elemandan sonra 16px
  },
  option: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionTextContainer: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});