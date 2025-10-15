import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setOPCUAServerURL,
  connectToPLC,
  disconnectFromPLC,
  readPLCVariable,
  writePLCVariable,
  getConnectionStatus,
  getRegisteredNodes as fetchRegisteredNodes,
  getActiveSubscriptions as fetchActiveSubscriptions
} from '../services/plcApi';
import { API_BASE_URL } from '../config';
import { showError, showWarning } from '../utils/toast';

const PLCContext = createContext();

export const usePLC = () => {
  const context = useContext(PLCContext);
  if (!context) {
    throw new Error('usePLC must be used within PLCProvider');
  }
  return context;
};

export const PLCProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [registeredNodes, setRegisteredNodes] = useState([]);
  const [connectionConfig, setConnectionConfig] = useState({
    endpoint: 'opc.tcp://192.168.0.153:4840',
    securityPolicy: 'None',
    securityMode: 'None',
    authType: 'Anonymous',
    username: '',
    password: ''
  });

  // Load saved configuration on mount and check connection status
  useEffect(() => {
    loadConnectionConfig();
    checkConnectionStatus();
    loadRegisteredNodesFromServer();
  }, []);

  // Check connection status periodically and sync data
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        checkConnectionStatus();
        loadRegisteredNodesFromServer();
      }
    }, 5000); // Check every 5 seconds when connected (increased from 10s)

    return () => clearInterval(interval);
  }, [isConnected]);

  const loadConnectionConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('plcConnectionConfig');
      if (savedConfig) {
        setConnectionConfig(JSON.parse(savedConfig));
      }
      
      const savedUrl = await AsyncStorage.getItem('opcuaServerUrl');
      if (savedUrl) {
        setServerUrl(savedUrl);
        setOPCUAServerURL(savedUrl);
      } else {
        // Use production API by default
        setServerUrl(API_BASE_URL);
        setOPCUAServerURL(API_BASE_URL);
      }
    } catch (error) {
      console.error('Error loading PLC config:', error);
    }
  };

  const saveConnectionConfig = async (config) => {
    try {
      await AsyncStorage.setItem('plcConnectionConfig', JSON.stringify(config));
      setConnectionConfig(config);
    } catch (error) {
      console.error('Error saving PLC config:', error);
    }
  };

  const updateServerUrl = async (url) => {
    try {
      await AsyncStorage.setItem('opcuaServerUrl', url);
      setServerUrl(url);
      setOPCUAServerURL(url);
    } catch (error) {
      console.error('Error saving OPC UA Server URL:', error);
    }
  };

  const connect = async (config) => {
    try {
      console.log('Connecting to PLC via API:', serverUrl);
      console.log('PLC Endpoint:', config.endpoint);
      
      // Call the real API
      const result = await connectToPLC(config);
      
      if (result.success) {
        // Verify actual status from server before marking connected
        const status = await getConnectionStatus();
        const actuallyConnected = !!status.success && !!status.isConnected;
        setIsConnected(actuallyConnected);
        if (actuallyConnected) {
          await saveConnectionConfig(config);
          console.log('Connected successfully:', result.data);
          return { success: true, data: result.data };
        }
        console.warn('Server reported not connected after connect call');
        return { success: false, error: 'PLC bağlantısı kurulamadı' };
      } else {
        console.error('Connection failed:', result.error);
        setIsConnected(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Connection error:', error);
      return { success: false, error: error.message };
    }
  };

  const disconnect = async () => {
    try {
      console.log('Disconnecting from PLC...');
      const result = await disconnectFromPLC();
      setIsConnected(false);
      console.log('Disconnected:', result);
      return result;
    } catch (error) {
      console.error('Disconnect error:', error);
      setIsConnected(false);
      return { success: false, error: error.message };
    }
  };

  const readVariable = async (nodeId) => {
    try {
      console.log('Reading variable:', nodeId);
      
      // Call the real API
      const result = await readPLCVariable(nodeId);
      
      if (result.success) {
        console.log('Read successful:', result.value);
        return result;
      } else {
        console.error('Read failed:', result.error);
        
        // Check if error indicates connection loss
        if (result.error && (
          result.error.includes('Not connected') || 
          result.error.includes('connection lost') ||
          result.error.includes('BadSession') ||
          result.error.includes('BadConnection') ||
          result.error.includes('ECONNREFUSED') ||
          result.error.includes('ETIMEDOUT')
        )) {
          console.log('Connection lost detected during read');
          setIsConnected(false);
          showWarning('Connection Lost', 'PLC connection has been lost.');
        }
        
        return result;
      }
    } catch (error) {
      console.error('Read error:', error);
      
      // Check if error indicates connection loss
      if (error.message && (
        error.message.includes('Not connected') || 
        error.message.includes('connection lost') ||
        error.message.includes('Network request failed')
      )) {
        console.log('Connection lost detected during read exception');
        setIsConnected(false);
        showWarning('Connection Lost', 'PLC connection has been lost.');
      }
      
      return { success: false, error: error.message };
    }
  };

  const writeVariable = async (nodeId, value, dataType = 'Double') => {
    try {
      console.log('Writing variable:', nodeId, '=', value, `(${dataType})`);
      
      // Call the real API
      const result = await writePLCVariable(nodeId, value, dataType);
      
      if (result.success) {
        console.log('Write successful');
        return result;
      } else {
        console.error('Write failed:', result.error);
        
        // Check if error indicates connection loss
        if (result.error && (
          result.error.includes('Not connected') || 
          result.error.includes('connection lost') ||
          result.error.includes('BadSession') ||
          result.error.includes('BadConnection') ||
          result.error.includes('ECONNREFUSED') ||
          result.error.includes('ETIMEDOUT')
        )) {
          console.log('Connection lost detected during write');
          setIsConnected(false);
          showWarning('Connection Lost', 'PLC connection has been lost.');
        }
        
        return result;
      }
    } catch (error) {
      console.error('Write error:', error);
      
      // Check if error indicates connection loss
      if (error.message && (
        error.message.includes('Not connected') || 
        error.message.includes('connection lost') ||
        error.message.includes('Network request failed')
      )) {
        console.log('Connection lost detected during write exception');
        setIsConnected(false);
        showWarning('Connection Lost', 'PLC connection has been lost.');
      }
      
      return { success: false, error: error.message };
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const result = await getConnectionStatus();
      if (result.success) {
        const wasConnected = isConnected;
        const nowConnected = result.isConnected;
        
        if (wasConnected !== nowConnected) {
          console.log('Connection status changed:', nowConnected ? 'Connected' : 'Disconnected');
          
          // Show notification when connection is lost
          if (wasConnected && !nowConnected) {
            showWarning('Connection Lost', 'PLC connection has been lost. Please reconnect.');
          }
        }
        
        setIsConnected(nowConnected);
        return result;
      } else {
        if (isConnected) {
          showWarning('Connection Lost', 'Cannot verify PLC connection.');
        }
        setIsConnected(false);
        return { success: false, isConnected: false };
      }
    } catch (error) {
      console.error('Status check error:', error);
      if (isConnected) {
        showWarning('Connection Lost', 'PLC connection check failed.');
      }
      setIsConnected(false);
      return { success: false, isConnected: false };
    }
  };

  const addRegisteredNode = (node) => {
    setRegisteredNodes(prev => {
      // Avoid duplicates
      const exists = prev.find(n => n.registeredId === node.registeredId);
      if (exists) return prev;
      return [...prev, node];
    });
  };

  const removeRegisteredNode = (registeredId) => {
    setRegisteredNodes(prev => prev.filter(n => n.registeredId !== registeredId));
  };

  const clearRegisteredNodes = () => {
    setRegisteredNodes([]);
  };

  const loadRegisteredNodesFromServer = async () => {
    try {
      const result = await fetchRegisteredNodes();
      if (result.success && result.nodes) {
        // Update registered nodes from server
        setRegisteredNodes(result.nodes);
      }
    } catch (error) {
      console.error('Error loading registered nodes from server:', error);
    }
  };

  return (
    <PLCContext.Provider
      value={{
        isConnected,
        connectionConfig,
        serverUrl,
        registeredNodes,
        connect,
        disconnect,
        readVariable,
        writeVariable,
        checkConnectionStatus,
        saveConnectionConfig,
        updateServerUrl,
        addRegisteredNode,
        removeRegisteredNode,
        clearRegisteredNodes,
        loadRegisteredNodesFromServer
      }}
    >
      {children}
    </PLCContext.Provider>
  );
};