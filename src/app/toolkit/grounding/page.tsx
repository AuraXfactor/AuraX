"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function GroundingPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [steps, setSteps] = useState({ see: 0, touch: 0, hear: 0, smell: 0, taste: 0 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    if (!cameraOn) return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraOn(false);
      }
    })();
  }, [cameraOn]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-pop">🪨</div>
          <h1 className="text-2xl font-bold">Grounding requires login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const set = (key: keyof typeof steps, val: number) => setSteps((s) => ({ ...s, [key]: val }));

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">5-4-3-2-1 Grounding</h1>
      <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <div className="font-semibold">5 things you can see</div>
          <input type="range" min={0} max={5} value={steps.see} onChange={(e) => set('see', Number(e.target.value))} className="w-full" />
          <div className="text-sm">{steps.see} / 5 noticed</div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <div className="font-semibold">4 things you can touch</div>
          <input type="range" min={0} max={4} value={steps.touch} onChange={(e) => set('touch', Number(e.target.value))} className="w-full" />
          <div className="text-sm">{steps.touch} / 4 noticed</div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <div className="font-semibold">3 things you can hear</div>
          <input type="range" min={0} max={3} value={steps.hear} onChange={(e) => set('hear', Number(e.target.value))} className="w-full" />
          <div className="text-sm">{steps.hear} / 3 noticed</div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <div className="font-semibold">2 things you can smell</div>
          <input type="range" min={0} max={2} value={steps.smell} onChange={(e) => set('smell', Number(e.target.value))} className="w-full" />
          <div className="text-sm">{steps.smell} / 2 noticed</div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <div className="font-semibold">1 thing you can taste</div>
          <input type="range" min={0} max={1} value={steps.taste} onChange={(e) => set('taste', Number(e.target.value))} className="w-full" />
          <div className="text-sm">{steps.taste} / 1 noticed</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-6 flex items-center gap-3 justify-center">
        <button onClick={() => setCameraOn((v) => !v)} className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">{cameraOn ? 'Turn off camera' : 'Open camera (optional)'}</button>
      </div>
      {cameraOn && (
        <div className="max-w-3xl mx-auto mt-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-white/20"></video>
        </div>
      )}

      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

