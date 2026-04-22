'use client'

import { motion } from 'framer-motion'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages: (number | '...')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end   = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const btnBase = {
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid rgba(255,255,255,0.07)',
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
        style={btnBase}
      >
        ← Prev
      </motion.button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`d${i}`} className="text-slate-600 px-1 select-none">…</span>
        ) : (
          <motion.button
            key={page}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(page)}
            className="w-9 h-9 rounded-xl text-sm font-black cursor-pointer transition-all"
            style={currentPage === page
              ? { background: '#ef4444', color: '#fff', boxShadow: '0 4px 16px rgba(239,68,68,0.4)', border: 'none' }
              : { ...btnBase, color: '#94a3b8' }
            }
          >
            {page}
          </motion.button>
        )
      )}

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
        style={btnBase}
      >
        Next →
      </motion.button>
    </div>
  )
}
