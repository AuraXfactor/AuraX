'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useState } from 'react';

export default function AnalyticsTest() {
  const { track, trackEngagement, trackApp, trackFeatureUsage } = useAnalytics();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicEvent = () => {
    track('test_event', { test: true });
    addResult('Basic event tracked');
  };

  const testEngagement = () => {
    trackEngagement('click', 'test', 'analytics_test');
    addResult('Engagement tracked');
  };

  const testAppEvent = () => {
    trackApp('test_app_event', { feature: 'analytics_test' });
    addResult('App event tracked');
  };

  const testFeatureUsage = () => {
    trackFeatureUsage('analytics_test', 'button_click');
    addResult('Feature usage tracked');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Analytics Test Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={testBasicEvent}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Basic Event
        </button>
        
        <button 
          onClick={testEngagement}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Engagement
        </button>
        
        <button 
          onClick={testAppEvent}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test App Event
        </button>
        
        <button 
          onClick={testFeatureUsage}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Test Feature Usage
        </button>
        
        <button 
          onClick={clearResults}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>
      
      <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
        <h4 className="font-medium mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-sm">No tests run yet</p>
        ) : (
          testResults.map((result, index) => (
            <p key={index} className="text-sm text-gray-700">{result}</p>
          ))
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Check browser console and Google Analytics Real-Time reports to verify tracking.</p>
      </div>
    </div>
  );
}