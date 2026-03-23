import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import SiteActions from './SiteActions'

export const revalidate = 0

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: 'Brouillon', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  running:   { label: 'En cours',  color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  paused:    { label: 'En pause',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  completed: { label: 'Terminé',   color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
}

async function getData(id: string) {
  const { data: site } = await supabase
    .from('sites')
    .select('*, experiments(*, variants(id))')
    .eq('id', id)
    .single()
  return site
}

export default async function SitePage({ params }: { params: { id: string } }) {
  const site = await getData(params.id)
  if (!site) notFound()

  const experiments = site.experiments ?? []
  const running = experiments.filter((e: { status: string }) => e.status === 'running').length
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const snippet = `<!-- Colle dans le <head> de ton site, avant tout autre script -->
<script>!function(){var e=document.createElement("style");e.id="abt-hider";e.innerHTML="body{opacity:0!important;transition:opacity .15s ease}";document.head.appendChild(e);setTimeout(function(){var el=document.getElementById("abt-hider");if(el)el.parentNode.removeChild(el)},3000)}();</script>
<script src="${baseUrl}/snippet.js" data-site-id="${site.api_key}"></script>`

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600">Dashboard</a>
        <span>›</span>
        <span className="text-gray-700 font-medium">{site.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
            <span className="text-brand-600 font-bold text-lg">{site.name[0].toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-gray-400 text-sm">{site.domain || 'Domaine non renseigné'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sites/${site.id}/edit`}
            className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            Modifier
          </Link>
          <SiteActions siteId={site.id} siteName={site.name} />
          <Link href={`/experiments/new?siteId=${site.id}`}
            className="text-sm bg-brand-500 text-white px-4 py-1.5 rounded-lg hover:bg-brand-600 transition-colors font-medium">
            + Nouvelle expérience
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-2xl font-bold">{experiments.length}</div>
          <div className="text-sm text-gray-400">Expériences</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{running}</div>
          <div className="text-sm text-gray-400">En cours</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {experiments.filter((e: { status: string }) => e.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-400">Terminées</div>
        </div>
      </div>

      {/* Snippet */}
      <div className="bg-gray-900 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white text-sm font-medium">Code d&apos;installation</p>
            <p className="text-gray-400 text-xs mt-0.5">Installe une seule fois dans le &lt;head&gt; de ton site</p>
          </div>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">HTML</span>
        </div>
        <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap break-all leading-5 font-mono">{snippet}</pre>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <p className="text-gray-500 text-xs">
            Clé API : <code className="text-gray-400">{site.api_key}</code>
          </p>
        </div>
      </div>

      {/* Expériences */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Expériences ({experiments.length})</h2>
      </div>

      {experiments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-3xl mb-3">🧪</div>
          <h3 className="font-semibold mb-1">Aucune expérience</h3>
          <p className="text-gray-400 text-sm mb-4">Lance ton premier test A/B sur ce site.</p>
          <Link href={`/experiments/new?siteId=${site.id}`}
            className="bg-brand-500 text-white px-4 py-2 rounded-xl hover:bg-brand-600 transition-colors inline-block font-medium text-sm">
            Créer une expérience
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {experiments.map((exp: {
            id: string; name: string; status: string; goal_type: string;
            variants: unknown[]; created_at: string; description: string | null
          }) => {
            const cfg = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft
            return (
              <Link key={exp.id} href={`/experiments/${exp.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot} ${exp.status === 'running' ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className="font-medium">{exp.name}</div>
                    {exp.description && <div className="text-xs text-gray-400 mt-0.5">{exp.description}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">
                      {exp.variants?.length ?? 0} variations · objectif : {exp.goal_type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
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
