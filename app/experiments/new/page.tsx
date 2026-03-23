'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Change } from '@/lib/supabase'

type VariantForm = {
  name: string
  weight: number
  isControl: boolean
  changes: Change[]
}

const CHANGE_EXAMPLES = {
  css: [
    { label: 'Changer couleur bouton', value: '.btn-cta { background-color: #FF6B35 !important; color: white !important; }' },
    { label: 'Agrandir le titre', value: 'h1 { font-size: 2.5rem !important; font-weight: 800 !important; }' },
    { label: 'Cacher un élément', value: '.popup-banner { display: none !important; }' },
  ],
  html: [
    { label: 'Changer texte CTA', selector: '#btn-achat', value: 'Acheter maintenant — Livraison gratuite' },
    { label: 'Nouveau titre', selector: 'h1', value: 'Découvrez notre offre exclusive' },
  ],
  js: [
    { label: 'Déplacer un élément', value: 'document.querySelector(".promo-bar").style.display = "block";\ndocument.querySelector(".header").prepend(document.querySelector(".promo-bar"));' },
  ],
}

function ExperimentForm() {
  const router = useRouter()
  const params = useSearchParams()
  const siteId = params.get('siteId') ?? ''

  const [step, setStep] = useState<1 | 2 | 3>(1)
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

  function applyExample(vi: number, ci: number, type: 'css' | 'html' | 'js', example: { label?: string; value: string; selector?: string }) {
    setVariants(prev => prev.map((v, i) =>
      i === vi ? {
        ...v, changes: v.changes.map((c, j) =>
          j === ci ? { ...c, type, value: example.value, selector: example.selector } : c
        )
      } : v
    ))
  }

  const totalWeight = variants.reduce((s, v) => s + v.weight, 0)

  async function handleSubmit() {
    if (totalWeight !== 100) { setError('La somme des poids doit être 100%'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, name, description, goalType, goalValue, variants }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Erreur'); return }
    router.push(`/experiments/${data.id}`)
  }

  const steps = [
    { n: 1, label: 'Informations' },
    { n: 2, label: 'Objectif' },
    { n: 3, label: 'Variations' },
  ]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600">Dashboard</a>
        <span>›</span>
        <span className="text-gray-700">Nouvelle expérience</span>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-8">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-2">
            <button onClick={() => s.n < step ? setStep(s.n as 1|2|3) : null}
              className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                step === s.n ? 'bg-brand-500 text-white' :
                step > s.n ? 'bg-green-500 text-white cursor-pointer' : 'bg-gray-100 text-gray-400'
              }`}>
              {step > s.n ? '✓' : s.n}
            </button>
            <span className={`text-sm font-medium ${step === s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
            {idx < steps.length - 1 && <div className={`flex-1 h-px w-12 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Infos */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom de l&apos;expérience *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Test couleur bouton CTA"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description <span className="text-gray-400 font-normal">(optionnel)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Pourquoi ce test ? Quelle hypothèse ?"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
          <button onClick={() => name && setStep(2)} disabled={!name}
            className="w-full bg-brand-500 text-white py-2.5 rounded-xl hover:bg-brand-600 transition-colors font-medium disabled:opacity-40">
            Suivant →
          </button>
        </div>
      )}

      {/* Step 2 — Objectif */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Objectif de conversion</h2>
          <p className="text-sm text-gray-500">Qu&apos;est-ce qui compte comme une conversion dans ce test ?</p>

          <div className="grid grid-cols-3 gap-3">
            {([
              { type: 'pageview', label: 'Vue de page', desc: "L'utilisateur visite une URL", icon: '📄' },
              { type: 'click',    label: 'Clic',        desc: 'Clic sur un élément CSS', icon: '👆' },
              { type: 'custom',   label: 'Custom',      desc: 'Appel JS manuel', icon: '⚡' },
            ] as const).map(opt => (
              <button key={opt.type} onClick={() => setGoalType(opt.type)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  goalType === opt.type ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          {goalType === 'pageview' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">URL de la page de conversion</label>
              <input type="text" value={goalValue} onChange={e => setGoalValue(e.target.value)}
                placeholder="/merci ou /confirmation"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          )}
          {goalType === 'click' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Sélecteur CSS de l&apos;élément</label>
              <input type="text" value={goalValue} onChange={e => setGoalValue(e.target.value)}
                placeholder="#btn-achat ou .cta-button"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <p className="text-xs text-gray-400 mt-1">Le snippet ajoutera automatiquement un listener sur cet élément.</p>
            </div>
          )}
          {goalType === 'custom' && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              Appelle <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">window.AntoonABT.track()</code> depuis ton code pour enregistrer une conversion manuellement.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
              ← Retour
            </button>
            <button onClick={() => setStep(3)}
              className="flex-1 bg-brand-500 text-white py-2.5 rounded-xl hover:bg-brand-600 transition-colors font-medium">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Variations */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Variations</h2>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                Répartition : {totalWeight}%
              </span>
            </div>

            <div className="space-y-4">
              {variants.map((variant, vi) => (
                <div key={vi} className={`rounded-xl border-2 p-4 ${
                  variant.isControl ? 'border-gray-200 bg-gray-50' : 'border-brand-200 bg-brand-50/30'
                }`}>
                  <div className="flex gap-3 items-center mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      variant.isControl ? 'bg-gray-400' : 'bg-brand-500'
                    }`}>
                      {String.fromCharCode(65 + vi)}
                    </div>
                    <input type="text" value={variant.name} onChange={e => updateVariant(vi, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white" />
                    <div className="flex items-center gap-1">
                      <input type="number" value={variant.weight}
                        onChange={e => updateVariant(vi, 'weight', parseInt(e.target.value) || 0)}
                        min={1} max={99}
                        className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white" />
                      <span className="text-sm text-gray-500 font-medium">%</span>
                    </div>
                  </div>

                  {variant.isControl ? (
                    <p className="text-xs text-gray-400 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      Version originale — aucun changement appliqué au contrôle.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {variant.changes.map((change, ci) => (
                        <div key={ci} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {(['css', 'html', 'js', 'redirect'] as const).map(t => (
                                <button key={t} onClick={() => updateChange(vi, ci, 'type', t)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                    change.type === t
                                      ? 'bg-brand-500 text-white'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}>
                                  {t.toUpperCase()}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => removeChange(vi, ci)}
                              className="ml-auto text-red-400 hover:text-red-600 text-xs font-medium">
                              Supprimer
                            </button>
                          </div>

                          {/* Exemples rapides */}
                          {CHANGE_EXAMPLES[change.type as keyof typeof CHANGE_EXAMPLES] && (
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-xs text-gray-400">Exemples :</span>
                              {CHANGE_EXAMPLES[change.type as keyof typeof CHANGE_EXAMPLES].map((ex, ei) => (
                                <button key={ei}
                                  onClick={() => applyExample(vi, ci, change.type as 'css'|'html'|'js', ex)}
                                  className="text-xs bg-gray-100 hover:bg-brand-100 hover:text-brand-700 text-gray-600 px-2 py-0.5 rounded-md transition-colors">
                                  {ex.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {change.type === 'html' && (
                            <input type="text" value={change.selector ?? ''}
                              onChange={e => updateChange(vi, ci, 'selector', e.target.value)}
                              placeholder="Sélecteur CSS (ex: h1, #titre, .btn)"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-400" />
                          )}

                          <textarea value={change.value}
                            onChange={e => updateChange(vi, ci, 'value', e.target.value)}
                            placeholder={
                              change.type === 'css'      ? 'Ex: .btn-cta { background: #e53e3e !important; }' :
                              change.type === 'html'     ? 'Ex: <strong>Nouveau texte</strong>' :
                              change.type === 'js'       ? 'Ex: document.title = "Nouveau titre";' :
                              'URL complète (ex: https://monsite.fr/page-b)'
                            }
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
                        </div>
                      ))}

                      <button onClick={() => addChange(vi)}
                        className="w-full border-2 border-dashed border-brand-200 text-brand-500 hover:border-brand-400 hover:bg-brand-50 rounded-xl py-2 text-sm font-medium transition-all">
                        + Ajouter un changement
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              ← Retour
            </button>
            <button onClick={handleSubmit} disabled={loading || totalWeight !== 100}
              className="flex-2 flex-grow bg-brand-500 text-white py-2.5 rounded-xl hover:bg-brand-600 transition-colors font-medium disabled:opacity-40">
              {loading ? 'Création...' : 'Créer l\'expérience'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewExperimentPage() {
  return <Suspense><ExperimentForm /></Suspense>
}
