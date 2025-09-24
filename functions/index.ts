// Minimal Cloud Functions scaffolding (Node 18) - ESM style imports for repo type-check
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Aura Coach proxy: moderation + AI call + log
export const auraCoach = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  try {
    const { toUid, lastUserInput, aiPersonality = 'calm' } = req.body || {};
    const authUid = req.headers['x-auth-uid'] || null;
    if (!authUid) return res.status(401).json({ error: 'unauthorized' });

    // Optional moderation call placeholder
    const flagged = false; // replace with provider moderation
    let suggestion = '';

    if (flagged) {
      suggestion = 'I care about your safety. Would you like help connecting to support or a hotline? You are not alone.';
      await db.collection('users').doc(String(authUid)).collection('safetyFlags').add({
        urgentFlag: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'moderation_flag',
      });
    } else {
      // Placeholder AI response (replace with OpenAI/Vertex call)
      suggestion = 'That sounds heavy. Would a short 1-minute grounding exercise help? We can breathe together: inhale 4, hold 4, exhale 6.';
    }

    await db.collection('users').doc(String(authUid)).collection('aiChatLogs').add({
      userMessage: lastUserInput || '',
      aiResponse: suggestion,
      aiPersonality,
      contextTags: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('analytics').doc('chatStats').collection(new Date().toISOString().slice(0,10)).doc('meta').set({
      totalAiRequests: admin.firestore.FieldValue.increment(1),
    }, { merge: true });

    res.status(200).json({ suggestion, flagged });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Export all user data as JSON and upload to Storage under /exports/{uid}/{exportId}.json
export const exportUserData = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  try {
    const authUid = String(req.headers['x-auth-uid'] || '');
    if (!authUid) return res.status(401).json({ error: 'unauthorized' });

    const userRef = db.collection('users').doc(authUid);
    const [userSnap, journalsSnap, remindersSnap, exportsSnap] = await Promise.all([
      userRef.get(),
      userRef.collection('journals').get(),
      userRef.collection('reminders').get(),
      userRef.collection('exports').get(),
    ]);

    const exportPayload: Record<string, unknown> = {
      user: authUid,
      exportedAt: new Date().toISOString(),
      profile: userSnap.exists ? userSnap.data() : null,
      journals: [] as Array<unknown>,
      reminders: remindersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      exportsMeta: exportsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    for (const j of journalsSnap.docs) {
      const entriesSnap = await j.ref.collection('entries').get();
      (exportPayload.journals as Array<unknown>).push({
        journalId: j.id,
        meta: j.data(),
        entries: entriesSnap.docs.map((e) => ({ id: e.id, ...e.data() })),
      });
    }

    const exportId = `${Date.now()}`;
    const filePath = `exports/${authUid}/${exportId}.json`;
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    await file.save(JSON.stringify(exportPayload, null, 2), {
      contentType: 'application/json; charset=utf-8',
      resumable: false,
    });
    // Signed URL valid for 7 days
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    // Record export job metadata under user subtree (visible only to user)
    await userRef.collection('exports').doc(exportId).set({
      ownerId: authUid,
      filePath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ exportId, url: signedUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Delete all user data from Firestore user subtree and Storage exports folder
export const deleteUserData = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  try {
    const authUid = String(req.headers['x-auth-uid'] || '');
    if (!authUid) return res.status(401).json({ error: 'unauthorized' });

    const userRef = db.collection('users').doc(authUid);

    // Helper to batch delete a collection
    async function deleteCollection(ref: FirebaseFirestore.CollectionReference, batchSize = 250) {
      let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let q = ref.orderBy('__name__').limit(batchSize);
        if (lastDoc) q = q.startAfter(lastDoc);
        const snap = await q.get();
        if (snap.empty) break;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        lastDoc = snap.docs[snap.docs.length - 1];
      }
    }

    // Delete journals and their entries
    const journalsSnap = await userRef.collection('journals').get();
    for (const j of journalsSnap.docs) {
      await deleteCollection(j.ref.collection('entries'));
      await j.ref.delete();
    }

    // Delete reminders, exports meta, and any other direct subcollections we know
    await Promise.all([
      deleteCollection(userRef.collection('reminders')),
      deleteCollection(userRef.collection('exports')),
      deleteCollection(userRef.collection('aiChatLogs')),
      deleteCollection(userRef.collection('safetyFlags')),
    ]);

    // Finally delete the user doc
    await userRef.delete();

    // Delete Storage files under exports/{uid}/
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: `exports/${authUid}/` });
    await Promise.all(files.map((f) => f.delete().catch(() => undefined)));

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

