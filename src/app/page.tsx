"use client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pop">
            <span>Welcome back, {user.email} 🎉</span>
                    <Link href="/journals" className="px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:scale-105 transition">
                      Choose Journal ➜
                    </Link>
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
                  { title: 'Specialized Journals', desc: 'Daily check-ins, CBT therapy, gratitude & more 📔', href: '/journals', emoji: '📚', colors: 'from-rose-400 to-orange-400' },
          { title: 'Breath Toolkit', desc: '4-7-8 breathing with haptics and motion 🌬️', href: '/toolkit', emoji: '🧘', colors: 'from-cyan-400 to-blue-500' },
          { title: 'PWA Offline', desc: 'Works offline with sync when back online ⚡', href: '/', emoji: '📶', colors: 'from-emerald-400 to-teal-500' },
        ].map((c) => (
          <Link key={c.title} href={c.href} className="group block p-5 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur hover:shadow-2xl transition transform hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow bg-gradient-to-br ${c.colors} text-white animate-pop`}>{c.emoji}</div>
            <h3 className="mt-4 text-xl font-bold">{c.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{c.desc}</p>
            <div className="mt-3 text-sm text-blue-600 group-hover:translate-x-1 transition">Explore →</div>
          </Link>
        ))}
      </section>

      <section className="max-w-5xl mx-auto mt-16 text-center text-sm text-gray-500">
        PWA enabled. Install to your home screen and try offline.
      </section>
    </main>
  );
}
