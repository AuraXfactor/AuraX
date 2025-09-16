'use client';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-300">Last updated: Today</p>
      <div className="space-y-4 text-sm leading-relaxed text-gray-200/90">
        <p>
          We collect minimal data to provide the Aura experience: account info and in-app activity such as vibes, journal entries, and progress. You can request deletion at any time.
        </p>
        <p>
          Data is stored securely using Firebase services. We do not sell your data.
        </p>
        <p>
          For questions, contact support@aura.local.
        </p>
      </div>
      <Link href="/login" className="underline text-sm">Back to login</Link>
    </div>
  );
}

