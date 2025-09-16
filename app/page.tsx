import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="relative">
          <div className="absolute -inset-8 blur-3xl opacity-40 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan rounded-full"></div>
          <h1 className="relative text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">
            Glow up your vibe
          </h1>
        </div>
        <p className="text-[rgba(230,230,255,0.8)]">
          Track your mood, journal with voice notes, and breathe better. Built with Firebase.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="rounded-full bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan px-8 py-3 font-semibold text-black">
            Create your account
          </Link>
          <Link href="/login" className="rounded-full border border-white/20 px-8 py-3">
            Sign in
          </Link>
        </div>
        <div className="mt-8 text-sm">
          <span className="text-[rgba(230,230,255,0.7)]">Just want to explore?</span>
          <Link href="/login" className="ml-2 underline underline-offset-4">Use Google sign-in</Link>
        </div>
      </div>
    </main>
  );
}

