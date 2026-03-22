'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Status = 'draft' | 'running' | 'paused' | 'completed'

const ACTIONS: Record<Status, { next: Status; label: string; color: string }[]> = {
  draft:     [{ next: 'running',   label: 'Lancer le test', color: 'bg-green-500 hover:bg-green-600 text-white' }],
  running:   [
    { next: 'paused',    label: 'Mettre en pause', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    { next: 'completed', label: 'Terminer', color: 'bg-gray-500 hover:bg-gray-600 text-white' },
  ],
  paused:    [
    { next: 'running',   label: 'Reprendre', color: 'bg-green-500 hover:bg-green-600 text-white' },
    { next: 'completed', label: 'Terminer', color: 'bg-gray-500 hover:bg-gray-600 text-white' },
  ],
  completed: [],
}

export default function StatusButton({
  experimentId,
  currentStatus,
}: {
  experimentId: string
  currentStatus: Status
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const actions = ACTIONS[currentStatus] ?? []

  if (actions.length === 0) return null

  async function changeStatus(newStatus: Status) {
    setLoading(true)
    await fetch(`/api/experiments/${experimentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {actions.map(action => (
        <button
          key={action.next}
          onClick={() => changeStatus(action.next)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${action.color}`}
        >
          {loading ? '...' : action.label}
        </button>
      ))}
    </div>
  )
}
