'use client'

import { motion } from 'framer-motion'

export default function LoadingSpinner({ size = 60, text = 'Loading...' }: { size?: number; text?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-5 py-16">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: size, height: size }} aria-hidden="true">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <path d="M 4 50 A 46 46 0 0 1 96 50" fill="#ef4444" />
          <path d="M 4 50 A 46 46 0 0 0 96 50" fill="#f1f5f9" />
          <rect x="4" y="46.5" width="92" height="7" fill="#0f172a" />
          <circle cx="50" cy="50" r="13" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <circle cx="50" cy="50" r="8"  fill="#f1f5f9" />
          <circle cx="50" cy="50" r="3.5" fill="#60a5fa" />
          <circle cx="44" cy="44" r="2" fill="rgba(255,255,255,0.7)" />
        </svg>
      </motion.div>
      {text && (
        <>
          <motion.p className="text-slate-500 text-sm font-semibold" aria-hidden="true"
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
            {text}
          </motion.p>
          <span className="sr-only">{text}</span>
        </>
      )}
    </div>
  )
}
