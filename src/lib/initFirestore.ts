// Server-only Firestore initialization helpers for required basic collections
// Collections: posts, journals (per-user), boosts, userBoosts (per-user)
// Uses Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.

import admin from 'firebase-admin';

export type BasicSeedOptions = {
  projectId?: string;
  uid?: string;
};

function ensureAdmin(projectId?: string) {
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

export async function seedBasicCollections(options: BasicSeedOptions = {}): Promise<void> {
  ensureAdmin(options.projectId);
  const db = admin.firestore();

  // 1) boosts (public read only)
  const boosts = [
    { id: 'meditation', title: '5-Min Meditation', points: 10, category: 'mindfulness', duration: 5 },
    { id: 'gratitude', title: 'Gratitude Journal', points: 5, category: 'reflection', duration: 2 },
    { id: 'breathing', title: 'Deep Breathing', points: 3, category: 'calming', duration: 1 },
    { id: 'hydration', title: 'Stay Hydrated', points: 2, category: 'health', duration: 0 },
  ];
  for (const b of boosts) {
    await upsert(db.collection('boosts').doc(b.id), { ...b, createdAt: now() });
  }

  // 2) posts (3-5 sample items)
  const samplePosts = [
    {
      id: 'welcome_post',
      authorId: 'sampleUserA',
      authorName: 'Sample User A',
      content: 'First post! Grateful to start this journey ✨',
      createdAt: now(),
      likeCount: 0,
    },
    {
      id: 'mindful_moment',
      authorId: 'sampleUserB',
      authorName: 'Sample User B',
      content: 'Took a mindful walk today. Feeling calm. 😌',
      createdAt: now(),
      likeCount: 0,
    },
    {
      id: 'hydration_check',
      authorId: 'sampleUserA',
      authorName: 'Sample User A',
      content: 'Water break! 💧 Stay hydrated.',
      createdAt: now(),
      likeCount: 0,
    },
  ];
  for (const p of samplePosts) {
    await upsert(db.collection('posts').doc(p.id), p);
  }

  // Determine user to attach per-user data to
  let targetUid = options.uid;
  if (!targetUid) {
    const one = await db.collection('users').limit(1).get();
    targetUid = one.docs[0]?.id || 'sampleUserA';
  }

  // 3) journals (user-specific at /journals/{userId}/{entryId})
  const journalsCol = db.collection('journals').doc(targetUid).collection(targetUid);
  await upsert(journalsCol.doc('entry_welcome'), {
    entryText: 'Today I begin my mindful journey. 🌱',
    moodTag: 'calm',
    createdAt: now(),
  });
  await upsert(journalsCol.doc('entry_gratitude'), {
    entryText: 'Grateful for supportive friends and good health.',
    moodTag: 'grateful',
    createdAt: now(),
  });

  // 4) userBoosts (per-user at /userBoosts/{userId}/{entryId})
  const userBoostsCol = db.collection('userBoosts').doc(targetUid).collection(targetUid);
  await upsert(userBoostsCol.doc('meditation_first'), {
    boostId: 'meditation',
    completedAt: now(),
    duration: 5,
    pointsEarned: 10,
  });
  await upsert(userBoostsCol.doc('hydration_ping'), {
    boostId: 'hydration',
    completedAt: now(),
    duration: 0,
    pointsEarned: 2,
  });
}

