import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl">😢</p>
        <h1 className="text-3xl font-black text-white">Page not found</h1>
        <p className="text-slate-400">That page does not exist in this world.</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors"
        >
          ← Back to Pokédex
        </Link>
      </div>
    </div>
  )
}
