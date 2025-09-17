'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

// Lightweight icon set using emojis and inline SVGs to avoid extra deps
const Icon = {
  calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.31 1.78.57 2.63a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.54-.23a2 2 0 0 1 2.11.45c.85.26 1.73.45 2.63.57A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  whatsapp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.15 1.6 5.96L0 24l6.2-1.62A12 12 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.2-3.48-8.52ZM12 22a10 10 0 0 1-5.1-1.39l-.37-.22-3.64.95.97-3.54-.24-.37A10 10 0 1 1 22 12 10 10 0 0 1 12 22Zm5.5-7.38c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.07s-1.27-.47-2.42-1.5c-.89-.8-1.49-1.8-1.66-2.1-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.63-.92-2.23-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.52s1.08 2.93 1.23 3.13c.15.2 2.12 3.24 5.13 4.55.72.31 1.28.49 1.72.62.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.27-.2-.57-.35Z"/>
    </svg>
  ),
  zoom: () => (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="4" y="12" width="28" height="20" rx="4" fill="#4C8BF5"/>
      <path d="M44 19v10l-8-5v-0.1l8-4.9Z" fill="#74A9FF"/>
    </svg>
  ),
  email: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16v16H4z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
};

type SessionMode = 'Phone' | 'WhatsApp' | 'Zoom' | 'In-App Call';
type PreferredTime = 'Morning' | 'Afternoon' | 'Evening' | 'Weekend' | 'Weekday';

export default function TherapySupportPage() {
  const { user } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState<string>(user?.displayName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English');
  const [therapistGender, setTherapistGender] = useState<string>('No preference');
  const [sessionMode, setSessionMode] = useState<SessionMode>('WhatsApp');
  const [preferredTime, setPreferredTime] = useState<PreferredTime>('Evening');
  const [notes, setNotes] = useState<string>('');
  const [contactVia, setContactVia] = useState<'WhatsApp' | 'Email'>('WhatsApp');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => {
    if (user) {
      if (!name) setName(user.displayName || '');
      if (!email) setEmail(user.email || '');
    }
  }, [user]);

  const languages = useMemo(() => ['English', 'Arabic', 'Hindi', 'Urdu', 'French', 'Spanish'], []);
  const genders = useMemo(() => ['No preference', 'Female', 'Male', 'Non-binary'], []);
  const modes = useMemo<SessionMode[]>(() => ['Phone', 'WhatsApp', 'Zoom', 'In-App Call'], []);
  const times = useMemo<PreferredTime[]>(() => ['Morning', 'Afternoon', 'Evening', 'Weekend', 'Weekday'], []);

  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/therapy-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, preferredLanguage, therapistGender, sessionMode, preferredTime, notes, contactVia,
        }),
      });
      if (!res.ok) throw new Error('Failed to send request');
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Intro Section */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center motion-fade-in">
        <div className="mx-auto mb-6 h-40 w-full rounded-2xl bg-gradient-to-r from-cyan-400/30 via-emerald-300/30 to-blue-400/30 backdrop-blur-sm flex items-center justify-center float-soft">
          <span className="text-6xl">🕊️</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-cyan-500">Therapy Support</h1>
        <p className="mt-3 text-lg text-gray-700">
          Sometimes self-help tools aren\'t enough. Talking to a professional can bring clarity, healing, and new perspective. Our trusted therapists are here to walk with you.
        </p>
        <div className="mt-6">
          <button onClick={handleScrollToForm} className="pressable inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400">
            <span className="pulse-glow inline-block h-2 w-2 rounded-full bg-cyan-200"></span>
            Start Your Therapy Journey
          </button>
        </div>
      </motion.div>

      {/* Booking Form */}
      <div ref={formRef} className="mt-10">
        <motion.form onSubmit={onSubmit} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-2xl bg-white/70 backdrop-blur p-6 shadow-xl ring-1 ring-black/5 motion-slide-in">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-cyan-500 focus:outline-none" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
                <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-cyan-500 focus:outline-none">
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Therapist Gender (optional)</label>
                <select value={therapistGender} onChange={(e) => setTherapistGender(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-cyan-500 focus:outline-none">
                  {genders.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Session Mode</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {modes.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setSessionMode(m)}
                    className={`pressable flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${sessionMode === m ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-300 bg-white text-gray-700'}`}
                    aria-pressed={sessionMode === m}
                  >
                    {m === 'Phone' && <Icon.phone />}
                    {m === 'WhatsApp' && <Icon.whatsapp />}
                    {m === 'Zoom' && <Icon.zoom />}
                    {m === 'In-App Call' && <span>📱</span>}
                    <span>{m}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {times.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setPreferredTime(t)}
                    className={`pressable flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${preferredTime === t ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-300 bg-white text-gray-700'}`}
                    aria-pressed={preferredTime === t}
                  >
                    <Icon.calendar />
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes / Special Requests</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Share anything that can help us match you better" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-cyan-500 focus:outline-none" rows={4}></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(['WhatsApp', 'Email'] as const).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setContactVia(c)}
                      className={`pressable flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${contactVia === c ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-300 bg-white text-gray-700'}`}
                      aria-pressed={contactVia === c}
                    >
                      {c === 'WhatsApp' ? <Icon.whatsapp /> : <Icon.email />}
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email (for confirmation)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-cyan-500 focus:outline-none" required />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 border border-red-200">{error}</div>
            )}

            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">We\'ll reach out within 24-48 hours.</div>
              <button type="submit" disabled={submitting} className="pressable inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white shadow hover:bg-cyan-700 disabled:opacity-60">
                <Icon.clock />
                {submitting ? 'Sending...' : 'Request Support'}
              </button>
            </div>
          </div>
        </motion.form>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-pop">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">✅</div>
              <h2 className="text-xl font-semibold text-center">Request received</h2>
              <p className="mt-1 text-center text-gray-600">Our coordination team will contact you shortly.</p>
              <div className="mt-5 flex justify-center">
                <button onClick={() => setSubmitted(false)} className="pressable inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white shadow hover:bg-cyan-700">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="mt-12 text-center text-sm text-gray-600">
        <div className="mx-auto mb-2 flex items-center justify-center gap-3">
          <img src="/ryd-logo.svg" alt="RYD Mental Health" className="h-6 w-auto" />
        </div>
        Therapy services provided by{' '}
        <a href="https://rydmentalhealth.org" target="_blank" rel="noreferrer" className="text-cyan-700 underline">RYD Mental Health</a>
      </div>
    </div>
  );
}

