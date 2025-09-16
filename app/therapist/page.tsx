'use client';
import Link from 'next/link';

export default function TherapistPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Talk to a Therapist</h1>
      <p className="text-gray-300">We're building our provider network. For now, here are trusted resources:</p>
      <ul className="list-disc pl-6 space-y-2 text-sm text-gray-200/90">
        <li>Call your local crisis hotline if you are in immediate danger.</li>
        <li>Reach out to a licensed professional via your healthcare provider.</li>
        <li>Explore community groups in the app for peer support.</li>
      </ul>
      <Link href="/community" className="underline text-sm">Go to Community</Link>
    </div>
  );
}

