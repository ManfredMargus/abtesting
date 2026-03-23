import { supabase } from '@/lib/supabase'
import { computeResults, type VariantStats } from '@/lib/stats'
import { notFound } from 'next/navigation'
import ExperimentActions from './ExperimentActions'

export const revalidate = 0

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: 'Brouillon', color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  running:   { label: 'En cours',  color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  paused:    { label: 'En pause',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  completed: { label: 'Terminé',   color: 'bg-blue-100 text-blue-600',   dot: 'bg-blue-400' },
}

async function getData(id: string) {
  const { data: experiment, error } = await supabase
    .from('experiments')
    .select('*, site:sites(id, name, domain), variants(*)')
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
    ...v, views: counts[v.id]?.views ?? 0, conversions: counts[v.id]?.conversions ?? 0,
  }))

  // Jours depuis le démarrage
  let daysRunning = 0
  if (experiment.started_at) {
    daysRunning = Math.floor((Date.now() - new Date(experiment.started_at).getTime()) / (1000 * 60 * 60 * 24))
  }

  const dailyVisitors = daysRunning > 0
    ? Math.round(variantsWithStats.reduce((s: number, v: { views: number }) => s + v.views, 0) / daysRunning / experiment.variants.length)
    : undefined

  return { ...experiment, results: computeResults(variantsWithStats, dailyVisitors), daysRunning }
}

export default async function ExperimentPage({ params }: { params: { id: string } }) {
  const experiment = await getData(params.id)
  if (!experiment) notFound()

  const badge = STATUS_CONFIG[experiment.status] ?? STATUS_CONFIG.draft
  const { results, daysRunning } = experiment

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600">Dashboard</a>
        <span>›</span>
        <a href={`/sites/${experiment.site_id}`} className="hover:text-gray-600">{experiment.site?.name}</a>
        <span>›</span>
        <span className="text-gray-700 font-medium">{experiment.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full ${badge.dot} ${experiment.status === 'running' ? 'animate-pulse' : ''}`} />
            <h1 className="text-2xl font-bold">{experiment.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
          </div>
          {experiment.description && (
            <p className="text-gray-500 text-sm ml-5">{experiment.description}</p>
          )}
          {experiment.started_at && (
            <p className="text-gray-400 text-xs ml-5 mt-1">
              Lancé il y a {daysRunning} jour{daysRunning > 1 ? 's' : ''} · Objectif : {experiment.goal_type}
              {experiment.goal_value && ` (${experiment.goal_value})`}
            </p>
          )}
        </div>
        <ExperimentActions
          experimentId={experiment.id}
          siteId={experiment.site_id}
          currentStatus={experiment.status}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">{results.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Visiteurs uniques</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">{results.totalConversions.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Conversions</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className={`text-3xl font-bold ${results.hasWinner ? 'text-green-600' : 'text-gray-400'}`}>
            {results.hasWinner ? '🏆 Gagnant' : daysRunning > 0 ? 'En cours' : 'Non démarré'}
          </div>
          <div className="text-sm text-gray-400 mt-1">Statut</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {results.sampleSizeNeeded ? (
            <>
              <div className="text-3xl font-bold text-gray-800">{results.sampleSizeNeeded.toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-1">Visiteurs nécessaires / var.</div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-400">—</div>
              <div className="text-sm text-gray-400 mt-1">Pas assez de données</div>
            </>
          )}
        </div>
      </div>

      {/* Résultats par variation */}
      <h2 className="font-semibold text-lg mb-4">Résultats par variation</h2>
      <div className="space-y-3 mb-8">
        {results.variants.map((v: VariantStats) => (
          <div key={v.variantId}
            className={`bg-white rounded-2xl border p-5 transition-all ${
              v.isWinner ? 'border-green-400 shadow-sm shadow-green-50' : 'border-gray-200'
            }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  v.isControl ? 'bg-gray-400' : v.isWinner ? 'bg-green-500' : 'bg-brand-500'
                }`}>
                  {v.isControl ? 'A' : 'B'}
                </div>
                <span className="font-semibold">{v.name}</span>
                {v.isControl && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Contrôle</span>}
                {v.isWinner && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">🏆 Gagnant</span>}
              </div>
              {!v.isControl && v.views > 30 && (
                <div className="text-right">
                  <div className={`text-sm font-bold ${v.isSignificant ? 'text-green-600' : 'text-gray-400'}`}>
                    {v.confidence.toFixed(1)}% confiance
                  </div>
                  <div className="text-xs text-gray-400">{v.isSignificant ? 'Significatif ✓' : 'Non significatif'}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-400 text-xs mb-1">Visiteurs</div>
                <div className="font-bold text-lg">{v.views.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-400 text-xs mb-1">Conversions</div>
                <div className="font-bold text-lg">{v.conversions.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-400 text-xs mb-1">Taux</div>
                <div className="font-bold text-lg">{(v.conversionRate * 100).toFixed(2)}%</div>
              </div>
              <div className={`rounded-xl p-3 ${
                v.uplift === null ? 'bg-gray-50' :
                v.uplift > 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="text-gray-400 text-xs mb-1">Amélioration</div>
                <div className={`font-bold text-lg ${
                  v.uplift === null ? 'text-gray-400' :
                  v.uplift > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {v.uplift === null ? '—' : `${v.uplift > 0 ? '+' : ''}${v.uplift.toFixed(1)}%`}
                </div>
              </div>
            </div>

            {/* Barre de confiance */}
            {!v.isControl && v.views > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Niveau de confiance statistique</span>
                  <span>{v.confidence.toFixed(1)}% / 95% requis</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${v.isSignificant ? 'bg-green-500' : 'bg-brand-400'}`}
                    style={{ width: `${Math.min(v.confidence, 100)}%` }}
                  />
                </div>
                {!v.isSignificant && results.sampleSizeNeeded && results.sampleSizeNeeded > v.views && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Encore {(results.sampleSizeNeeded - v.views).toLocaleString()} visiteurs nécessaires pour atteindre 95% de confiance.
                    {results.daysToSignificance ? ` Estimation : ~${results.daysToSignificance} jours.` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interprétation */}
      {results.totalViews > 0 && (
        <div className={`rounded-2xl p-5 mb-6 border ${
          results.hasWinner
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className="font-semibold mb-1">{results.hasWinner ? '🏆 Résultat clair' : '⏳ Test en cours'}</h3>
          <p className="text-sm text-gray-600">
            {results.hasWinner
              ? `Une variation gagnante a été identifiée avec plus de 95% de confiance statistique. Tu peux appliquer cette variation à 100% de tes visiteurs.`
              : results.sampleSizeNeeded && results.totalViews < results.sampleSizeNeeded
              ? `Il faut encore des données pour un résultat fiable. Continue le test sans modifier les variations.`
              : `Le test n'a pas encore produit de résultat significatif. Les deux variations performent de façon similaire.`
            }
          </p>
        </div>
      )}
    </div>
  )
}
