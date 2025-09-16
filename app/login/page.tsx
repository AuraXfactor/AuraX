'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebaseAuth';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Login to Aura</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Glow up your vibe. Continue with your wellness journey.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md bg-transparent border border-white/20"
              placeholder="Email"
            />
          </div>
          
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md bg-transparent border border-white/20"
              placeholder="Password"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading || !accepted}
            className="w-full py-2 px-4 rounded-md bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || !accepted}
          className="w-full py-2 px-4 rounded-md border border-white/30 bg-white/10 hover:bg-white/15 transition disabled:opacity-50"
        >
          Sign in with Google
        </button>
          <div className="flex items-start gap-2 text-left">
            <input id="accept" type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <label htmlFor="accept" className="text-xs text-gray-600 dark:text-gray-400">
              I accept the <Link href="/terms" className="underline">Terms & Conditions</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </label>
          </div>

        <div className="text-center text-sm space-y-2">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-500">
              Sign up
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-blue-500">
              Forgot your password?
            </Link>
          </p>
          <div className="pt-3 text-xs text-gray-600 dark:text-gray-400">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline">Terms & Conditions</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </div>
          <div className="pt-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">In partnership with</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full bg-white/80 text-black grid place-items-center text-xs font-bold">R</div>
              <span className="text-sm">RYD Mental Health Organization</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
