"use client";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/lib/userProfile";
import Link from "next/link";
import { useState, useEffect } from "react";
import AuraAIChat from "@/components/aura-ai/AuraAIChat";

export default function Home() {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showAuraAI, setShowAuraAI] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      getUserProfile(user).then(profile => {
        setUserProfile(profile);
        setProfileLoading(false);
      }).catch(() => {
        setProfileLoading(false);
      });
    }
  }, [user]);

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <section className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-fuchsia-500 to-cyan-500">
            Your Vibe, Your Tribe ✨
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Gamified mental wellness with journals, breathwork, and streaks. PWA ready. Offline friendly. 🔥
        </p>

        {user ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pop">
              <span>Welcome back, {userProfile?.name || userProfile?.username || user.displayName || user.email} 🎉</span>
            </div>
            
            {/* NEW: Prominent Messaging CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/messages" className="px-8 py-4 rounded-2xl text-white shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all font-bold text-lg">
                💬 Open Messages (NEW!)
              </Link>
              <Link href="/journals" className="px-6 py-3 rounded-full bg-emerald-600 text-white hover:scale-105 transition">
                📔 Choose Journal ➜
              </Link>
              <button 
                onClick={() => setShowAuraAI(!showAuraAI)}
                className="px-8 py-4 rounded-2xl text-white shadow-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 hover:scale-105 transition-all font-bold text-lg"
              >
                ✨ Chat with Aura AI
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="px-6 py-3 rounded-full text-white shadow-lg bg-gradient-to-r from-indigo-500 to-blue-500 hover:scale-105 transition">
              Get Started 🚀
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-full border border-white/30 hover:bg-white/10 transition">
              Login
            </Link>
          </div>
        )}
      </section>

      <section className="max-w-5xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Secure Messages', desc: 'End-to-end encrypted WhatsApp-style messaging 💬', href: '/messages', emoji: '🔒', colors: 'from-purple-500 to-pink-500' },
          { title: 'Specialized Journals', desc: 'Daily check-ins, CBT therapy, gratitude & more 📔', href: '/journals', emoji: '📚', colors: 'from-rose-400 to-orange-400' },
          { title: 'DIY', desc: 'Do it yourself - meditations, workouts, tools 🛠️', href: '/toolkit', emoji: '🔧', colors: 'from-cyan-400 to-blue-500' },
          { title: 'Recovery Hub', desc: 'Addiction recovery support and wellness tools 🔄', href: '/recovery', emoji: '🔄', colors: 'from-emerald-400 to-teal-500' },
          { title: 'Mood Tracker', desc: 'Track your daily mood and discover patterns in your emotional well-being 📊', href: '/mood-tracker', emoji: '📊', colors: 'from-blue-400 to-purple-500' },
          { title: 'Aura AI Chat', desc: 'Your mental wellness companion with high capacity for insights and life skills ✨', href: '#', emoji: '🤖', colors: 'from-indigo-500 to-purple-500', onClick: () => setShowAuraAI(true) },
        ].map((c) => (
          c.onClick ? (
            <button key={c.title} onClick={c.onClick} className="group block p-5 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur hover:shadow-2xl transition transform hover:-translate-y-1 w-full text-left">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow bg-gradient-to-br ${c.colors} text-white animate-pop`}>{c.emoji}</div>
              <h3 className="mt-4 text-xl font-bold">{c.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{c.desc}</p>
              <div className="mt-3 text-sm text-blue-600 group-hover:translate-x-1 transition">Chat Now →</div>
            </button>
          ) : (
            <Link key={c.title} href={c.href} className="group block p-5 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur hover:shadow-2xl transition transform hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow bg-gradient-to-br ${c.colors} text-white animate-pop`}>{c.emoji}</div>
              <h3 className="mt-4 text-xl font-bold">{c.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{c.desc}</p>
              <div className="mt-3 text-sm text-blue-600 group-hover:translate-x-1 transition">Explore →</div>
            </Link>
          )
        ))}
      </section>

      <section className="max-w-5xl mx-auto mt-16 text-center text-sm text-gray-500">
        PWA enabled. Install to your home screen and try offline.
      </section>

      {/* Aura AI Chat Modal */}
      {showAuraAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  ✨
                </div>
                <div>
                  <h2 className="text-xl font-bold">Aura AI - Your Mental Wellness Companion</h2>
                  <p className="text-indigo-100 text-sm">High capacity for mental wellness insights and lifestyle guidance</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuraAI(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="h-full">
              <AuraAIChat 
                context="general"
                initialMessage="Hello! I'm Aura, your mental wellness companion. I'm here to help you with insights, life skills, and support your wellness journey. What would you like to explore today?"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
