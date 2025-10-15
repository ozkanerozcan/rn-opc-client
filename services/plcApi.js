// PLC API Service for OPC UA Server Communication
import { API_BASE_URL } from '../config';

let OPCUA_SERVER_URL = API_BASE_URL;

/**
 * Set OPC UA Server base URL
 */
export const setOPCUAServerURL = (url) => {
  OPCUA_SERVER_URL = url;
};

/**
 * Get current OPC UA Server base URL
 */
export const getOPCUAServerURL = () => {
  return OPCUA_SERVER_URL;
};

/**
 * Connect to PLC via OPC UA API
 */
export const connectToPLC = async (config) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: config.endpoint,
        securityPolicy: config.securityPolicy,
        securityMode: config.securityMode,
        authType: config.authType,
        username: config.username,
        password: config.password,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Connection failed' };
    }
  } catch (error) {
    console.error('Connection error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disconnect from PLC
 */
export const disconnectFromPLC = async () => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('Disconnect error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Read a variable from PLC
 */
export const readPLCVariable = async (nodeId) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodeId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        value: data.value,
        dataType: data.dataType,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } else {
      return { success: false, error: data.error || 'Read failed' };
    }
  } catch (error) {
    console.error('Read error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Write a variable to PLC
 */
export const writePLCVariable = async (nodeId, value, dataType = 'Double') => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        value,
        dataType,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Write failed' };
    }
  } catch (error) {
    console.error('Write error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = async () => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        isConnected: data.connected,
        endpoint: data.endpoint,
      };
    } else {
      return { success: false, isConnected: false };
    }
  } catch (error) {
    console.error('Status check error:', error);
    return { success: false, isConnected: false };
  }
};

/**
 * Browse PLC nodes (optional - for discovering available variables)
 */
export const browsePLCNodes = async (nodeId = null) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/browse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodeId: nodeId || 'RootFolder' }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, nodes: data.nodes };
    } else {
      return { success: false, error: data.error || 'Browse failed' };
    }
  } catch (error) {
    console.error('Browse error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search for nodes by name
 */
export const searchPLCNodes = async (searchTerm) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchTerm }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, results: data.results };
    } else {
      return { success: false, error: data.error || 'Search failed' };
    }
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to variable changes (for real-time monitoring)
 */
export const subscribeToPLCVariable = async (nodeId, interval = 1000) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        interval, // Monitoring interval in milliseconds
      }),
    });

    const data = await response.json();
    return { success: response.ok, subscriptionId: data.subscriptionId };
  } catch (error) {
    console.error('Subscribe error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unsubscribe from variable changes
 */
export const unsubscribeFromPLCVariable = async (subscriptionId) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    return { success: response.ok };
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get historical data (if logging is enabled in Node-RED)
 */
export const getPLCHistory = async (nodeId, startTime, endTime) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        startTime,
        endTime,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, history: data.history };
    } else {
      return { success: false, error: data.error || 'Failed to fetch history' };
    }
  } catch (error) {
    console.error('History error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Register a node for monitoring
 */
export const registerNode = async (nodeId) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodeId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { 
        success: true, 
        registeredId: data.registeredId,
        nodeId: data.nodeId,
        message: data.message
      };
    } else {
      return { success: false, error: data.error || 'Failed to register node' };
    }
  } catch (error) {
    console.error('Register node error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unregister a node
 */
export const unregisterNode = async (registeredId) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registeredId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error || 'Failed to unregister node' };
    }
  } catch (error) {
    console.error('Unregister node error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Read from registered node
 */
export const readRegisteredNode = async (registeredId) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/read-registered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registeredId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        value: data.value,
        dataType: data.dataType,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } else {
      return { success: false, error: data.error || 'Read failed' };
    }
  } catch (error) {
    console.error('Read registered error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Write to registered node
 */
export const writeRegisteredNode = async (registeredId, value, dataType = 'Double') => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/write-registered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registeredId,
        value,
        dataType,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { 
        success: true, 
        message: data.message,
        statusCode: data.statusCode
      };
    } else {
      return { success: false, error: data.error || 'Write failed' };
    }
  } catch (error) {
    console.error('Write registered error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to a registered node
 */
export const subscribeRegisteredNode = async (registeredId, interval = 1000) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/subscribe-registered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registeredId, interval }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        subscriptionId: data.subscriptionId,
        message: data.message
      };
    } else {
      return { success: false, error: data.error || 'Failed to subscribe' };
    }
  } catch (error) {
    console.error('Subscribe registered error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subscription value
 */
export const getSubscriptionValue = async (subscriptionId) => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/subscription-value/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        value: data.value
      };
    } else {
      return { success: false, error: data.error || 'Failed to get subscription value' };
    }
  } catch (error) {
    console.error('Get subscription value error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all registered nodes from server
 */
export const getRegisteredNodes = async () => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/registered-nodes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        nodes: data.nodes
      };
    } else {
      return { success: false, error: data.error || 'Failed to get registered nodes' };
    }
  } catch (error) {
    console.error('Get registered nodes error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all active subscriptions from server
 */
export const getActiveSubscriptions = async () => {
  try {
    const response = await fetch(`${OPCUA_SERVER_URL}/api/opcua/active-subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        subscriptions: data.subscriptions
      };
    } else {
      return { success: false, error: data.error || 'Failed to get active subscriptions' };
    }
  } catch (error) {
    console.error('Get active subscriptions error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  connectToPLC,
  disconnectFromPLC,
  readPLCVariable,
  writePLCVariable,
  getConnectionStatus,
  browsePLCNodes,
  searchPLCNodes,
  subscribeToPLCVariable,
  unsubscribeFromPLCVariable,
  getPLCHistory,
  registerNode,
  unregisterNode,
  readRegisteredNode,
  writeRegisteredNode,
  subscribeRegisteredNode,
  getSubscriptionValue,
  getRegisteredNodes,
  getActiveSubscriptions,
};