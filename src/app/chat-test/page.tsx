'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createDirectChat, sendMessage, listenToMessages } from '@/lib/messaging';
import { useEffect } from 'react';

export default function ChatTestPage() {
  const { user } = useAuth();
  const [testUserId, setTestUserId] = useState('');
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  const testChatCreation = async () => {
    if (!user || !testUserId.trim()) {
      setStatus('Please provide a test user ID');
      return;
    }

    try {
      setStatus('Creating chat...');
      const newChatId = await createDirectChat(user.uid, testUserId);
      setChatId(newChatId);
      setStatus(`Chat created successfully: ${newChatId}`);
    } catch (error) {
      console.error('Chat creation error:', error);
      setStatus(`Chat creation failed: ${error}`);
    }
  };

  const testSendMessage = async () => {
    if (!chatId || !message.trim()) {
      setStatus('Please create a chat and enter a message');
      return;
    }

    try {
      setStatus('Sending message...');
      await sendMessage({
        chatId,
        senderId: user!.uid,
        content: message,
        type: 'text'
      });
      setStatus('Message sent successfully');
      setMessage('');
    } catch (error) {
      console.error('Message sending error:', error);
      setStatus(`Message sending failed: ${error}`);
    }
  };

  const testListenToMessages = () => {
    if (!chatId) {
      setStatus('Please create a chat first');
      return;
    }

    try {
      setStatus('Setting up message listener...');
      const unsubscribe = listenToMessages(chatId, user!.uid, (newMessages) => {
        setMessages(newMessages);
        setStatus(`Received ${newMessages.length} messages`);
      });
      
      // Store unsubscribe function for cleanup
      (window as any).chatUnsubscribe = unsubscribe;
      setStatus('Message listener set up successfully');
    } catch (error) {
      console.error('Message listening error:', error);
      setStatus(`Message listening failed: ${error}`);
    }
  };

  const cleanup = () => {
    if ((window as any).chatUnsubscribe) {
      (window as any).chatUnsubscribe();
      (window as any).chatUnsubscribe = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Chat Test</h1>
          <p>Please log in to test chat functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Chat Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test User ID (to create chat with):
            </label>
            <input
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter another user's UID"
            />
            <button
              onClick={testChatCreation}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Chat
            </button>
          </div>

          {chatId && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Message:
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter message"
              />
              <button
                onClick={testSendMessage}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Send Message
              </button>
            </div>
          )}

          <div>
            <button
              onClick={testListenToMessages}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Listen to Messages
            </button>
            <button
              onClick={cleanup}
              className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Cleanup
            </button>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Status:</h3>
            <p>{status}</p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Messages ({messages.length}):</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  <p><strong>Sender:</strong> {msg.senderId}</p>
                  <p><strong>Content:</strong> {msg.content}</p>
                  <p><strong>Time:</strong> {msg.timestamp?.toDate?.()?.toLocaleString() || 'Unknown'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}