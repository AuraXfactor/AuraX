'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';

export default function DebugMessaging() {
  const { user } = useAuth();
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPermissions = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }

    setTesting(true);
    setResults([]);
    addResult(`🔍 Testing permissions for user: ${user.uid}`);

    // Test 1: Basic user document access
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await getDoc(userDocRef);
      addResult('✅ users/{userId} READ: Success');
      
      // Try to write to user document
      await setDoc(userDocRef, { 
        lastTest: serverTimestamp(),
        testField: 'debug'
      }, { merge: true });
      addResult('✅ users/{userId} WRITE: Success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ users/{userId}: ${errorMessage}`);
    }

    // Test 2: Group chat creation
    try {
      const groupData = {
        name: 'Debug Test Group',
        createdBy: user.uid,
        members: [user.uid],
        admins: [user.uid],
        isPrivate: true,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        messageCount: 0
      };
      
      const groupRef = await addDoc(collection(db, 'groupChats'), groupData);
      addResult(`✅ groupChats CREATE: Success (${groupRef.id})`);
      
      // Test group message
      const messageData = {
        groupId: groupRef.id,
        fromUid: user.uid,
        fromName: user.displayName || user.email || 'Debug User',
        content: 'Debug test message',
        type: 'text',
        createdAt: serverTimestamp(),
        reactions: {}
      };
      
      const messageRef = await addDoc(
        collection(db, 'groupChats', groupRef.id, 'messages'), 
        messageData
      );
      addResult(`✅ groupChats/{groupId}/messages CREATE: Success (${messageRef.id})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ groupChats: ${errorMessage}`);
    }

    // Test 3: Enhanced chat creation
    try {
      const chatData = {
        participants: {
          [user.uid]: {
            userId: user.uid,
            joinedAt: serverTimestamp()
          }
        },
        createdAt: serverTimestamp(),
        encryptionEnabled: true,
        messageCount: 0
      };
      
      const chatRef = await addDoc(collection(db, 'enhancedChats'), chatData);
      addResult(`✅ enhancedChats CREATE: Success (${chatRef.id})`);
      
      // Test enhanced chat message
      const messageData = {
        chatId: chatRef.id,
        senderId: user.uid,
        encryptedContent: 'Debug test message',
        iv: '',
        type: 'text',
        timestamp: serverTimestamp(),
        readBy: { [user.uid]: serverTimestamp() }
      };
      
      const messageRef = await addDoc(
        collection(db, 'enhancedChats', chatRef.id, 'messages'),
        messageData
      );
      addResult(`✅ enhancedChats/{chatId}/messages CREATE: Success (${messageRef.id})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ enhancedChats: ${errorMessage}`);
    }

    // Test 4: Social system chats
    try {
      const messageData = {
        senderId: user.uid,
        content: 'Debug test message',
        type: 'text',
        timestamp: serverTimestamp(),
        participants: { [user.uid]: true },
        readBy: { [user.uid]: serverTimestamp() }
      };
      
      const messageRef = await addDoc(
        collection(db, 'chats', 'debug_chat_id', 'messages'),
        messageData
      );
      addResult(`✅ chats/{chatId}/messages CREATE: Success (${messageRef.id})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ chats/{chatId}/messages: ${errorMessage}`);
    }

    // Test 5: Legacy chat system
    try {
      const messageData = {
        fromUid: user.uid,
        toUid: 'debug_recipient',
        text: 'Debug test message',
        type: 'text',
        createdAt: serverTimestamp(),
        read: false
      };
      
      const messageRef = await addDoc(
        collection(db, 'users', user.uid, 'chats', 'debug_chat_id', 'messages'),
        messageData
      );
      addResult(`✅ users/{userId}/chats/{chatId}/messages CREATE: Success (${messageRef.id})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ users/{userId}/chats/{chatId}/messages: ${errorMessage}`);
    }

    addResult('🏁 Permission testing completed');
    setTesting(false);
  };

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to test permissions</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Firestore Permission Debugger</h2>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Logged in as: <strong>{user.email}</strong> (UID: {user.uid})
          </p>
        </div>

        <button
          onClick={testPermissions}
          disabled={testing}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {testing ? 'Testing Permissions...' : 'Test All Permissions'}
        </button>

        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet</p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`font-mono text-sm ${
                    result.includes('✅') 
                      ? 'text-green-600' 
                      : result.includes('❌') 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Basic user document read/write access</li>
            <li>Group chat creation and message sending</li>
            <li>Enhanced encrypted chat system</li>
            <li>Social system chat messages</li>
            <li>Legacy chat system under users collection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}