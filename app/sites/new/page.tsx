'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSite() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, domain }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création')
      return
    }

    router.push(`/sites/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</a>
        <h1 className="text-2xl font-bold mt-3">Ajouter un site</h1>
        <p className="text-gray-500 text-sm mt-1">Un site = un domaine sur lequel tu vas faire des tests A/B.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nom du site *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Mon site e-commerce"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Domaine</label>
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="Ex: monsite.fr"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-400 mt-1">Optionnel, juste pour t&apos;y retrouver.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !name}
          className="w-full bg-brand-500 text-white py-2 rounded-lg hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer le site'}
        </button>
      </form>
    </div>
  )
}
