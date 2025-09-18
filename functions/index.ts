// Minimal Cloud Functions scaffolding (Node 18)
import functions = require('firebase-functions');
import admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

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

