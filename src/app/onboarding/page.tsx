'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { saveOnboardingProfile } from '@/lib/userProfile';
import { motion, AnimatePresence } from 'framer-motion';

const focusOptions = [
  'Stress Relief',
  'Addiction Recovery',
  'Better Sleep',
  'Productivity & Focus',
  'Relationships & Connection',
  'Self-Love & Confidence',
];

const therapyOptions = ['Chat', 'Phone Call', 'WhatsApp', 'Video Call'];

const defaultAvatars = [
  '🌟', '✨', '🎭', '🦋', '🌺', '🎨', '🌈', '🦄', '🌸', '💫', '🎪', '🎯'
];

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [moodBaseline, setMoodBaseline] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [preferredTherapy, setPreferredTherapy] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState<'Morning'|'Afternoon'|'Evening'>('Morning');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const steps = useMemo(() => [
    'Profile',
    'Mood Baseline',
    'Focus Areas',
    'Therapy Style',
    'Journaling Reminder',
    'Avatar',
    'Summary',
  ], []);

  const next = () => setStep((s: number) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s: number) => Math.max(s - 1, 0));

  const toggleFocus = (opt: string) => {
    setFocusAreas((prev: string[]) => {
      if (prev.includes(opt)) return prev.filter((x: string) => x !== opt);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, opt];
    });
  };

  const toggleMood = (emoji: string) => {
    setMoodBaseline((prev: string[]) => {
      if (prev.includes(emoji)) return prev.filter((e: string) => e !== emoji);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, emoji];
    });
  };

  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length > 0 && username.trim().length > 0;
    if (step === 1) return moodBaseline.length === 3;
    if (step === 2) return focusAreas.length >= 2 && focusAreas.length <= 3;
    if (step === 3) return true; // optional
    if (step === 4) return ['Morning','Afternoon','Evening'].includes(reminderTime);
    if (step === 5) return true; // optional
    return true;
  }, [step, name, username, moodBaseline, focusAreas, reminderTime]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveOnboardingProfile(user, {
        name: name.trim(),
        username: username.trim(),
        email: user.email ?? null,
        avatar: uploadPreview || avatar,
        focusAreas,
        preferredTherapy: preferredTherapy ?? null,
        reminderTime,
        moodBaseline,
      });
      router.push('/');
    } finally {
      setSaving(false);
    }
  };

  const stepCard = (content: React.ReactNode) => (
    <motion.div key={step} initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.25}} className="p-6 rounded-2xl bg-white/80 dark:bg-white/10 border border-white/20 shadow-xl backdrop-blur">
      {content}
    </motion.div>
  );

  return (
    <main className="min-h-screen py-10 px-4 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-black dark:to-gray-900">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-2xl font-extrabold">Aura X Onboarding</div>
          <div className="text-sm opacity-70">Step {step+1} / {steps.length}</div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Name / Username</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="px-3 py-2 rounded-md border" />
                <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" className="px-3 py-2 rounded-md border" />
              </div>
              <div className="mt-4">
                <div className="text-sm mb-2">Pick an avatar</div>
                <div className="grid grid-cols-6 gap-3">
                  {defaultAvatars.map((emoji)=> (
                    <button key={emoji} onClick={()=>{setAvatar(emoji); setUploadPreview(null);}} className={`p-3 rounded-xl border text-2xl hover:scale-110 transition ${avatar===emoji? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50 dark:bg-blue-500/10':'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Mood Baseline</div>
              <div className="text-sm opacity-75 mb-3">Select 3 emojis representing your vibe</div>
              <div className="grid grid-cols-8 gap-2 text-2xl">
                {["😊","😐","😴","😌","😤","🤗","😔","🤩","😟","😅","😇","🥱","😎","😭","🤯","🫶"].map((e)=> (
                  <button key={e} onClick={()=>toggleMood(e)} className={`h-12 rounded-lg border ${moodBaseline.includes(e)?'border-blue-500 ring-2 ring-blue-300':'border-white/20'}`}>{e}</button>
                ))}
              </div>
              <div className="mt-2 text-sm opacity-70">Selected: {moodBaseline.join(' ')}</div>
            </div>
          )}

          {step === 2 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Wellness Focus Areas</div>
              <div className="text-sm opacity-75 mb-3">Choose top 2-3</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {focusOptions.map((opt) => (
                  <button key={opt} onClick={()=>toggleFocus(opt)} className={`px-4 py-2 rounded-xl border text-left ${focusAreas.includes(opt)?'border-blue-500 bg-blue-50 dark:bg-blue-500/10':'border-white/20'}`}>{opt}</button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Preferred Therapy Style (optional)</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {therapyOptions.map((opt) => (
                  <button key={opt} onClick={()=>setPreferredTherapy(opt)} className={`px-4 py-2 rounded-xl border text-left ${preferredTherapy===opt?'border-blue-500 bg-blue-50 dark:bg-blue-500/10':'border-white/20'}`}>{opt}</button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Journaling Reminder</div>
              <div className="flex gap-2">
                {(['Morning','Afternoon','Evening'] as const).map((t) => (
                  <button key={t} onClick={()=>setReminderTime(t)} className={`px-4 py-2 rounded-full border ${reminderTime===t?'border-blue-500 bg-blue-50 dark:bg-blue-500/10':'border-white/20'}`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Profile Picture (optional)</div>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if (f) handleFile(f);}} />
                {(uploadPreview || avatar) && <img src={uploadPreview || avatar || ''} alt="preview" className="w-16 h-16 rounded-xl border"/>}
              </div>
            </div>
          )}

          {step === 6 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-3">Profile Summary</div>
              <div className="p-4 rounded-2xl border bg-white/60 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  {uploadPreview ? (
                    <img src={uploadPreview} className="w-12 h-12 rounded-xl border" alt="avatar"/>
                  ) : (
                    <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                      {avatar || '🌟'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold">{name} @{username}</div>
                    <div className="text-sm opacity-70">Focus: {focusAreas.join(', ')}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm">Mood: {moodBaseline.join(' ')}</div>
                <div className="mt-1 text-sm">Preferred Therapy: {preferredTherapy || '—'}</div>
                <div className="mt-1 text-sm">Reminder: {reminderTime}</div>
                <div className="mt-3 text-emerald-600 dark:text-emerald-400 font-semibold">Starting Aura Points: 0</div>
                <div className="mt-4 text-lg">Welcome, {name}. Your Aura journey starts now 🌟</div>
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={back} disabled={step===0} className="px-4 py-2 rounded-full border disabled:opacity-40">Back</button>
          {step < steps.length - 1 ? (
            <button onClick={next} disabled={!canContinue} className="px-6 py-2 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 disabled:opacity-40">Next</button>
          ) : (
            <button onClick={save} disabled={saving} className="px-6 py-2 rounded-full text-white bg-emerald-600 disabled:opacity-40">{saving ? 'Saving...' : 'Finish'}</button>
          )}
        </div>
      </div>
    </main>
  );
}

