import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AB Testing by Antoon',
  description: 'Plateforme de tests A/B simple, rapide et sans bugs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-brand-600 tracking-tight">
              Antoon<span className="text-gray-400 font-normal"> A/B</span>
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/sites/new" className="bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors">
                + Nouveau site
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
