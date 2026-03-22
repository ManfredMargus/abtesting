import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export const revalidate = 0

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  running:   { label: 'En cours', color: 'bg-green-100 text-green-700' },
  paused:    { label: 'En pause', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Terminé', color: 'bg-blue-100 text-blue-700' },
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
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const snippetInstall = `<!-- Anti-flicker (colle en premier dans <head>) -->
<script>
!function(){var e=document.createElement("style");e.id="abt-hider";
e.innerHTML="body{opacity:0!important;transition:opacity .15s ease}";
document.head.appendChild(e);
setTimeout(function(){var el=document.getElementById("abt-hider");
if(el)el.parentNode.removeChild(el)},3000)}();
</script>
<script src="${baseUrl}/snippet.js" data-site-id="${site.api_key}"></script>`

  return (
    <div>
      <div className="mb-6">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</a>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-gray-400 text-sm">{site.domain || 'Domaine non renseigné'}</p>
          </div>
          <Link
            href={`/experiments/new?siteId=${site.id}`}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors font-medium"
          >
            + Nouvelle expérience
          </Link>
        </div>
      </div>

      {/* Code d'installation */}
      <div className="bg-gray-900 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-300 text-sm font-medium">Code à installer sur ton site (dans &lt;head&gt;)</p>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">HTML</span>
        </div>
        <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap break-all leading-5">
          {snippetInstall}
        </pre>
        <p className="text-gray-500 text-xs mt-3">
          Installe ce code une seule fois. Toutes tes expériences sur ce site se lanceront automatiquement.
        </p>
      </div>

      {/* Liste des expériences */}
      <h2 className="font-semibold text-lg mb-4">Expériences ({experiments.length})</h2>

      {experiments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-3xl mb-2">🧪</div>
          <h3 className="font-semibold mb-1">Aucune expérience</h3>
          <p className="text-gray-500 text-sm mb-4">Crée ton premier test A/B sur ce site.</p>
          <Link
            href={`/experiments/new?siteId=${site.id}`}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors inline-block"
          >
            Créer une expérience
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp: { id: string; name: string; status: string; goal_type: string; variants: unknown[]; created_at: string }) => {
            const badge = STATUS_LABELS[exp.status] ?? STATUS_LABELS.draft
            return (
              <Link
                key={exp.id}
                href={`/experiments/${exp.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{exp.name}</div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {exp.variants?.length ?? 0} variation{(exp.variants?.length ?? 0) !== 1 ? 's' : ''} · objectif: {exp.goal_type}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
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
