'use client';
import DebugMessaging from '@/components/DebugMessaging';

export default function DebugPermissionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug Firestore Permissions
          </h1>
          <p className="text-gray-600">
            Use this page to test which Firestore operations are failing
          </p>
        </div>
        
        <DebugMessaging />
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Make sure you&apos;re logged in to your app</li>
            <li>Click &quot;Test All Permissions&quot; button above</li>
            <li>Check the results to see which operations are failing</li>
            <li>Copy the error messages and share them for further debugging</li>
            <li>Try sending a message in your app after running this test</li>
          </ol>
        </div>
      </div>
    </div>
  );
}