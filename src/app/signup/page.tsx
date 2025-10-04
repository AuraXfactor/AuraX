'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, signInWithGoogle, signInWithApple, sendPhoneVerification, verifyPhoneCode } from '../../lib/firebaseAuth';
import { countryCodes, CountryCode } from '../../lib/countryCodes';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type SignupMethod = 'email' | 'phone';

export default function Signup() {
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]); // Uganda default
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const router = useRouter();
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA
    if (typeof window !== 'undefined' && !recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\d{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    try {
      if (!recaptchaVerifier.current) {
        throw new Error('reCAPTCHA not initialized');
      }
      
      const result = await sendPhoneVerification(fullPhoneNumber, recaptchaVerifier.current);
      setConfirmationResult(result);
      setError('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!confirmationResult) {
      setError('No verification session found.');
      setLoading(false);
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      await verifyPhoneCode(confirmationResult, verificationCode);
      router.push('/onboarding');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      router.push('/onboarding');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-md w-full space-y-6 p-8 bg-white/80 dark:bg-white/10 backdrop-blur rounded-3xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Join AuraZ
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Your wellness journey starts here ✨
          </p>
        </div>

        {/* Signup Method Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setSignupMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg transition ${
              signupMethod === 'email'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            📧 Email
          </button>
          <button
            onClick={() => setSignupMethod('phone')}
            className={`flex-1 py-2 px-4 rounded-lg transition ${
              signupMethod === 'phone'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            📱 Phone
          </button>
        </div>

        {/* Social Signup Options */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialSignup('google')}
              disabled={loading || !termsAccepted}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <span className="text-lg">🔍</span>
              <span className="font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialSignup('apple')}
              disabled={loading || !termsAccepted}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <span className="text-lg">🍎</span>
              <span className="font-medium">Apple</span>
            </button>
          </div>
        </div>

        {/* Main Signup Form */}
        <AnimatePresence mode="wait">
          {!confirmationResult ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={signupMethod === 'email' ? handleEmailSignup : handlePhoneSignup} className="space-y-4">
                {signupMethod === 'email' ? (
                  <>
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
                        placeholder="Create a password (min. 6 characters)"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-2 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                          <span className="text-gray-400">▼</span>
                        </button>
                        
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                            {countryCodes.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm">{country.name}</span>
                                <span className="text-sm text-gray-500 ml-auto">{country.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Terms and Privacy Consent */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Terms of Service</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    By creating an account, you agree to our Terms of Service and Privacy Policy for AuraZ.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      I agree to the <a href="/terms" className="underline hover:no-underline">Terms of Service</a> and <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="verification-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Verify Your Phone</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    We sent a 6-digit code to <span className="font-medium">{selectedCountry.dialCode} {phoneNumber}</span>
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmationResult(null);
                    setVerificationCode('');
                    setError('');
                  }}
                  className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  ← Back to phone number
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* reCAPTCHA Container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
