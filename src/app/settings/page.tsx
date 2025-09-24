'use client';
import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [settingUpPasskey, setSettingUpPasskey] = useState(false);
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
      const defaultTheme = storedTheme || 'system';
      applyTheme(defaultTheme);
    })();
  }, [user]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    
    handleChange(); // Apply initial state
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  function applyTheme(next: Theme) {
    setTheme(next);
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    
    if (next === 'dark') {
      root.classList.add('dark');
    } else if (next === 'light') {
      root.classList.remove('dark');
    } else if (next === 'system') {
      // Apply system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
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

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    try {
      setAvatarUploading(true);
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setProfile({ ...profile, avatar: downloadURL });
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function exportUserData() {
    if (!user) return;
    try {
      setExportingData(true);
      
      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Get journal entries
      const journalSnapshot = await getDocs(collection(db, 'journals', user.uid, 'entries'));
      const journalEntries = journalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const exportData = {
        user: userData,
        journals: journalEntries,
        exportDate: new Date().toISOString(),
      };
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurax-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Data export failed:', error);
    } finally {
      setExportingData(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    
    const confirmation = window.confirm(
      'Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your data.'
    );
    
    if (!confirmation) return;
    
    try {
      setDeletingAccount(true);
      await deleteUser(user);
      // User will be automatically signed out and redirected
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert('Failed to delete account. You may need to sign in again first.');
    } finally {
      setDeletingAccount(false);
    }
  }

  async function setupPasskey() {
    if (!canUsePasskey || !user) return;
    
    try {
      setSettingUpPasskey(true);
      
      // Generate a challenge (in production, this should come from your server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "AuraX",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user.uid),
            name: user.email || 'user',
            displayName: profile?.name || user.email || 'AuraX User',
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "direct"
        },
      });
      
      if (credential) {
        // In production, you'd send this to your server to store
        console.log('Passkey created successfully', credential);
        alert('Passkey set up successfully! (Note: Full implementation requires server setup)');
      }
    } catch (error) {
      console.error('Passkey setup failed:', error);
      alert('Passkey setup failed. Your device may not support this feature.');
    } finally {
      setSettingUpPasskey(false);
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
          <>
            {/* Avatar Section */}
            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {profile.name.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-full bg-gray-600 text-white text-sm hover:bg-gray-700 transition disabled:opacity-50">
                  {avatarUploading ? 'Uploading...' : 'Upload Avatar'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="hidden" 
                  />
                </label>
                <p className="text-xs opacity-60">JPG, PNG up to 5MB</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <span className="text-sm opacity-80">Avatar URL (optional)</span>
                <input className="px-3 py-2 rounded-md border border-white/20 bg-transparent" placeholder="Or upload image above" value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} />
              </label>
            </div>
          </>
        )}
        <div className="mt-4">
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
        <p className="mt-2 text-sm opacity-80">
          {canUsePasskey 
            ? 'Your device supports Passkeys. Use your device\'s biometric security (fingerprint, face recognition) for quick sign-in.' 
            : 'Passkeys not supported on this device or require HTTPS connection.'
          }
        </p>
        <div className="mt-3 flex gap-2">
          <button 
            onClick={setupPasskey}
            disabled={!canUsePasskey || settingUpPasskey}
            className="px-3 py-1.5 rounded-full bg-purple-600 text-white disabled:opacity-50 disabled:bg-gray-400"
          >
            {settingUpPasskey ? 'Setting up...' : 'Set up Passkey'}
          </button>
          {canUsePasskey && (
            <span className="px-3 py-1.5 text-sm opacity-70">🔐 Device secure authentication</span>
          )}
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

      {/* Privacy & Data */}
      <section className="mt-6 p-4 rounded-xl border border-white/20 bg-white/50 dark:bg-black/20">
        <h2 className="font-semibold">Privacy & Data</h2>
        <p className="mt-2 text-sm opacity-80">Manage your data and privacy preferences.</p>
        
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Export Your Data</h3>
              <p className="text-sm opacity-70">Download all your personal data including journal entries and profile information.</p>
            </div>
            <button 
              onClick={exportUserData}
              disabled={exportingData}
              className="px-3 py-1.5 rounded-full bg-green-600 text-white disabled:opacity-50"
            >
              {exportingData ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <h3 className="font-medium text-red-600">Delete Account</h3>
              <p className="text-sm opacity-70">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button 
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="px-3 py-1.5 rounded-full bg-red-600 text-white disabled:opacity-50"
            >
              {deletingAccount ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

