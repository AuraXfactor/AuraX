'use client';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Terms & Conditions</h1>
      <p className="text-sm text-gray-300">Last updated: Today</p>
      <div className="space-y-4 text-sm leading-relaxed text-gray-200/90">
        <p>
          Aura is a wellness app. It does not provide medical or mental health diagnosis and is not a substitute for professional care. If you are in crisis, call your local emergency number.
        </p>
        <p>
          By using Aura, you agree to use the app responsibly, respect community guidelines, and not misuse features or content.
        </p>
        <p>
          We may update these terms. Continued use constitutes acceptance of any changes.
        </p>
      </div>
      <Link href="/login" className="underline text-sm">Back to login</Link>
    </div>
  );
}

