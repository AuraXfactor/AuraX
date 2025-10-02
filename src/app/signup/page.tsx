'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '../../lib/firebaseAuth';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password);
      router.push('/onboarding');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Email"
            />
          </div>
          
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Password (min. 6 characters)"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Terms and Privacy Consent */}
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Terms of Service</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                By creating an account, you agree to our Terms of Service and Privacy Policy for AuraZ.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  I agree to the <a href="/terms" className="underline hover:no-underline">Terms of Service</a> and <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>
                </span>
              </label>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
