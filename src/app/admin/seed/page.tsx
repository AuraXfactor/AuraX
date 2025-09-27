'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { seedAll } from '@/lib/seed';

type SeedReport = Awaited<ReturnType<typeof seedAll>> | null;

export default function SeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<SeedReport>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    router.push('/login');
    return null;
  }

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await seedAll(user);
      setReport(res);
    } catch (e) {
      console.error(e);
      setError('Seeding failed. Check console for details.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Firestore Seeder</h1>
          <p className="text-gray-600 dark:text-gray-300">Initializes any missing collections with safe, idempotent sample data for your account.</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-4">
          <button
            onClick={run}
            disabled={running}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-60"
          >
            {running ? 'Seeding…' : 'Run Seeding'}
          </button>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Logged in as <span className="font-medium">{user.email || user.uid}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-5">
              <h2 className="text-xl font-semibold mb-3">User Setup</h2>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Profile ensured: <strong>yes</strong></li>
                <li>Aura stats initialized: <strong>{report.auraStatsInitialized ? 'yes' : 'existing'}</strong></li>
                <li>Welcome points awarded: <strong>{report.pointsAwarded ? 'yes' : 'existing'}</strong></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-5">
              <h2 className="text-xl font-semibold mb-3">Core Collections</h2>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Rewards store: <strong>{report.rewardsInitialized ? 'initialized' : 'existing'}</strong></li>
                <li>Weekly quests created: <strong>{report.weeklyQuestsCreated}</strong></li>
                <li>Aura post seeded: <strong>{report.sampleAuraPostId ? report.sampleAuraPostId : 'existing'}</strong></li>
                <li>Group chat: <strong>{report.sampleGroupId ? report.sampleGroupId : 'existing'}</strong></li>
                <li>Sample squad: <strong>{report.sampleSquadId ? report.sampleSquadId : 'existing'}</strong></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-5">
              <h2 className="text-xl font-semibold mb-3">Journals</h2>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Personal journal entry: <strong>{report.journalSeeded ? 'created' : 'existing'}</strong></li>
                <li>Specialized journals: <strong>{report.specializedJournalsSeeded.join(', ') || 'existing'}</strong></li>
                <li>Goal doc: <strong>{report.goalDocCreated ? 'created' : 'existing'}</strong></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-5">
              <h2 className="text-xl font-semibold mb-3">Recovery Hub</h2>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Recovery data: <strong>{report.recoveryUpdated ? 'added' : 'existing'}</strong></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

