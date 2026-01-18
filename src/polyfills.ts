/**
 * Polyfills for Node.js environment
 * This file must be imported first before any other imports
 */

// Import WebSocket from ws library
import { WebSocket as WsWebSocket } from 'ws';

// Make WebSocket available globally for libraries that expect browser environment
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WsWebSocket;
}

// Export empty object to make this a valid ES module
export {};
