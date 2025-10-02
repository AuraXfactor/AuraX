import AnalyticsTest from '@/components/AnalyticsTest';

export default function AnalyticsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Test Page</h1>
          <p className="text-gray-600">
            This page helps you test Google Analytics 4 integration
          </p>
        </div>
        
        <AnalyticsTest />
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How to Verify Analytics</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Open Google Analytics dashboard</li>
            <li>Go to Real-Time reports</li>
            <li>Click the test buttons above</li>
            <li>Check if events appear in Real-Time</li>
            <li>Navigate between pages to test page view tracking</li>
          </ol>
        </div>
        
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-2 text-green-800">
            <li>Page views should track automatically on route changes</li>
            <li>Custom events should appear in Real-Time reports</li>
            <li>No console errors related to Google Analytics</li>
            <li>Scripts should load with "afterInteractive" strategy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}