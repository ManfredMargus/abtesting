'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SiteActions({ siteId, siteName }: { siteId: string; siteName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Supprimer "${siteName}" et toutes ses expériences ? Cette action est irréversible.`)) return
    setLoading(true)
    await fetch(`/api/sites/${siteId}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Supprimer'}
    </button>
  )
}
