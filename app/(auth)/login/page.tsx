'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebaseAuth';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
      router.push(redirect);
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
      router.push(redirect);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 glass rounded-2xl">
        <h2 className="text-2xl font-bold text-center">Welcome back to Aura</h2>
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

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2 px-4 rounded-xl border border-white/20 hover:bg-white/10 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="text-center text-sm space-y-2">
          <p>
            Don&apos;t have an account?{' '}
            <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="underline">
              Sign up
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

