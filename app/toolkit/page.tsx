"use client";
import { useEffect } from 'react';

export default function ToolkitRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/app/toolkit');
    }
  }, []);
  return null;
}

