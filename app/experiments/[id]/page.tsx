import { supabase } from '@/lib/supabase'
import { computeResults } from '@/lib/stats'
import { notFound } from 'next/navigation'
import StatusButton from './StatusButton'

export const revalidate = 0

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  running:   { label: 'En cours', color: 'bg-green-100 text-green-700' },
  paused:    { label: 'En pause', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Terminé', color: 'bg-blue-100 text-blue-700' },
}

async function getData(id: string) {
  const { data: experiment, error } = await supabase
    .from('experiments')
    .select('*, site:sites(name, domain), variants(*)')
    .eq('id', id)
    .single()

  if (error || !experiment) return null

  const { data: events } = await supabase
    .from('events')
    .select('variant_id, event_type')
    .eq('experiment_id', id)

  const counts: Record<string, { views: number; conversions: number }> = {}
  for (const ev of (events ?? [])) {
    if (!counts[ev.variant_id]) counts[ev.variant_id] = { views: 0, conversions: 0 }
    if (ev.event_type === 'view') counts[ev.variant_id].views++
    if (ev.event_type === 'conversion') counts[ev.variant_id].conversions++
  }

  const variantsWithStats = (experiment.variants ?? []).map((v: { id: string; name: string; is_control: boolean }) => ({
    ...v,
    views: counts[v.id]?.views ?? 0,
    conversions: counts[v.id]?.conversions ?? 0,
  }))

  return { ...experiment, results: computeResults(variantsWithStats) }
}

export default async function ExperimentPage({ params }: { params: { id: string } }) {
  const experiment = await getData(params.id)
  if (!experiment) notFound()

  const badge = STATUS_LABELS[experiment.status] ?? STATUS_LABELS.draft
  const results = experiment.results

  return (
    <div>
      <div className="mb-6">
        <a href={`/sites/${experiment.site_id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← {experiment.site?.name ?? 'Retour'}
        </a>
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{experiment.name}</h1>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            {experiment.description && (
              <p className="text-gray-500 text-sm mt-1">{experiment.description}</p>
            )}
          </div>
          <StatusButton experimentId={experiment.id} currentStatus={experiment.status} />
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">{results.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Visiteurs uniques</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">{results.totalConversions.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Conversions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className={`text-3xl font-bold ${results.hasWinner ? 'text-green-600' : 'text-gray-400'}`}>
            {results.hasWinner ? 'Gagnant trouvé' : 'En attente...'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Objectif: {experiment.goal_type}</div>
        </div>
      </div>

      {/* Résultats par variation */}
      <h2 className="font-semibold text-lg mb-4">Résultats par variation</h2>
      <div className="space-y-3">
        {results.variants.map((v: {
          variantId: string
          name: string
          isControl: boolean
          isWinner: boolean
          views: number
          conversions: number
          conversionRate: number
          uplift: number | null
          confidence: number
          isSignificant: boolean
        }) => (
          <div
            key={v.variantId}
            className={`bg-white rounded-xl border p-5 ${
              v.isWinner ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{v.name}</span>
                {v.isControl && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Contrôle</span>
                )}
                {v.isWinner && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Gagnant</span>
                )}
              </div>
              {!v.isControl && v.views > 0 && (
                <div className={`text-sm font-medium ${v.isSignificant ? 'text-green-600' : 'text-gray-400'}`}>
                  {v.confidence.toFixed(1)}% confiance
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Visiteurs</div>
                <div className="font-semibold text-lg">{v.views.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Conversions</div>
                <div className="font-semibold text-lg">{v.conversions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Taux</div>
                <div className="font-semibold text-lg">{(v.conversionRate * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-gray-400">Amélioration</div>
                <div className={`font-semibold text-lg ${
                  v.uplift === null ? 'text-gray-400' :
                  v.uplift > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {v.uplift === null ? '—' : `${v.uplift > 0 ? '+' : ''}${v.uplift.toFixed(1)}%`}
                </div>
              </div>
            </div>

            {v.views > 0 && (
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${v.isWinner ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(v.conversionRate * 100 * 5, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {!v.isControl && !v.isSignificant && v.views > 0 && (
              <p className="text-xs text-gray-400 mt-2">Pas encore assez de données pour conclure.</p>
            )}
          </div>
        ))}
      </div>

      {/* Config */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium mb-2">Configuration</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div><span className="text-gray-400">Objectif :</span> {experiment.goal_type}</div>
          {experiment.goal_value && <div><span className="text-gray-400">Valeur :</span> {experiment.goal_value}</div>}
          <div><span className="text-gray-400">Créé le :</span> {new Date(experiment.created_at).toLocaleDateString('fr-FR')}</div>
          {experiment.started_at && <div><span className="text-gray-400">Démarré le :</span> {new Date(experiment.started_at).toLocaleDateString('fr-FR')}</div>}
        </div>
      </div>
    </div>
  )
}
