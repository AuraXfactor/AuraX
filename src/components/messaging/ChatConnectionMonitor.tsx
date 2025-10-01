'use client';
import React, { useState, useEffect } from 'react';
import { getChatStabilityManager, ConnectionStatus } from '@/lib/chatStability';

interface ChatConnectionMonitorProps {
  onConnectionChange?: (isConnected: boolean) => void;
  showStatus?: boolean;
}

export default function ChatConnectionMonitor({ 
  onConnectionChange, 
  showStatus = true 
}: ChatConnectionMonitorProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastConnected: new Date(),
    retryCount: 0,
    errors: []
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const stabilityManager = getChatStabilityManager();
    
    // Check connection health periodically
    const healthCheckInterval = setInterval(async () => {
      setIsChecking(true);
      try {
        const isHealthy = await stabilityManager.checkConnectionHealth();
        const status = stabilityManager.getConnectionStatus();
        setConnectionStatus(status);
        
        if (onConnectionChange) {
          onConnectionChange(isHealthy);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
        }));
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      } finally {
        setIsChecking(false);
      }
    }, 30000); // Check every 30 seconds

    // Initial health check
    const initialCheck = async () => {
      setIsChecking(true);
      try {
        const isHealthy = await stabilityManager.checkConnectionHealth();
        const status = stabilityManager.getConnectionStatus();
        setConnectionStatus(status);
        
        if (onConnectionChange) {
          onConnectionChange(isHealthy);
        }
      } catch (error) {
        console.error('❌ Initial health check failed:', error);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
        }));
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    initialCheck();

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [onConnectionChange]);

  const handleReconnect = async () => {
    setIsChecking(true);
    try {
      const stabilityManager = getChatStabilityManager();
      await stabilityManager.forceReconnection();
      
      const status = stabilityManager.getConnectionStatus();
      setConnectionStatus(status);
      
      if (onConnectionChange) {
        onConnectionChange(status.isConnected);
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (!showStatus) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        connectionStatus.isConnected 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
        } ${isChecking ? 'animate-pulse' : ''}`} />
        
        <span>
          {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
        </span>
        
        {!connectionStatus.isConnected && (
          <button
            onClick={handleReconnect}
            disabled={isChecking}
            className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 transition"
          >
            {isChecking ? 'Reconnecting...' : 'Reconnect'}
          </button>
        )}
      </div>
      
      {/* Error details (collapsible) */}
      {connectionStatus.errors.length > 0 && (
        <details className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs">
          <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400">
            {connectionStatus.errors.length} error(s)
          </summary>
          <div className="mt-2 space-y-1">
            {connectionStatus.errors.slice(-3).map((error, index) => (
              <div key={index} className="text-red-600 dark:text-red-400">
                {error}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}