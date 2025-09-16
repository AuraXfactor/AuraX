'use client';
import React, { useState } from 'react';
import { resetPassword } from '@/lib/firebaseAuth';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPassword(email);
      setMessage('Password reset email sent. Please check your inbox.');
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
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>

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

          {error && <div className="text-red-400 text-sm">{error}</div>}
          {message && <div className="text-green-400 text-sm">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black font-semibold disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <p className="text-center text-sm">
          Remembered it?{' '}
          <Link href="/login" className="underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

