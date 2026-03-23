'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Status = 'draft' | 'running' | 'paused' | 'completed'

export default function ExperimentActions({
  experimentId, siteId, currentStatus,
}: { experimentId: string; siteId: string; currentStatus: Status }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  async function changeStatus(status: Status) {
    setLoading(true)
    await fetch(`/api/experiments/${experimentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  async function duplicate() {
    setLoading(true)
    const res = await fetch(`/api/experiments/${experimentId}/duplicate`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    setShowMenu(false)
    router.push(`/experiments/${data.id}`)
  }

  async function deleteExp() {
    if (!confirm('Supprimer cette expérience et toutes ses données ? Action irréversible.')) return
    setLoading(true)
    await fetch(`/api/experiments/${experimentId}`, { method: 'DELETE' })
    router.push(`/sites/${siteId}`)
  }

  return (
    <div className="flex items-center gap-2 relative">
      {/* Actions principales selon le statut */}
      {currentStatus === 'draft' && (
        <button onClick={() => changeStatus('running')} disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium text-sm disabled:opacity-50">
          ▶ Lancer le test
        </button>
      )}
      {currentStatus === 'running' && (
        <>
          <button onClick={() => changeStatus('paused')} disabled={loading}
            className="border border-yellow-300 text-yellow-700 bg-yellow-50 px-3 py-2 rounded-xl hover:bg-yellow-100 transition-colors text-sm font-medium">
            ⏸ Pause
          </button>
          <button onClick={() => changeStatus('completed')} disabled={loading}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            ✓ Terminer
          </button>
        </>
      )}
      {currentStatus === 'paused' && (
        <button onClick={() => changeStatus('running')} disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium text-sm">
          ▶ Reprendre
        </button>
      )}

      {/* Menu contextuel */}
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors">
          ···
        </button>
        {showMenu && (
          <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44 z-10">
            <a href={`/experiments/${experimentId}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              ✏️ Modifier
            </a>
            <button onClick={duplicate} disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              📋 Dupliquer
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button onClick={deleteExp} disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
              🗑 Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
