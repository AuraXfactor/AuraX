'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { saveTherapyRequest } from '@/lib/firestoreCollections';

type Provider = {
  id: string;
  name: string;
  specialty: string;
  emoji: string;
};

const PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Dr. Rivera', specialty: 'CBT, Anxiety', emoji: '🧠' },
  { id: 'p2', name: 'Dr. Chen', specialty: 'Trauma, EMDR', emoji: '🪷' },
  { id: 'p3', name: 'Dr. Martinez', specialty: 'Depression, Mood', emoji: '🌤️' },
];

const SESSION_TYPES = ['Video', 'Audio', 'Chat'] as const;

export default function TherapyBookingPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [providerId, setProviderId] = useState<string>(PROVIDERS[0].id);
  const [sessionType, setSessionType] = useState<typeof SESSION_TYPES[number]>('Video');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  
  // New therapy request fields
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [preferredGender, setPreferredGender] = useState('No preference');
  const [preferredTime, setPreferredTime] = useState('Morning');

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeslots = useMemo(() => ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'], []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">📅</div>
          <h1 className="text-2xl font-bold">Booking requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to schedule therapy sessions.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-emerald-500 to-teal-500 transition">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const onSave = async () => {
    if (!date || !time || !providerId) return;
    try {
      setSaving(true);
      
      // Save using new standardized structure
      const requestId = await saveTherapyRequest(user.uid, {
        preferredLanguage,
        preferredGender,
        preferredTime,
        mode: sessionType.toLowerCase(),
        status: 'pending',
      });
      
      // Also save the original booking for backward compatibility
      await addDoc(collection(db, 'users', user.uid, 'therapy_bookings'), {
        providerId,
        sessionType,
        date,
        time,
        timezone: tz,
        createdAt: serverTimestamp(),
      });
      
      setSavedId(requestId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <section className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">Book a Session</span>
        </h1>
        <p className="text-sm opacity-80 mt-1">Timezone: {tz}</p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="text-xs opacity-70 mb-1">Provider</div>
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <label key={p.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer ${providerId===p.id?'border-emerald-400/60 bg-emerald-500/10':'border-white/15 hover:bg-white/10'}`}>
                  <input type="radio" name="provider" className="accent-emerald-500" checked={providerId === p.id} onChange={() => setProviderId(p.id)} />
                  <div className="text-xl">{p.emoji}</div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs opacity-70">{p.specialty}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="text-xs opacity-70 mb-1">Session type</div>
            <div className="flex gap-2 flex-wrap">
              {SESSION_TYPES.map((t) => (
                <button key={t} onClick={() => setSessionType(t)} className={`px-3 py-1.5 rounded-full border ${sessionType===t?'bg-emerald-500/20 border-emerald-400/60':'bg-white/5 border-white/15'}`}>{t}</button>
              ))}
            </div>

            {/* New preference fields */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs opacity-70 mb-1">Preferred Language</label>
                <select 
                  value={preferredLanguage} 
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full rounded-lg bg-black/20 p-2 border border-white/15 text-sm"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs opacity-70 mb-1">Therapist Gender Preference</label>
                <select 
                  value={preferredGender} 
                  onChange={(e) => setPreferredGender(e.target.value)}
                  className="w-full rounded-lg bg-black/20 p-2 border border-white/15 text-sm"
                >
                  <option value="No preference">No preference</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs opacity-70 mb-1">Preferred Time</label>
                <div className="flex gap-2 flex-wrap">
                  {['Morning', 'Afternoon', 'Evening', 'Weekend'].map((timeSlot) => (
                    <button 
                      key={timeSlot} 
                      onClick={() => setPreferredTime(timeSlot)} 
                      className={`px-3 py-1.5 rounded-full border text-sm ${
                        preferredTime === timeSlot
                          ? 'bg-emerald-500/20 border-emerald-400/60'
                          : 'bg-white/5 border-white/15'
                      }`}
                    >
                      {timeSlot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <label className="block text-xs opacity-70 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg bg-black/20 p-2 border border-white/15" />
              <label className="block text-xs opacity-70 mb-1 mt-3">Time</label>
              <div className="flex gap-2 flex-wrap">
                {timeslots.map((slot) => (
                  <button key={slot} onClick={() => setTime(slot)} className={`px-3 py-1.5 rounded-full border ${time===slot?'bg-emerald-500/20 border-emerald-400/60':'bg-white/5 border-white/15'}`}>{slot}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={onSave} disabled={!date || !time || saving} className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50">{saving?'Saving...':'Confirm booking'}</button>
          <Link href="/therapy" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10">Back</Link>
        </div>

        {savedId && (
          <div className="mt-4 p-3 rounded-lg bg-white/10 border border-white/15 text-sm">
            Booking saved! Reference: <span className="font-mono">{savedId}</span>
          </div>
        )}
      </section>
    </motion.div>
  );
}

