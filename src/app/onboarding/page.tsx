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

const avatarOptions = [
  '🌟', '✨', '🌸', '🦋', '🦄', '🌈', '⚡️', '🏋️‍♀️', '🏂', '🎨',
  '🏅', '🎮', '🎯', '🎸', '🎬', '🎭', '🏎️', '✈️', '🚘', '🗽',
  '🏖️', '⛵️', '💰', '📿', '🛍️', '🏀', '⚽️', '🏊‍♀️', '🏸', '🍔',
  '🫶'
];

const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const countryOptions = [
  'Uganda', 'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
  'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala',
  'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
  'Turkey', 'Turkmenistan', 'Tuvalu', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Other'
];


export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<string>('');
  const [country, setCountry] = useState<string>('Uganda');
  const [town, setTown] = useState('');
  const [moodBaseline, setMoodBaseline] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState<'Morning'|'Afternoon'|'Evening'>('Morning');
  const [saving, setSaving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const steps = useMemo(() => [
    'Profile',
    'Avatar',
    'Personal Info',
    'Mood Baseline',
    'Focus Areas',
    'Journaling Reminder',
    'Terms',
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
    if (step === 1) return avatar.length > 0;
    if (step === 2) return dateOfBirth.length > 0 && gender.length > 0 && country.length > 0 && town.trim().length > 0;
    if (step === 3) return moodBaseline.length === 3;
    if (step === 4) return focusAreas.length >= 2 && focusAreas.length <= 3;
    if (step === 5) return ['Morning','Afternoon','Evening'].includes(reminderTime);
    if (step === 6) return termsAccepted; // terms acceptance required
    return true;
  }, [step, name, username, avatar, dateOfBirth, gender, country, town, moodBaseline, focusAreas, reminderTime, termsAccepted]);


  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveOnboardingProfile(user, {
        name: name.trim(),
        username: username.trim(),
        email: user.email ?? null,
        avatar: avatar,
        dateOfBirth,
        gender,
        country,
        town: town.trim(),
        focusAreas,
        reminderTime,
        moodBaseline,
        termsAccepted,
      });
      
      // Mark that user has completed onboarding and should see tour
      if (typeof window !== 'undefined') {
        localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
      }
      
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
          <div className="text-2xl font-extrabold">AuraZ Onboarding</div>
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
            </div>
          )}

          {step === 1 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Choose Your Avatar</div>
              <div className="text-sm opacity-75 mb-3">Pick an emoji that represents you</div>
              <div className="grid grid-cols-10 gap-2 text-2xl">
                {avatarOptions.map((emoji) => (
                  <button 
                    key={emoji} 
                    onClick={() => setAvatar(emoji)} 
                    className={`h-12 rounded-lg border ${avatar === emoji ? 'border-blue-500 ring-2 ring-blue-300' : 'border-white/20'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {avatar && <div className="mt-2 text-sm opacity-70">Selected: {avatar}</div>}
            </div>
          )}

          {step === 2 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Personal Information</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dateOfBirth} 
                    onChange={(e) => setDateOfBirth(e.target.value)} 
                    className="w-full px-3 py-2 rounded-md border" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)} 
                    className="w-full px-3 py-2 rounded-md border"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    className="w-full px-3 py-2 rounded-md border"
                  >
                    <option value="">Select country</option>
                    {countryOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Town/City</label>
                  <input 
                    type="text" 
                    value={town} 
                    onChange={(e) => setTown(e.target.value)} 
                    placeholder="Enter your town or city" 
                    className="w-full px-3 py-2 rounded-md border" 
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && stepCard(
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

          {step === 4 && stepCard(
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

          {step === 5 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-2">Journaling Reminder</div>
              <div className="flex gap-2">
                {(['Morning','Afternoon','Evening'] as const).map((t) => (
                  <button key={t} onClick={()=>setReminderTime(t)} className={`px-4 py-2 rounded-full border ${reminderTime===t?'border-blue-500 bg-blue-50 dark:bg-blue-500/10':'border-white/20'}`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-4">Terms of Service</div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Terms of Service</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    By using AuraZ, you agree to our Terms of Service. We're committed to your privacy and wellness journey.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      I agree to the <a href="/terms" className="underline hover:no-underline">Terms of Service</a>
                    </span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {step === 7 && stepCard(
            <div>
              <div className="text-lg font-semibold mb-3">Profile Summary</div>
              <div className="p-4 rounded-2xl border bg-white/60 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    {avatar || '🌟'}
                  </div>
                  <div>
                    <div className="font-bold">{name} @{username}</div>
                    <div className="text-sm opacity-70">Focus: {focusAreas.join(', ')}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm">Location: {town}, {country}</div>
                <div className="mt-1 text-sm">Gender: {gender}</div>
                <div className="mt-1 text-sm">DOB: {dateOfBirth}</div>
                <div className="mt-1 text-sm">Mood: {moodBaseline.join(' ')}</div>
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

