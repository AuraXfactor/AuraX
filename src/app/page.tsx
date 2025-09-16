"use client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">AuraX</h1>
      <p className="text-center text-sm text-gray-500 mb-6">PWA enabled. Try offline.</p>
      
      {user ? (
        <div className="text-center">
          <h2 className="text-xl mb-4">Welcome, {user.email}!</h2>
          <p>Your app is connected to Firebase successfully! 🎉</p>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl mb-6">Ready to get started?</h2>
          <div className="space-x-4">
            <Link href="/signup" className="px-6 py-3 bg-blue-500 text-white rounded-lg">
              Sign Up
            </Link>
            <Link href="/login" className="px-6 py-3 border border-gray-300 rounded-lg">
              Login
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
