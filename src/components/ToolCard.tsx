"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ToolCard({ href, title, desc, emoji, colors, delay = 0 }: {
  href: string;
  title: string;
  desc: string;
  emoji: string;
  colors: string; // tailwind gradient spec e.g. 'from-cyan-400 to-blue-500'
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className="group block p-5 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur hover:shadow-2xl transition transform hover:-translate-y-1 pressable">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow bg-gradient-to-br ${colors} text-white animate-pop`}>{emoji}</div>
        <h3 className="mt-4 text-xl font-bold">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{desc}</p>
        <div className="mt-3 text-sm text-blue-600 group-hover:translate-x-1 transition">Open →</div>
      </Link>
    </motion.div>
  );
}

