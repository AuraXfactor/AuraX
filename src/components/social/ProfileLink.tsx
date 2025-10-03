'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileLinkProps {
  userId: string;
  name: string;
  className?: string;
  children: React.ReactNode;
}

export default function ProfileLink({ userId, name, className = '', children }: ProfileLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/profile/${userId}`);
  };

  return (
    <Link
      href={`/profile/${userId}`}
      onClick={handleClick}
      className={`cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${className}`}
      title={`View ${name}'s profile`}
    >
      {children}
    </Link>
  );
}