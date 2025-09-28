import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  initializeFirestore,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDEZFb364IcgkpY2GavElR3QPhqpw60BRs",
  authDomain: "aura-app-prod-4dc34.firebaseapp.com",
  projectId: "aura-app-prod-4dc34",
  storageBucket: "aura-app-prod-4dc34.firebasestorage.app",
  messagingSenderId: "978006775981",
  appId: "1:978006775981:web:0c97e9e4fd1d27c58fce24"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {});

interface TestUser {
  email: string;
  password: string;
  name: string;
  username: string;
  bio: string;
  interests: string[];
  focusAreas: string[];
}

const testUsers: TestUser[] = [
  {
    email: 'alice.wellness@test.com',
    password: 'testpass123',
    name: 'Alice Johnson',
    username: 'alice_wellness',
    bio: 'Mental health advocate and mindfulness enthusiast. Sharing my journey to wellness and supporting others along the way.',
    interests: ['meditation', 'yoga', 'journaling', 'nature', 'reading'],
    focusAreas: ['anxiety', 'self-care', 'mindfulness']
  },
  {
    email: 'bob.recovery@test.com',
    password: 'testpass123',
    name: 'Bob Martinez',
    username: 'bob_recovery',
    bio: 'Recovery coach and fitness enthusiast. Helping others build resilience through healthy habits and community support.',
    interests: ['fitness', 'nutrition', 'recovery', 'community', 'hiking'],
    focusAreas: ['addiction recovery', 'physical health', 'community building']
  }
];

async function createTestUser(userData: TestUser) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    const user = userCredential.user;
    
    const batch = writeBatch(db);
    
    // Create user profile
    const userRef = doc(db, 'users', user.uid);
    batch.set(userRef, {
      email: userData.email,
      name: userData.name,
      username: userData.username,
      bio: userData.bio,
      interests: userData.interests,
      focusAreas: userData.focusAreas,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Create public profile
    const publicProfileRef = doc(db, 'publicProfiles', user.uid);
    batch.set(publicProfileRef, {
      userId: user.uid,
      name: userData.name,
      username: userData.username,
      bio: userData.bio,
      interests: userData.interests,
      focusAreas: userData.focusAreas,
      isOnline: true,
      lastSeen: serverTimestamp(),
      friendsCount: 0,
      postsCount: 0,
      joinedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    console.log(`✅ Created user: ${userData.name} (${user.uid})`);
    return user.uid;
    
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️  User already exists: ${userData.email}`);
      // Sign in to get the uid
      const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
      return userCredential.user.uid;
    } else {
      console.error(`❌ Error creating user ${userData.email}:`, error);
      throw error;
    }
  }
}

async function createFriendship(uid1: string, uid2: string) {
  try {
    console.log(`Creating friendship between ${uid1} and ${uid2}`);
    
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    // Create bidirectional friendship
    const friendship1Ref = doc(db, 'friends', uid1, uid2);
    batch.set(friendship1Ref, {
      userId: uid1,
      friendId: uid2,
      friendSince: timestamp,
      lastInteraction: timestamp,
    });
    
    const friendship2Ref = doc(db, 'friends', uid2, uid1);
    batch.set(friendship2Ref, {
      userId: uid2,
      friendId: uid1,
      friendSince: timestamp,
      lastInteraction: timestamp,
    });
    
    await batch.commit();
    console.log('✅ Friendship created');
    
  } catch (error) {
    console.error('❌ Error creating friendship:', error);
    throw error;
  }
}

async function createTestPosts(userIds: string[]) {
  try {
    console.log('Creating test posts...');
    
    const batch = writeBatch(db);
    
    const posts = [
      {
        authorId: userIds[0],
        content: "Just finished my morning meditation session! 🧘‍♀️ Starting the day with gratitude and intention. How do you begin your mornings?",
        type: 'text',
        visibility: 'friends',
        mood: '😌 Peaceful',
        tags: ['meditation', 'morning-routine', 'mindfulness'],
      },
      {
        authorId: userIds[1],
        content: "Completed a 5K run today! 🏃‍♂️ Physical activity is such an important part of my recovery journey. Every step forward counts!",
        type: 'achievement',
        visibility: 'public',
        mood: '💪 Energized',
        tags: ['fitness', 'recovery', 'achievement'],
      },
      {
        authorId: userIds[0],
        content: "Sharing a beautiful quote I found today: 'You are not your thoughts, you are the observer of your thoughts.' - Eckhart Tolle\n\nThis really resonates with my anxiety management practice.",
        type: 'text',
        visibility: 'friends',
        mood: '💭 Reflective',
        tags: ['quotes', 'anxiety', 'mindfulness'],
      },
      {
        authorId: userIds[1],
        content: "Grateful for this amazing community! 🙏 Your support means everything on this journey. Together we're stronger!",
        type: 'text',
        visibility: 'public',
        mood: '❤️ Grateful',
        tags: ['community', 'gratitude', 'support'],
      }
    ];
    
    for (const postData of posts) {
      const postRef = doc(db, 'posts');
      batch.set(postRef, {
        ...postData,
        createdAt: serverTimestamp(),
        likes: [],
        comments: 0,
        shares: 0,
      });
    }
    
    await batch.commit();
    console.log('✅ Test posts created');
    
  } catch (error) {
    console.error('❌ Error creating test posts:', error);
    throw error;
  }
}

async function createTestGroup(ownerUid: string, memberUids: string[]) {
  try {
    console.log('Creating test group...');
    
    const members: { [key: string]: boolean } = {};
    [ownerUid, ...memberUids].forEach(uid => {
      members[uid] = true;
    });
    
    const groupRef = doc(db, 'groups');
    await setDoc(groupRef, {
      name: 'Wellness Warriors',
      description: 'A supportive community for people on their wellness journey. Share experiences, tips, and encouragement!',
      ownerId: ownerUid,
      isPublic: true,
      members,
      admins: { [ownerUid]: true },
      createdAt: serverTimestamp(),
      memberCount: Object.keys(members).length,
      tags: ['wellness', 'support', 'community', 'mental-health'],
      lastActivity: serverTimestamp(),
    });
    
    console.log('✅ Test group created');
    
  } catch (error) {
    console.error('❌ Error creating test group:', error);
    throw error;
  }
}

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data for AuraX social system...\n');
    
    // Create test users
    const userIds: string[] = [];
    for (const userData of testUsers) {
      const uid = await createTestUser(userData);
      userIds.push(uid);
    }
    
    console.log('\n📝 User IDs created:', userIds);
    
    // Create friendship between users
    if (userIds.length >= 2) {
      await createFriendship(userIds[0], userIds[1]);
    }
    
    // Create test posts
    await createTestPosts(userIds);
    
    // Create test group
    if (userIds.length >= 2) {
      await createTestGroup(userIds[0], [userIds[1]]);
    }
    
    console.log('\n✅ Test data setup complete!');
    console.log('\n📋 Test Account Credentials:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   UID: ${userIds[index]}\n`);
    });
    
    console.log('🎉 You can now test the social features with these accounts!');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  }
}

// Run the setup
setupTestData();