'use client'
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';

const TestIntegration: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const testFirestore = async () => {
    try {
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'This is a test document!',
        timestamp: new Date(),
        userId: user?.uid
      });
      setMessage(`Firestore success! Document ID: ${docRef.id}`);
    } catch (error) {
      setMessage(`Firestore error: ${error}`);
    }
  };

  const testStorage = async () => {
    try {
      const storageRef = ref(storage, `test-files/test-${Date.now()}.txt`);
      await uploadString(storageRef, 'This is a test file content!');
      setMessage('Storage success! File uploaded.');
    } catch (error) {
      setMessage(`Storage error: ${error}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-bold mb-4">Integration Test</h2>
      
      <p className="mb-2">
        <strong>User Email:</strong> {user?.email || 'Not logged in'}
      </p>
      
      <div className="space-y-2">
        <button
          onClick={testFirestore}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Firestore
        </button>
        
        <button
          onClick={testStorage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
        >
          Test Storage
        </button>
      </div>
      
      {message && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <strong>Result:</strong> {message}
        </div>
      )}
    </div>
  );
};

export default TestIntegration;