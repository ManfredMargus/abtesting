'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Change } from '@/lib/supabase'

type VariantForm = { name: string; weight: number; isControl: boolean; changes: Change[] }

function EditForm() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [siteId, setSiteId] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState<'pageview' | 'click' | 'custom'>('pageview')
  const [goalValue, setGoalValue] = useState('')
  const [variants, setVariants] = useState<VariantForm[]>([])

  useEffect(() => {
    fetch(`/api/experiments/${id}`).then(r => r.json()).then(data => {
      setName(data.name ?? '')
      setDescription(data.description ?? '')
      setGoalType(data.goal_type ?? 'pageview')
      setGoalValue(data.goal_value ?? '')
      setSiteId(data.site_id ?? '')
      setVariants((data.variants ?? []).map((v: { name: string; weight: number; is_control: boolean; changes: Change[] }) => ({
        name: v.name, weight: v.weight, isControl: v.is_control, changes: v.changes ?? [],
      })))
      setLoading(false)
    })
  }, [id])

  function updateVariant(i: number, field: keyof VariantForm, value: unknown) {
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  function addChange(vi: number) {
    setVariants(prev => prev.map((v, i) =>
      i === vi ? { ...v, changes: [...v.changes, { type: 'css', value: '' }] } : v
    ))
  }

  function updateChange(vi: number, ci: number, field: keyof Change, value: string) {
    setVariants(prev => prev.map((v, i) =>
      i === vi ? { ...v, changes: v.changes.map((c, j) => j === ci ? { ...c, [field]: value } : c) } : v
    ))
  }

  function removeChange(vi: number, ci: number) {
    setVariants(prev => prev.map((v, i) =>
      i === vi ? { ...v, changes: v.changes.filter((_, j) => j !== ci) } : v
    ))
  }

  const totalWeight = variants.reduce((s, v) => s + v.weight, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totalWeight !== 100) { setError('La somme des poids doit être 100%'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/experiments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, goalType, goalValue, variants }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/experiments/${id}`)
  }

  if (loading) return <div className="text-gray-400 text-sm p-8">Chargement...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600">Dashboard</a>
        <span>›</span>
        <a href={`/sites/${siteId}`} className="hover:text-gray-600">Site</a>
        <span>›</span>
        <a href={`/experiments/${id}`} className="hover:text-gray-600">{name}</a>
        <span>›</span>
        <span className="text-gray-700">Modifier</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">Modifier l&apos;expérience</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold">Informations</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold">Objectif</h2>
          <div className="flex gap-2">
            {(['pageview', 'click', 'custom'] as const).map(t => (
              <button key={t} type="button" onClick={() => setGoalType(t)}
                className={`px-4 py-2 rounded-xl text-sm border font-medium transition-all ${
                  goalType === t ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {t === 'pageview' ? 'Vue de page' : t === 'click' ? 'Clic' : 'Custom'}
              </button>
            ))}
          </div>
          {(goalType === 'pageview' || goalType === 'click') && (
            <input type="text" value={goalValue} onChange={e => setGoalValue(e.target.value)}
              placeholder={goalType === 'pageview' ? '/merci' : '#btn-achat'}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Variations</h2>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {totalWeight}%
            </span>
          </div>
          {variants.map((variant, vi) => (
            <div key={vi} className={`rounded-xl border-2 p-4 ${variant.isControl ? 'border-gray-200 bg-gray-50' : 'border-brand-200'}`}>
              <div className="flex gap-3 items-center mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${variant.isControl ? 'bg-gray-400' : 'bg-brand-500'}`}>
                  {String.fromCharCode(65 + vi)}
                </div>
                <input type="text" value={variant.name} onChange={e => updateVariant(vi, 'name', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white" />
                <div className="flex items-center gap-1">
                  <input type="number" value={variant.weight} onChange={e => updateVariant(vi, 'weight', parseInt(e.target.value) || 0)}
                    min={1} max={99}
                    className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              {!variant.isControl && (
                <div className="space-y-2">
                  {variant.changes.map((change, ci) => (
                    <div key={ci} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {(['css', 'html', 'js', 'redirect'] as const).map(t => (
                            <button key={t} type="button" onClick={() => updateChange(vi, ci, 'type', t)}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${change.type === t ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {t.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => removeChange(vi, ci)}
                          className="ml-auto text-red-400 hover:text-red-600 text-xs">Supprimer</button>
                      </div>
                      {change.type === 'html' && (
                        <input type="text" value={change.selector ?? ''} onChange={e => updateChange(vi, ci, 'selector', e.target.value)}
                          placeholder="Sélecteur CSS"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none" />
                      )}
                      <textarea value={change.value} onChange={e => updateChange(vi, ci, 'value', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none resize-none" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addChange(vi)}
                    className="w-full border-2 border-dashed border-brand-200 text-brand-500 hover:bg-brand-50 rounded-xl py-2 text-sm font-medium transition-all">
                    + Ajouter un changement
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 font-medium text-sm">
            Annuler
          </button>
          <button type="submit" disabled={saving || !name}
            className="flex-grow-[2] bg-brand-500 text-white py-2.5 rounded-xl hover:bg-brand-600 font-medium text-sm disabled:opacity-40">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditExperimentPage() {
  return <Suspense><EditForm /></Suspense>
}
