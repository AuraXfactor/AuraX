"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  onResult: (text: string) => void;
  buttonClassName?: string;
};

export default function VoiceInput({ onResult, buttonClassName }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const AnyWindow = typeof window !== 'undefined' ? (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }) : undefined;
    const Ctor = AnyWindow?.SpeechRecognition || AnyWindow?.webkitSpeechRecognition;
    if (Ctor) {
      const recognition = new Ctor();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = (event.results?.[0]?.[0] as SpeechRecognitionAlternative | undefined)?.transcript;
        if (text) onResult(text);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, [onResult]);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert('Voice input not supported on this device/browser.');
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        // ignore if already started
      }
    }
  };

  return (
    <button type="button" onClick={toggle} className={buttonClassName ?? "px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition pressable"} aria-pressed={listening} aria-label="Toggle voice input">
      {listening ? '🎙️ Listening…' : '🎤 Voice'}
    </button>
  );
}

