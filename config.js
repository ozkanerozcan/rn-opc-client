// Production API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://opc.ozkanerozcan.com';
export const API_URL = `${API_BASE_URL}/api/opcua`;
export const IS_WEB = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export default {
  API_BASE_URL,
  API_URL,
  IS_WEB,
};