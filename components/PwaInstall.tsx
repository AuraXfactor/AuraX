"use client";
import { useEffect, useState } from 'react';

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      // @ts-ignore
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall as any);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall as any);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    setVisible(false);
    // @ts-ignore
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome !== 'accepted') {
      setVisible(true);
    }
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-[92%] max-w-md z-50">
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="font-semibold">Install Aura</div>
          <div className="opacity-80">Add the app to your home screen</div>
        </div>
        <button onClick={install} className="rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black">Install</button>
      </div>
    </div>
  );
}

