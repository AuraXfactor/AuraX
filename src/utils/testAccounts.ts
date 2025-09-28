import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  updateUserProfile,
  sendFriendRequest,
  createPost
} from '@/lib/socialSystem';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface TestAccountData {
  email: string;
  password: string;
  name: string;
  username: string;
  bio: string;
  interests: string[];
  focusAreas: string[];
}

export const testAccounts: TestAccountData[] = [
  {
    email: 'alice.wellness@test.com',
    password: 'testpass123',
    name: 'Alice Johnson',
    username: 'alice_wellness',
    bio: 'Mental health advocate and mindfulness enthusiast. Sharing my journey to wellness and supporting others along the way. 🧘‍♀️✨',
    interests: ['meditation', 'yoga', 'journaling', 'nature', 'reading', 'mindfulness'],
    focusAreas: ['anxiety', 'self-care', 'mindfulness', 'stress-management']
  },
  {
    email: 'bob.recovery@test.com',
    password: 'testpass123',
    name: 'Bob Martinez',
    username: 'bob_recovery',
    bio: 'Recovery coach and fitness enthusiast. Helping others build resilience through healthy habits and community support. 💪🌟',
    interests: ['fitness', 'nutrition', 'recovery', 'community', 'hiking', 'wellness'],
    focusAreas: ['addiction recovery', 'physical health', 'community building', 'resilience']
  }
];

export async function createTestAccount(accountData: TestAccountData): Promise<User> {
  try {
    // Try to create new account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      accountData.email,
      accountData.password
    );
    
    console.log(`✅ Created new account: ${accountData.name}`);
    return userCredential.user;
    
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error.code === 'auth/email-already-in-use') {
      // Account exists, sign in instead
      const userCredential = await signInWithEmailAndPassword(
        auth,
        accountData.email,
        accountData.password
      );
      
      console.log(`ℹ️  Account already exists, signed in: ${accountData.name}`);
      return userCredential.user;
      
    } else {
      console.error(`❌ Error with account ${accountData.email}:`, error);
      throw error;
    }
  }
}

export async function setupTestAccountProfile(user: User, accountData: TestAccountData): Promise<void> {
  try {
    // Update user profile
    await updateUserProfile(user, {
      name: accountData.name,
      username: accountData.username,
      bio: accountData.bio,
      interests: accountData.interests,
      focusAreas: accountData.focusAreas,
      isPublic: true,
    });
    
    // Also ensure the main user document is set up
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: accountData.email,
      name: accountData.name,
      username: accountData.username,
      bio: accountData.bio,
      interests: accountData.interests,
      focusAreas: accountData.focusAreas,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log(`✅ Profile setup complete for: ${accountData.name}`);
    
  } catch (error) {
    console.error(`❌ Error setting up profile for ${accountData.name}:`, error);
    throw error;
  }
}

export async function createTestPosts(user: User, accountData: TestAccountData): Promise<void> {
  try {
    const posts = accountData.email.includes('alice') ? [
      {
        content: "Just finished my morning meditation session! 🧘‍♀️ Starting the day with gratitude and intention. How do you begin your mornings?",
        type: 'text' as const,
        visibility: 'friends' as const,
        mood: '😌 Peaceful',
        tags: ['meditation', 'morning-routine', 'mindfulness'],
      },
      {
        content: "Sharing a beautiful quote I found today: 'You are not your thoughts, you are the observer of your thoughts.' - Eckhart Tolle\n\nThis really resonates with my anxiety management practice.",
        type: 'text' as const,
        visibility: 'public' as const,
        mood: '💭 Reflective',
        tags: ['quotes', 'anxiety', 'mindfulness'],
      }
    ] : [
      {
        content: "Completed a 5K run today! 🏃‍♂️ Physical activity is such an important part of my recovery journey. Every step forward counts!",
        type: 'achievement' as const,
        visibility: 'public' as const,
        mood: '💪 Energized',
        tags: ['fitness', 'recovery', 'achievement'],
      },
      {
        content: "Grateful for this amazing community! 🙏 Your support means everything on this journey. Together we're stronger!",
        type: 'text' as const,
        visibility: 'friends' as const,
        mood: '❤️ Grateful',
        tags: ['community', 'gratitude', 'support'],
      }
    ];
    
    for (const postData of posts) {
      await createPost({
        user,
        ...postData,
      });
    }
    
    console.log(`✅ Created test posts for: ${accountData.name}`);
    
  } catch (error) {
    console.error(`❌ Error creating posts for ${accountData.name}:`, error);
    throw error;
  }
}

// Helper function to run the full test setup
export async function runTestSetup(): Promise<{ alice: User; bob: User }> {
  console.log('🚀 Starting AuraX Social System Test Setup...\n');
  
  try {
    // Create/sign in test accounts
    const alice = await createTestAccount(testAccounts[0]);
    const bob = await createTestAccount(testAccounts[1]);
    
    // Setup profiles
    await setupTestAccountProfile(alice, testAccounts[0]);
    await setupTestAccountProfile(bob, testAccounts[1]);
    
    // Create test posts
    await createTestPosts(alice, testAccounts[0]);
    await createTestPosts(bob, testAccounts[1]);
    
    console.log('\n✅ Test setup complete!');
    console.log('\n📋 Account Information:');
    console.log(`Alice: ${testAccounts[0].email} / ${testAccounts[0].password}`);
    console.log(`Bob: ${testAccounts[1].email} / ${testAccounts[1].password}`);
    console.log('\nNow test the social features manually! 🎉');
    
    return { alice, bob };
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}

// Function to send friend requests between test accounts
export async function setupTestFriendship(alice: User, bob: User): Promise<void> {
  try {
    console.log('🤝 Setting up test friendship...');
    
    // Alice sends friend request to Bob
    await sendFriendRequest({
      fromUser: alice,
      toUserId: bob.uid,
      message: "Hi Bob! I'd love to connect and support each other on our wellness journeys! 🌟",
    });
    
    console.log('✅ Friend request sent from Alice to Bob');
    console.log('👀 Now sign in as Bob to accept the request!');
    
  } catch (error) {
    console.error('❌ Error setting up friendship:', error);
    throw error;
  }
}