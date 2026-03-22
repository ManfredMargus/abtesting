'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { Change } from '@/lib/supabase'

type VariantForm = {
  name: string
  weight: number
  isControl: boolean
  changes: Change[]
}

function NewExperimentForm() {
  const router = useRouter()
  const params = useSearchParams()
  const siteId = params.get('siteId') ?? ''

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState<'pageview' | 'click' | 'custom'>('pageview')
  const [goalValue, setGoalValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [variants, setVariants] = useState<VariantForm[]>([
    { name: 'Contrôle (A)', weight: 50, isControl: true, changes: [] },
    { name: 'Variation (B)', weight: 50, isControl: false, changes: [] },
  ])

  function updateVariant(index: number, field: keyof VariantForm, value: unknown) {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  function addChange(variantIndex: number) {
    const newChange: Change = { type: 'css', value: '' }
    setVariants(prev => prev.map((v, i) =>
      i === variantIndex ? { ...v, changes: [...v.changes, newChange] } : v
    ))
  }

  function updateChange(variantIndex: number, changeIndex: number, field: keyof Change, value: string) {
    setVariants(prev => prev.map((v, i) =>
      i === variantIndex
        ? {
            ...v,
            changes: v.changes.map((c, ci) =>
              ci === changeIndex ? { ...c, [field]: value } : c
            ),
          }
        : v
    ))
  }

  function removeChange(variantIndex: number, changeIndex: number) {
    setVariants(prev => prev.map((v, i) =>
      i === variantIndex
        ? { ...v, changes: v.changes.filter((_, ci) => ci !== changeIndex) }
        : v
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const totalWeight = variants.reduce((s, v) => s + v.weight, 0)
    if (totalWeight !== 100) {
      setError('La somme des poids doit être égale à 100%')
      setLoading(false)
      return
    }

    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, name, description, goalType, goalValue, variants }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création')
      return
    }

    router.push(`/experiments/${data.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href={siteId ? `/sites/${siteId}` : '/'} className="text-sm text-gray-400 hover:text-gray-600">
          ← Retour
        </a>
        <h1 className="text-2xl font-bold mt-3">Nouvelle expérience</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos générales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold">Informations</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nom de l&apos;expérience *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Test couleur bouton CTA"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Qu'est-ce que tu testes et pourquoi ?"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {/* Objectif */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold">Objectif (conversion)</h2>
          <p className="text-sm text-gray-500">Qu&apos;est-ce qui compte comme une conversion dans ce test ?</p>

          <div className="flex gap-3">
            {(['pageview', 'click', 'custom'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setGoalType(type)}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                  goalType === type
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {type === 'pageview' ? 'Vue de page' : type === 'click' ? 'Clic sur élément' : 'Événement custom'}
              </button>
            ))}
          </div>

          {goalType === 'pageview' && (
            <input
              type="text"
              value={goalValue}
              onChange={e => setGoalValue(e.target.value)}
              placeholder="URL de la page de conversion (ex: /merci)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          )}
          {goalType === 'click' && (
            <input
              type="text"
              value={goalValue}
              onChange={e => setGoalValue(e.target.value)}
              placeholder="Sélecteur CSS (ex: #btn-achat, .cta-button)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          )}
          {goalType === 'custom' && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              Appelle <code className="bg-gray-200 px-1 rounded">window.AntoonABT.track()</code> depuis ton code pour enregistrer une conversion.
            </div>
          )}
        </div>

        {/* Variations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Variations</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              variants.reduce((s, v) => s + v.weight, 0) === 100
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              Total: {variants.reduce((s, v) => s + v.weight, 0)}%
            </span>
          </div>

          {variants.map((variant, vi) => (
            <div key={vi} className={`border rounded-lg p-4 ${variant.isControl ? 'border-gray-200 bg-gray-50' : 'border-brand-200 bg-brand-50'}`}>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={variant.name}
                  onChange={e => updateVariant(vi, 'name', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={variant.weight}
                    onChange={e => updateVariant(vi, 'weight', parseInt(e.target.value) || 0)}
                    min={1}
                    max={99}
                    className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {variant.isControl ? (
                <p className="text-xs text-gray-400">Version originale — aucun changement appliqué.</p>
              ) : (
                <div className="space-y-2">
                  {variant.changes.map((change, ci) => (
                    <div key={ci} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <select
                          value={change.type}
                          onChange={e => updateChange(vi, ci, 'type', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="css">CSS</option>
                          <option value="html">HTML</option>
                          <option value="js">JavaScript</option>
                          <option value="redirect">Redirection</option>
                        </select>
                        {(change.type === 'html') && (
                          <input
                            type="text"
                            value={change.selector ?? ''}
                            onChange={e => updateChange(vi, ci, 'selector', e.target.value)}
                            placeholder="Sélecteur CSS (ex: #titre)"
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeChange(vi, ci)}
                          className="text-red-400 hover:text-red-600 text-xs ml-auto"
                        >
                          Supprimer
                        </button>
                      </div>
                      <textarea
                        value={change.value}
                        onChange={e => updateChange(vi, ci, 'value', e.target.value)}
                        placeholder={
                          change.type === 'css' ? 'Ex: h1 { color: red; font-size: 2rem; }' :
                          change.type === 'html' ? 'Ex: <h1>Nouveau titre</h1>' :
                          change.type === 'js' ? 'Ex: document.querySelector(".btn").style.background = "green";' :
                          'URL complète (ex: https://monsite.fr/page-b)'
                        }
                        rows={3}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addChange(vi)}
                    className="text-sm text-brand-600 hover:text-brand-800 font-medium"
                  >
                    + Ajouter un changement
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !name}
          className="w-full bg-brand-500 text-white py-2.5 rounded-lg hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer l\'expérience'}
        </button>
      </form>
    </div>
  )
}

export default function NewExperimentPage() {
  return (
    <Suspense>
      <NewExperimentForm />
    </Suspense>
  )
}
