'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

type Group = { id: string; name: string };
type Post = { id: string; text: string; groupId: string; createdAt?: any };

export default function CommunityPage() {
  const [me, setMe] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>('');
  const [text, setText] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setMe(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!groupId) return setPosts([]);
    const q = query(collection(db, 'groups', groupId, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [groupId]);

  async function createGroup() {
    if (!groupName.trim()) return;
    const doc = await addDoc(collection(db, 'groups'), { name: groupName.trim(), owner: me ?? null, createdAt: serverTimestamp() });
    setGroupName('');
    setGroupId(doc.id);
  }

  async function createPost() {
    if (!groupId || !text.trim()) return;
    await addDoc(collection(db, 'groups', groupId, 'posts'), { text: text.trim(), author: me ?? null, createdAt: serverTimestamp() });
    setText('');
  }

  return (
    <div className="max-w-3xl mx-auto p-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-3">
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Create Group</div>
          <div className="flex gap-2">
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Mindful Mornings" className="flex-1 rounded-md bg-transparent border border-white/20 px-3 py-2" />
            <button onClick={createGroup} className="rounded-md px-4 py-2 bg-white/10">Create</button>
          </div>
        </div>
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Groups</div>
          <div className="space-y-1">
            {groups.map((g) => (
              <button key={g.id} onClick={() => setGroupId(g.id)} className={`block w-full text-left rounded-md px-3 py-2 text-sm ${groupId === g.id ? 'bg-white/15' : 'hover:bg-white/10'}`}>{g.name}</button>
            ))}
            {groups.length === 0 && <div className="text-xs text-gray-400">No groups yet.</div>}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 space-y-3">
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Posts</div>
          {groupId ? (
            <>
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Share something supportive…" className="flex-1 rounded-md bg-transparent border border-white/20 px-3 py-2" />
                <button onClick={createPost} className="rounded-md px-4 py-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black">Post</button>
              </div>
              <div className="space-y-2">
                {posts.map((p) => (
                  <div key={p.id} className="rounded-lg border border-white/10 p-3 text-sm">{p.text}</div>
                ))}
                {posts.length === 0 && <div className="text-xs text-gray-400">No posts yet. Be the first!</div>}
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-400">Select a group to view posts.</div>
          )}
        </div>
      </div>
    </div>
  );
}

