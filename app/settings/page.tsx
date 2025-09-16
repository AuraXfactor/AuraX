'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SettingsPage() {
  const [me, setMe] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('friends');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setMe(u?.uid ?? null);
      if (!u) return;
      const ref = doc(db, 'users', u.uid);
      const snap = await getDoc(ref);
      const data = snap.data() as any;
      setDisplayName(data?.displayName ?? '');
      setPrivacy((data?.privacy as any) ?? 'friends');
    });
    return () => unsub();
  }, []);

  async function save() {
    if (!me) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', me);
      await setDoc(ref, { displayName, privacy, updatedAt: serverTimestamp() }, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Profile</div>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="w-full rounded-md bg-transparent border border-white/20 px-3 py-2" />
      </div>
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Privacy</div>
        <select value={privacy} onChange={(e) => setPrivacy(e.target.value as any)} className="w-full rounded-md bg-black/20 border border-white/20 px-3 py-2">
          <option value="public">Public</option>
          <option value="friends">Friends only</option>
          <option value="private">Private</option>
        </select>
      </div>
      <button onClick={save} disabled={saving} className="rounded-md px-4 py-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black font-semibold">{saving ? 'Saving…' : 'Save Settings'}</button>
    </div>
  );
}

