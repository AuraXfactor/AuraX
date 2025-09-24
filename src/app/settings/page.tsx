'use client';
import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, userHasPasswordProvider } from '@/lib/firebaseAuth';

type Theme = 'system' | 'light' | 'dark';
type ProfileForm = { name: string; username: string; email: string; avatar: string };

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const canChangePassword = useMemo(() => userHasPasswordProvider(user), [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.exists() ? snap.data() : null;
      setProfile({
        name: String(data?.name ?? ''),
        username: String(data?.username ?? ''),
        email: String(data?.email ?? user.email ?? ''),
        avatar: String(data?.avatar ?? ''),
      });
      const storedTheme = (typeof window !== 'undefined' && localStorage.getItem('theme')) as Theme | null;
      if (storedTheme) applyTheme(storedTheme);
    })();
  }, [user]);

  function applyTheme(next: Theme) {
    setTheme(next);
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }

  async function saveProfile() {
    if (!user || !profile) return;
    try {
      setSaving(true);
      await setDoc(doc(db, 'users', user.uid), {
        name: profile.name,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
      }, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);
    const form = ev.currentTarget as HTMLFormElement & { currentPassword: HTMLInputElement; newPassword: HTMLInputElement };
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    try {
      setPwdLoading(true);
      await changePassword(currentPassword, newPassword);
      setPwdSuccess('Password updated');
      form.reset();
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  }

  const canUsePasskey = typeof window !== 'undefined' && !!(window.PublicKeyCredential && window.isSecureContext);

  if (!user) return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 opacity-80">Please log in to manage your profile.</p>
    </main>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <section className="mt-6 p-4 rounded-xl border border-white/20 bg-white/50 dark:bg-black/20">
        <h2 className="font-semibold">Profile</h2>
        {profile && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Name</span>
              <input className="px-3 py-2 rounded-md border border-white/20 bg-transparent" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Username</span>
              <input className="px-3 py-2 rounded-md border border-white/20 bg-transparent" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Email</span>
              <input className="px-3 py-2 rounded-md border border-white/20 bg-transparent" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Avatar URL</span>
              <input className="px-3 py-2 rounded-md border border-white/20 bg-transparent" value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} />
            </label>
          </div>
        )}
        <div className="mt-3">
          <button onClick={saveProfile} disabled={saving} className="px-3 py-1.5 rounded-full bg-blue-600 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Profile'}</button>
        </div>
      </section>

      {/* Password */}
      {canChangePassword && (
        <section className="mt-6 p-4 rounded-xl border border-white/20 bg-white/50 dark:bg-black/20">
          <h2 className="font-semibold">Password</h2>
          <form className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleChangePassword}>
            <input name="currentPassword" type="password" placeholder="Current password" className="px-3 py-2 rounded-md border border-white/20 bg-transparent" required />
            <input name="newPassword" type="password" placeholder="New password" className="px-3 py-2 rounded-md border border-white/20 bg-transparent" required />
            <button type="submit" disabled={pwdLoading} className="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50">{pwdLoading ? 'Updating…' : 'Update'}</button>
          </form>
          {pwdError && <p className="mt-2 text-red-600 text-sm">{pwdError}</p>}
          {pwdSuccess && <p className="mt-2 text-emerald-600 text-sm">{pwdSuccess}</p>}
        </section>
      )}

      {/* Biometrics / Passkey */}
      <section className="mt-6 p-4 rounded-xl border border-white/20 bg-white/50 dark:bg-black/20">
        <h2 className="font-semibold">Biometrics / Passkey</h2>
        <p className="mt-2 text-sm opacity-80">{canUsePasskey ? 'Your device supports Passkeys. Link your account to device security for quick sign-in.' : 'Passkeys not supported on this device or context.'}</p>
        <div className="mt-3 flex gap-2">
          <button disabled={!canUsePasskey} className="px-3 py-1.5 rounded-full border border-white/20 disabled:opacity-50">Set up (coming soon)</button>
        </div>
      </section>

      {/* Theme */}
      <section className="mt-6 p-4 rounded-xl border border-white/20 bg-white/50 dark:bg-black/20">
        <h2 className="font-semibold">Theme</h2>
        <div className="mt-3 flex gap-2">
          <button onClick={() => applyTheme('system')} className={`px-3 py-1.5 rounded-full border ${theme === 'system' ? 'bg-blue-600 text-white' : ''}`}>System</button>
          <button onClick={() => applyTheme('light')} className={`px-3 py-1.5 rounded-full border ${theme === 'light' ? 'bg-blue-600 text-white' : ''}`}>Light</button>
          <button onClick={() => applyTheme('dark')} className={`px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-blue-600 text-white' : ''}`}>Dark</button>
        </div>
      </section>
    </main>
  );
}

