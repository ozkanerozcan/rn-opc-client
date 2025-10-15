import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDark,
    colors: {
      primary: '#1173d4',
      background: isDark ? '#101922' : '#f6f7f8',
      card: isDark ? '#1a2836' : '#FFFFFF',
      text: isDark ? '#f6f7f8' : '#111418',
      subtext: isDark ? '#a0a7af' : '#617589',
      border: isDark ? '#374151' : '#E5E7EB',
      input: isDark ? '#1a2836' : '#FFFFFF',
      inputOpacity: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
      placeholder: isDark ? '#6b7280' : '#9ca3af',
    },
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};