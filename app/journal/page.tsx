"use client";
import { useEffect } from 'react';

export default function JournalRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/app/journal');
    }
  }, []);
  return null;
}

