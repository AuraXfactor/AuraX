/*
  Firestore seeding script (Admin SDK)
  - Idempotent upserts for required collections/subcollections used by the app
  - Supports optional --uid to seed per-user subcollections
  Usage:
    GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npx ts-node scripts/seed-firestore.ts --project aura-app-prod-4dc34 --uid <someUserUid>
*/

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

type Args = {
  project?: string;
  uid?: string;
};

function parseArgs(): Args {
  const args: Args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--project' && process.argv[i + 1]) {
      args.project = process.argv[++i];
    } else if (arg === '--uid' && process.argv[i + 1]) {
      args.uid = process.argv[++i];
    }
  }
  return args;
}

function ensureAdminInitialized(projectId?: string) {
  if (admin.apps.length) return;
  const credential = admin.credential.applicationDefault();
  admin.initializeApp({ credential, projectId });
}

function now() {
  return admin.firestore.FieldValue.serverTimestamp();
}

async function upsert(docRef: admin.firestore.DocumentReference, data: Record<string, unknown>) {
  await docRef.set(data, { merge: true });
}

async function ensureTopLevelCollections(db: admin.firestore.Firestore) {
  // auraPosts: create a sample post with reaction + reply subcollections
  const auraPostRef = db.collection('auraPosts').doc('sample_post');
  await upsert(auraPostRef, {
    authorUid: 'sampleUserA',
    authorName: 'Sample User A',
    content: 'First Aura! ✨',
    type: 'text',
    isEphemeral: true,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    createdAt: now(),
    viewCount: 0,
    likeCount: 0,
    replyCount: 0,
    visibility: 'friends',
  });
  await upsert(auraPostRef.collection('reactions').doc('sample'), {
    postId: 'sample_post',
    userUid: 'sampleUserB',
    userName: 'Sample User B',
    type: 'like',
    emoji: '❤️',
    createdAt: now(),
  });
  await upsert(auraPostRef.collection('replies').doc('sample'), {
    postId: 'sample_post',
    userUid: 'sampleUserB',
    userName: 'Sample User B',
    content: 'Proud of you! 🙌',
    isPrivate: false,
    createdAt: now(),
  });

  // groupChats + messages
  const groupRef = db.collection('groupChats').doc('sample_group');
  await upsert(groupRef, {
    name: 'Support Circle',
    description: 'A safe space for support',
    createdBy: 'sampleUserA',
    members: ['sampleUserA', 'sampleUserB'],
    admins: ['sampleUserA'],
    isPrivate: true,
    createdAt: now(),
    lastActivity: now(),
    messageCount: [],
  });
  const msgRef = groupRef.collection('messages').doc('welcome');
  await upsert(msgRef, {
    groupId: 'sample_group',
    fromUid: 'sampleUserA',
    fromName: 'Sample User A',
    content: 'Welcome to the group! 🌟',
    type: 'text',
    createdAt: now(),
    reactions: {},
  });

  // weeklyQuests
  const questRef = db.collection('weeklyQuests').doc('mindful_week');
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  await upsert(questRef, {
    title: 'Mindful Week',
    description: 'Complete 5 meditation sessions this week',
    requirement: { type: 'count', target: 5, activities: ['meditation_complete'] },
    reward: { points: 75, badge: 'zen_master' },
    duration: {
      startDate: admin.firestore.Timestamp.fromDate(start),
      endDate: admin.firestore.Timestamp.fromDate(end),
    },
    participants: [],
    completions: [],
    difficulty: 'medium',
    isActive: true,
    category: 'mindfulness',
  });

  // rewards (store)
  const rewardsCol = db.collection('rewards');
  const defaultRewards = [
    {
      id: 'mindful_master_badge',
      title: 'Mindful Master Badge',
      description: 'Show off your meditation dedication',
      cost: 500,
      category: 'badge',
      type: 'digital',
      phase: 1,
      rarity: 'rare',
      metadata: { badgeIcon: '🧘‍♀️' },
      isActive: true,
      claimed: 0,
      createdAt: now(),
    },
    {
      id: 'ocean_breeze_theme',
      title: 'Ocean Breeze Theme',
      description: 'Calming blue tones for peace of mind',
      cost: 800,
      category: 'theme',
      type: 'digital',
      phase: 1,
      rarity: 'rare',
      metadata: { themeId: 'ocean_breeze' },
      isActive: true,
      claimed: 0,
      createdAt: now(),
    },
  ];
  for (const r of defaultRewards) {
    await upsert(rewardsCol.doc(r.id), r);
  }

  // auraSquads
  const squadRef = db.collection('auraSquads').doc('sample_squad');
  await upsert(squadRef, {
    name: 'Morning Meditators',
    description: 'We meditate together daily',
    members: ['sampleUserA', 'sampleUserB'],
    admins: ['sampleUserA'],
    totalPoints: 0,
    achievements: [],
    level: 1,
    isPrivate: false,
    createdAt: now(),
    lastActivity: now(),
    currentChallenge: null,
  });
}

async function ensurePerUserData(db: admin.firestore.Firestore, uid: string) {
  const userRef = db.collection('users').doc(uid);
  await upsert(userRef, {
    uid,
    email: `${uid}@example.com`,
    name: `User ${uid.slice(0, 6)}`,
    username: `user_${uid.slice(0, 6)}`,
    focusAreas: ['mindfulness', 'fitness'],
    auraPoints: 0,
    createdAt: now(),
    lastLogin: now(),
  });

  // friends and friendRequests subcollections
  await upsert(userRef.collection('friends').doc('sampleFriend'), {
    userUid: uid,
    friendUid: 'sampleUserB',
    friendName: 'Sample User B',
    createdAt: now(),
    lastInteraction: now(),
  });
  await upsert(userRef.collection('friendRequests').doc('incoming_sample'), {
    fromUid: 'sampleUserB',
    toUid: uid,
    fromUserName: 'Sample User B',
    toUserName: `User ${uid.slice(0, 6)}`,
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  });

  // chats/{chatId}/messages and chatMeta
  const other = 'sampleUserB';
  const chatId = [uid, other].sort().join('_');
  const userChatRef = userRef.collection('chats').doc(chatId);
  await upsert(userChatRef, { createdAt: now() });
  await upsert(userChatRef.collection('messages').doc('hello'), {
    fromUid: uid,
    toUid: other,
    text: 'Hey there! 👋',
    type: 'text',
    createdAt: now(),
    read: false,
  });
  await upsert(userRef.collection('chatMeta').doc(chatId), {
    chatId,
    otherUid: other,
    lastMessage: 'Hey there! 👋',
    lastAt: now(),
    unreadCount: 0,
  });
  await upsert(userRef.collection('chats').doc(chatId).collection('typing').doc(other), {
    typing: false,
    at: now(),
  });

  // journalEntries and journalCollections
  await upsert(userRef.collection('journalEntries').doc('welcome'), {
    date: now(),
    mood: 'content',
    selfCareActivities: ['breathing'],
    affirmation: 'I am present.',
    notes: 'First entry saved from seed script',
    auraPoints: 0,
    source: 'seed',
    createdAt: now(),
  });
  await upsert(userRef.collection('journalCollections').doc('daily'), {
    name: 'Daily Journal',
    description: 'Your everyday reflections',
    entryCount: 1,
    createdAt: now(),
    updatedAt: now(),
  });

  // questProgress
  await upsert(userRef.collection('questProgress').doc('mindful_week'), {
    questId: 'mindful_week',
    userUid: uid,
    enrolled: true,
    progress: 0,
    completed: false,
    activities: {},
    enrolledAt: now(),
  });

  // auraStats + pointTransactions
  await upsert(userRef.collection('auraStats').doc('main'), {
    totalPoints: 0,
    availablePoints: 500,
    lifetimeEarned: 500,
    lifetimeSpent: 0,
    badges: [],
    achievements: [],
    joinedSquads: [],
    createdAt: now(),
    updatedAt: now(),
  });
  await upsert(userRef.collection('pointTransactions').doc('welcome_bonus'), {
    type: 'first_time_bonus',
    points: 500,
    description: 'Welcome bonus',
    createdAt: now(),
  });

  // purchases (rewards store history)
  await upsert(userRef.collection('purchases').doc('example_purchase'), {
    userUid: uid,
    rewardId: 'mindful_master_badge',
    rewardTitle: 'Mindful Master Badge',
    pointsCost: 500,
    type: 'badge',
    status: 'claimed',
    claimedAt: now(),
  });
}

async function main() {
  const { project, uid } = parseArgs();
  ensureAdminInitialized(project);
  const db = admin.firestore();

  console.log('Seeding Firestore...');
  await ensureTopLevelCollections(db);

  // If a uid is passed, seed subcollections for that user specifically
  if (uid) {
    await ensurePerUserData(db, uid);
  } else {
    // Try to find an existing user to attach per-user data to; otherwise use a mock uid
    const usersSnap = await db.collection('users').limit(1).get();
    const targetUid = usersSnap.docs[0]?.id || 'sampleUserA';
    await ensurePerUserData(db, targetUid);
  }

  console.log('Seeding complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

