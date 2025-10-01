'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import QRCode from 'qrcode';

interface UserProfile {
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  focusAreas?: string[];
  preferredTherapy?: string;
  reminderTime?: string;
  moodBaseline?: string[];
  auraPoints?: number;
  auraTotal?: number;
  createdAt?: { toDate?: () => Date } | null;
  lastLogin?: { toDate?: () => Date } | null;
}

const focusOptions = [
  'Stress Relief',
  'Addiction Recovery',
  'Better Sleep',
  'Productivity & Focus',
  'Relationships & Connection',
  'Self-Love & Confidence',
];

const therapyOptions = ['Chat', 'Phone Call', 'WhatsApp', 'Video Call'];

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = profile.avatar;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
        
        // Update Firebase Auth profile
        await updateProfile(user, {
          photoURL: avatarUrl,
          displayName: profile.name || user.displayName
        });
      }

      // Update Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        ...profile,
        avatar: avatarUrl,
        updatedAt: serverTimestamp(),
      });

      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      await loadProfile();
      
      alert('Profile saved successfully! 🎉');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const generateQRCode = async () => {
    if (!user) return;
    
    try {
      // Generate QR code with profile sharing URL
      const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/friends/add/${user.uid}` : `/friends/add/${user.uid}`;
      const qrDataUrl = await QRCode.toDataURL(profileUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#7c3aed', // Purple color
          light: '#ffffff'
        }
      });
      
      setQRCodeUrl(qrDataUrl);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    }
  };

  const shareProfile = async () => {
    if (!user) return;
    
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/friends/add/${user.uid}` : `/friends/add/${user.uid}`;
    const shareText = `Join me on AuraX - Your wellness companion! 🌟`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on AuraX',
          text: shareText,
          url: profileUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
        alert('Profile link copied to clipboard! 📋');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('Share link: ' + profileUrl);
      }
    }
  };

  const toggleFocusArea = (area: string) => {
    const current = profile.focusAreas || [];
    if (current.includes(area)) {
      setProfile({
        ...profile,
        focusAreas: current.filter((a: string) => a !== area)
      });
    } else if (current.length < 3) {
      setProfile({
        ...profile,
        focusAreas: [...current, area]
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                  {avatarPreview || profile.avatar ? (
                    <img 
                      src={avatarPreview || profile.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                {editing && (
                  <label className="absolute -bottom-2 -right-2 bg-white text-gray-700 rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    📷
                  </label>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name || user?.displayName || 'Anonymous'}</h2>
                <p className="text-white/80">@{profile.username || 'username'}</p>
                <p className="text-white/60">{profile.email || user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    ✨ {profile.auraTotal || profile.auraPoints || 0} Aura Points
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!editing ? (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                      Edit Profile
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={shareProfile}
                        className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition text-sm"
                        title="Share Profile"
                      >
                        📤 Share
                      </button>
                      <button
                        onClick={generateQRCode}
                        className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition text-sm"
                        title="QR Code"
                      >
                        📱 QR
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        loadProfile();
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-white text-purple-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 font-semibold"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {profile.name || 'Not set'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.username || ''}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      @{profile.username || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Focus Areas (max 3)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {focusOptions.map((area) => (
                  <button
                    key={area}
                    onClick={() => editing && toggleFocusArea(area)}
                    disabled={!editing}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                      (profile.focusAreas || []).includes(area)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!editing && 'cursor-default opacity-60'}`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Therapy Style</label>
                  {editing ? (
                    <select
                      value={profile.preferredTherapy || ''}
                      onChange={(e) => setProfile({ ...profile, preferredTherapy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select style</option>
                      {therapyOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {profile.preferredTherapy || 'Not set'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reminder Time</label>
                  {editing ? (
                    <select
                      value={profile.reminderTime || ''}
                      onChange={(e) => setProfile({ ...profile, reminderTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select time</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                    </select>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {profile.reminderTime || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mood Baseline */}
            {profile.moodBaseline && profile.moodBaseline.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Mood Baseline</h3>
                <div className="flex gap-2">
                  {profile.moodBaseline.map((emoji, index) => (
                    <span key={index} className="text-2xl p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Account Info */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {profile.email || user?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Member Since</label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {profile.createdAt?.toDate ? 
                      profile.createdAt.toDate().toLocaleDateString() : 
                      'Recently joined'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Share Your Profile</h2>
                
                {qrCodeUrl && (
                  <div className="mb-6">
                    <img src={qrCodeUrl} alt="Profile QR Code" className="w-64 h-64 mx-auto rounded-2xl" />
                  </div>
                )}
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Friends can scan this QR code to connect with you on AuraX!
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQRCode(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={shareProfile}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
                  >
                    Share Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}