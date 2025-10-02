'use client';
import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-blue-50 to-white dark:from-black dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block">
            ← Back to AuraZ
          </Link>
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/10 backdrop-blur rounded-3xl border border-white/20 p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing and using AuraZ ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              AuraZ is a mental wellness and lifestyle application that provides:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Journaling and mood tracking tools</li>
              <li>AI-powered wellness assistance</li>
              <li>Social features for connecting with friends</li>
              <li>Meditation and mindfulness exercises</li>
              <li>Recovery support tools</li>
              <li>Personalized wellness insights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              As a user of AuraZ, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Provide accurate and truthful information</li>
              <li>Use the service in a lawful manner</li>
              <li>Respect other users' privacy and boundaries</li>
              <li>Not share harmful or inappropriate content</li>
              <li>Maintain the confidentiality of your account</li>
              <li>Report any security concerns immediately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Medical Disclaimer</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">⚠️ Important Medical Notice</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                AuraZ is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Privacy and Data Protection</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We are committed to protecting your privacy and personal information. Our data practices include:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>End-to-end encryption for sensitive data</li>
              <li>Compliance with GDPR, CCPA, and HIPAA standards</li>
              <li>No sale of personal information to third parties</li>
              <li>Secure data storage and transmission</li>
              <li>User control over data sharing preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. AI and Ethical Guidelines</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our AI systems are designed with ethical principles:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>AI provides supportive, non-clinical guidance only</li>
              <li>No medical diagnosis or treatment recommendations</li>
              <li>Human oversight for all AI interactions</li>
              <li>Transparent about AI limitations</li>
              <li>Respect for user autonomy and choice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. User Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of data processing</li>
              <li>File complaints about data handling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Prohibited Uses</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may not use AuraZ:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Service Availability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We strive to maintain high service availability but cannot guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              AuraZ is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Questions about these Terms?</p>
              <p className="text-blue-700 dark:text-blue-300">
                Contact us at: <a href="mailto:legal@auraz.app" className="underline hover:no-underline">legal@auraz.app</a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}