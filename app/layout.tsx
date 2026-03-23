import type { Metadata } from 'next'
import './globals.css'
import LogoutButton from './LogoutButton'

export const metadata: Metadata = {
  title: 'Antoon A/B — Plateforme de tests A/B',
  description: 'La plateforme A/B testing la plus simple et précise du marché.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">AB</span>
              </div>
              <span className="font-bold text-gray-900">Antoon</span>
              <span className="text-gray-400 font-normal text-sm">A/B Testing</span>
            </a>
            <div className="flex items-center gap-3">
              <a href="/sites/new"
                className="text-sm bg-brand-500 text-white px-4 py-1.5 rounded-lg hover:bg-brand-600 transition-colors font-medium">
                + Nouveau site
              </a>
              <LogoutButton />
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
