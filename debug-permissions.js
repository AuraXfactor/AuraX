// Debugging script to test Firestore permissions
// Run this in your browser console to test which specific operation is failing

console.log('🔍 Starting Firestore Permission Debug...');

// Test user authentication
import { auth } from './src/lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ User authenticated:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Test different collection access
    testCollectionAccess(user);
  } else {
    console.log('❌ No user authenticated');
  }
});

async function testCollectionAccess(user) {
  const { db } = await import('./src/lib/firebase.js');
  const { collection, doc, getDoc, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  console.log('🧪 Testing collection access...');
  
  // Test 1: Read users collection
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    console.log('✅ users/{userId} read access: SUCCESS');
  } catch (error) {
    console.log('❌ users/{userId} read access: FAILED', error.message);
  }
  
  // Test 2: Test groupChats collection
  try {
    const testData = {
      name: 'Test Group',
      createdBy: user.uid,
      members: [user.uid],
      admins: [user.uid],
      isPrivate: true,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      messageCount: 0
    };
    const docRef = await addDoc(collection(db, 'groupChats'), testData);
    console.log('✅ groupChats create access: SUCCESS', docRef.id);
    
    // Test group message
    const messageData = {
      groupId: docRef.id,
      fromUid: user.uid,
      fromName: user.displayName || 'Test User',
      content: 'Test message',
      type: 'text',
      createdAt: serverTimestamp(),
      reactions: {}
    };
    
    const messageRef = await addDoc(collection(db, 'groupChats', docRef.id, 'messages'), messageData);
    console.log('✅ groupChats/{groupId}/messages create access: SUCCESS', messageRef.id);
    
  } catch (error) {
    console.log('❌ groupChats access: FAILED', error.message);
  }
  
  // Test 3: Test enhancedChats collection
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
    console.log('✅ enhancedChats create access: SUCCESS', chatRef.id);
    
  } catch (error) {
    console.log('❌ enhancedChats access: FAILED', error.message);
  }
  
  // Test 4: Test chats collection (social system)
  try {
    const messageData = {
      senderId: user.uid,
      content: 'Test message',
      type: 'text',
      timestamp: serverTimestamp(),
      participants: { [user.uid]: true },
      readBy: { [user.uid]: serverTimestamp() }
    };
    const chatRef = await addDoc(collection(db, 'chats', 'test_chat_id', 'messages'), messageData);
    console.log('✅ chats/{chatId}/messages create access: SUCCESS', chatRef.id);
    
  } catch (error) {
    console.log('❌ chats/{chatId}/messages access: FAILED', error.message);
  }
  
  // Test 5: Test legacy chat system
  try {
    const messageData = {
      fromUid: user.uid,
      toUid: 'test_user_id',
      text: 'Test message',
      type: 'text',
      createdAt: serverTimestamp(),
      read: false
    };
    const legacyChatRef = await addDoc(collection(db, 'users', user.uid, 'chats', 'test_chat_id', 'messages'), messageData);
    console.log('✅ users/{userId}/chats/{chatId}/messages create access: SUCCESS', legacyChatRef.id);
    
  } catch (error) {
    console.log('❌ users/{userId}/chats/{chatId}/messages access: FAILED', error.message);
  }
}