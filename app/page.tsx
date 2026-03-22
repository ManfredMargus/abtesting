import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 0

async function getData() {
  const { data: sites } = await supabase
    .from('sites')
    .select('*, experiments(id, status)')
    .order('created_at', { ascending: false })

  return sites ?? []
}

export default async function Dashboard() {
  const sites = await getData()

  const totalRunning = sites.reduce((acc, s) =>
    acc + (s.experiments?.filter((e: { status: string }) => e.status === 'running').length ?? 0), 0)
  const totalExperiments = sites.reduce((acc, s) => acc + (s.experiments?.length ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Tous tes sites et expériences A/B</p>
        </div>
        <Link
          href="/sites/new"
          className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors font-medium"
        >
          + Ajouter un site
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-brand-600">{sites.length}</div>
          <div className="text-sm text-gray-500 mt-1">Sites actifs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">{totalExperiments}</div>
          <div className="text-sm text-gray-500 mt-1">Expériences total</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-green-600">{totalRunning}</div>
          <div className="text-sm text-gray-500 mt-1">Tests en cours</div>
        </div>
      </div>

      {/* Liste des sites */}
      {sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-lg font-semibold mb-1">Aucun site pour l&apos;instant</h2>
          <p className="text-gray-500 text-sm mb-4">Commence par ajouter le site sur lequel tu veux tester.</p>
          <Link
            href="/sites/new"
            className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors inline-block"
          >
            Ajouter mon premier site
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sites.map((site) => {
            const running = site.experiments?.filter((e: { status: string }) => e.status === 'running').length ?? 0
            const total = site.experiments?.length ?? 0
            return (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-base">{site.name}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{site.domain || 'Domaine non renseigné'}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{total} expérience{total !== 1 ? 's' : ''}</div>
                    {running > 0 && (
                      <div className="text-xs text-green-600 font-medium">{running} en cours</div>
                    )}
                  </div>
                  <div className="text-gray-300 text-xl">›</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
