import { NextResponse } from 'next/server';
import { seedBoosts, BoostSeed } from '@/lib/boosts';

export async function POST() {
  const items: BoostSeed[] = [
    // Guided Meditations
    {
      title: 'Sleep Drift (10m)',
      description: 'Wind down gently for restful sleep.',
      videoUrl: 'https://www.youtube.com/watch?v=aEqlQvczMJQ',
      durationSec: 10 * 60,
      points: 15,
      category: 'guided_meditation',
      isActive: true,
      tags: ['sleep', 'calm'],
    },
    {
      title: 'Anxiety Ease (8m)',
      description: 'Soothe the mind and reduce anxiety.',
      videoUrl: 'https://www.youtube.com/watch?v=6vO1wPAmiMQ',
      durationSec: 8 * 60,
      points: 15,
      category: 'guided_meditation',
      isActive: true,
      tags: ['anxiety', 'calm'],
    },
    {
      title: 'Deep Focus (15m)',
      description: 'Cultivate focus and flow.',
      videoUrl: 'https://www.youtube.com/watch?v=9pLpCg0_9Ic',
      durationSec: 15 * 60,
      points: 15,
      category: 'guided_meditation',
      isActive: true,
      tags: ['focus', 'productivity'],
    },
    // Body Scan
    {
      title: 'Body Scan (5m)',
      description: 'Gentle full-body relaxation scan.',
      videoUrl: 'https://www.youtube.com/watch?v=IH7H5KtBbsg',
      durationSec: 5 * 60,
      points: 15,
      category: 'body_scan',
      isActive: true,
      tags: ['relief', 'tension'],
    },
    // Mini Workouts
    {
      title: 'Neck & Shoulder Release (5m)',
      description: 'Quick stretch to ease desk tension.',
      videoUrl: 'https://www.youtube.com/watch?v=2NOsE-VPpkE',
      durationSec: 5 * 60,
      points: 15,
      category: 'mini_workout',
      isActive: true,
      tags: ['stretch', 'desk'],
    },
    {
      title: 'Desk Stretch (7m)',
      description: 'Improve mobility and reduce stiffness.',
      videoUrl: 'https://www.youtube.com/watch?v=TLggs3mWz_c',
      durationSec: 7 * 60,
      points: 15,
      category: 'mini_workout',
      isActive: true,
      tags: ['stretch', 'mobility'],
    },
    // Panic Resources
    {
      title: 'Calming Chime (30s)',
      description: 'A short chime loop for immediate calm.',
      videoUrl: 'https://www.youtube.com/watch?v=7iCZj69V4w8',
      durationSec: 30,
      points: 0,
      category: 'panic_resource',
      isActive: true,
      panicClip: { startSec: 0, endSec: 30 },
      tags: ['panic', 'chime'],
    },
    {
      title: 'Affirmations',
      description: 'Rotate calming statements during distress.',
      durationSec: 60,
      points: 0,
      category: 'panic_resource',
      isActive: true,
      tags: ['panic', 'affirmations'],
    },
    // Additional Recommendations
    {
      title: '3-Minute Breathing Space',
      description: 'Creator: Mindfulness Exercises • Perfect for: Quick reset, breath awareness',
      videoUrl: 'https://www.youtube.com/watch?v=SEfs5TJZ6Nk',
      durationSec: 3 * 60,
      points: 15,
      category: 'guided_meditation',
      isActive: true,
      tags: ['breathing', 'reset'],
    },
    {
      title: '5-Minute Morning Yoga for Energy',
      description: 'Creator: SarahBethYoga • Perfect for: Morning activation, light movement',
      videoUrl: 'https://www.youtube.com/watch?v=4pKly2JojMw',
      durationSec: 5 * 60,
      points: 15,
      category: 'mini_workout',
      isActive: true,
      tags: ['yoga', 'morning'],
    },
  ];

  try {
    const res = await seedBoosts(items);
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    console.error('Seed error', e);
    return NextResponse.json({ ok: false, error: 'Failed to seed boosts' }, { status: 500 });
  }
}

