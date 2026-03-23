import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 0

async function getData() {
  const { data: sites } = await supabase
    .from('sites')
    .select('*, experiments(id, status)')
    .order('created_at', { ascending: false })

  const { count: totalEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })

  return { sites: sites ?? [], totalEvents: totalEvents ?? 0 }
}

const STATUS_COLORS: Record<string, string> = {
  running:   'bg-green-100 text-green-700',
  draft:     'bg-gray-100 text-gray-500',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-600',
}

export default async function Dashboard() {
  const { sites, totalEvents } = await getData()

  const totalRunning = sites.reduce((acc, s) =>
    acc + (s.experiments?.filter((e: { status: string }) => e.status === 'running').length ?? 0), 0)
  const totalExperiments = sites.reduce((acc, s) => acc + (s.experiments?.length ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vue d&apos;ensemble de tous tes tests A/B</p>
        </div>
        <Link href="/sites/new"
          className="bg-brand-500 text-white px-4 py-2 rounded-xl hover:bg-brand-600 transition-colors font-medium text-sm shadow-sm">
          + Ajouter un site
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Sites', value: sites.length, color: 'text-gray-800' },
          { label: 'Expériences', value: totalExperiments, color: 'text-gray-800' },
          { label: 'Tests actifs', value: totalRunning, color: 'text-green-600' },
          { label: 'Events trackés', value: totalEvents.toLocaleString(), color: 'text-brand-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-sm text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Sites list */}
      {sites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-brand-500">AB</span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Lance ton premier test A/B</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Ajoute ton site, installe le snippet en 2 minutes, et commence à tester.
          </p>
          <Link href="/sites/new"
            className="bg-brand-500 text-white px-6 py-2.5 rounded-xl hover:bg-brand-600 transition-colors font-medium inline-block">
            Ajouter mon premier site
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map(site => {
            const experiments = site.experiments ?? []
            const running = experiments.filter((e: { status: string }) => e.status === 'running').length
            const byStatus = experiments.reduce((acc: Record<string, number>, e: { status: string }) => {
              acc[e.status] = (acc[e.status] ?? 0) + 1
              return acc
            }, {} as Record<string, number>)

            return (
              <Link key={site.id} href={`/sites/${site.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-600 font-bold text-sm">{site.name[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{site.name}</div>
                    <div className="text-sm text-gray-400">{site.domain || 'Domaine non renseigné'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {Object.entries(byStatus).map(([status, count]) => (
                      <span key={status} className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {count as number} {status === 'running' ? 'actif' : status === 'draft' ? 'brouillon' : status === 'completed' ? 'terminé' : 'pause'}
                      </span>
                    ))}
                    {experiments.length === 0 && (
                      <span className="text-xs text-gray-400">Aucune expérience</span>
                    )}
                  </div>
                  {running > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">{running} en cours</span>
                    </div>
                  )}
                  <span className="text-gray-300 group-hover:text-gray-400 transition-colors">›</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
