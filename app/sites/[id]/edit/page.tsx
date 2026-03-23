'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditSite() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/sites/${id}`).then(r => r.json()).then(data => {
      setName(data.name ?? '')
      setDomain(data.domain ?? '')
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/sites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, domain }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/sites/${id}`)
  }

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600">Dashboard</a>
        <span>›</span>
        <a href={`/sites/${id}`} className="hover:text-gray-600">{name}</a>
        <span>›</span>
        <span className="text-gray-700">Modifier</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">Modifier le site</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nom du site *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Domaine</label>
          <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
            placeholder="monsite.fr"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
            Annuler
          </button>
          <button type="submit" disabled={saving || !name}
            className="flex-1 bg-brand-500 text-white py-2.5 rounded-xl hover:bg-brand-600 transition-colors font-medium text-sm disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
