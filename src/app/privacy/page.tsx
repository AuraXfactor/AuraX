'use client';
import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-green-50 to-white dark:from-black dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 mb-4 inline-block">
            ← Back to AuraZ
          </Link>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/10 backdrop-blur rounded-3xl border border-white/20 p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                  <li>Name and username</li>
                  <li>Email address</li>
                  <li>Profile information and preferences</li>
                  <li>Wellness goals and focus areas</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Wellness Data</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                  <li>Journal entries and mood tracking</li>
                  <li>Meditation and mindfulness activities</li>
                  <li>Progress and achievement data</li>
                  <li>Social interactions and connections</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Technical Information</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                  <li>Device information and app usage</li>
                  <li>IP address and location data (with consent)</li>
                  <li>Crash reports and performance metrics</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">Primary Uses</h3>
                <ul className="list-disc list-inside text-green-700 dark:text-green-300 space-y-1 ml-4">
                  <li>Provide personalized wellness insights and recommendations</li>
                  <li>Enable social features and friend connections</li>
                  <li>Track progress and celebrate achievements</li>
                  <li>Deliver relevant content and exercises</li>
                  <li>Improve app functionality and user experience</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">Analytics & Research</h3>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                  <li>Anonymous usage analytics to improve the service</li>
                  <li>Aggregated research data (with explicit consent)</li>
                  <li>Performance monitoring and optimization</li>
                  <li>Feature usage patterns and preferences</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Protection & Security</h2>
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 mb-2">🔒 Security Measures</h3>
                <ul className="list-disc list-inside text-purple-700 dark:text-purple-300 space-y-1 ml-4">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure cloud storage with industry-standard protection</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Data backup and recovery procedures</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">🛡️ Compliance Standards</h3>
                <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1 ml-4">
                  <li>GDPR (General Data Protection Regulation)</li>
                  <li>CCPA (California Consumer Privacy Act)</li>
                  <li>HIPAA (Health Insurance Portability and Accountability Act)</li>
                  <li>COPPA (Children's Online Privacy Protection Act)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing & Third Parties</h2>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">❌ We Never Share</h3>
                <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1 ml-4">
                  <li>Personal health information with advertisers</li>
                  <li>Journal entries or private thoughts</li>
                  <li>Mental health data for commercial purposes</li>
                  <li>User data with social media platforms</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">✅ Limited Sharing (With Consent)</h3>
                <ul className="list-disc list-inside text-green-700 dark:text-green-300 space-y-1 ml-4">
                  <li>Anonymous, aggregated data for research</li>
                  <li>Essential service providers (encrypted)</li>
                  <li>Legal compliance when required by law</li>
                  <li>Emergency situations for user safety</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights & Controls</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">📊 Data Rights</h3>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Export data in portable format</li>
                  <li>Restrict data processing</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">⚙️ Privacy Controls</h3>
                <ul className="list-disc list-inside text-green-700 dark:text-green-300 space-y-1 ml-4">
                  <li>Adjust privacy settings anytime</li>
                  <li>Control data sharing preferences</li>
                  <li>Manage notification settings</li>
                  <li>Opt-out of analytics</li>
                  <li>Control profile visibility</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. AI & Ethical Guidelines</h2>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 mb-2">🤖 Our AI Principles</h3>
              <ul className="list-disc list-inside text-purple-700 dark:text-purple-300 space-y-1 ml-4">
                <li>AI provides supportive guidance only - never medical advice</li>
                <li>No clinical diagnosis or treatment recommendations</li>
                <li>Human oversight for all AI interactions</li>
                <li>Transparent about AI capabilities and limitations</li>
                <li>Respect for user autonomy and choice</li>
                <li>No use of personal data to train AI models</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We retain your data for as long as your account is active or as needed to provide services. You can request data deletion at any time, and we will:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-4">
              <li>Delete your personal data within 30 days</li>
              <li>Remove your data from backups within 90 days</li>
              <li>Retain anonymized data for research (with consent)</li>
              <li>Keep legal records as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-orange-800 dark:text-orange-200 font-semibold mb-2">👶 COPPA Compliance</p>
              <p className="text-orange-700 dark:text-orange-300">
                AuraZ is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will delete that information immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including standard contractual clauses and adequacy decisions, to protect your data in accordance with applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes via email or in-app notification. Your continued use of the service after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact & Complaints</h2>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">📞 Get in Touch</h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><strong>Privacy Officer:</strong> <a href="mailto:privacy@auraz.app" className="underline hover:no-underline">privacy@auraz.app</a></p>
                <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@auraz.app" className="underline hover:no-underline">dpo@auraz.app</a></p>
                <p><strong>Ethics Committee:</strong> <a href="mailto:ethics@auraz.app" className="underline hover:no-underline">ethics@auraz.app</a></p>
                <p><strong>General Support:</strong> <a href="mailto:support@auraz.app" className="underline hover:no-underline">support@auraz.app</a></p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}