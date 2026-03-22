import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computeResults } from '@/lib/stats'

// GET /api/experiments/[id] — détail + résultats statistiques
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  // Charger l'expérience avec ses variations
  const { data: experiment, error } = await supabase
    .from('experiments')
    .select(`*, site:sites(name, domain), variants(*)`)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Compter les vues et conversions par variation
  const { data: eventCounts } = await supabase
    .from('events')
    .select('variant_id, event_type')
    .eq('experiment_id', id)

  const counts: Record<string, { views: number; conversions: number }> = {}
  for (const ev of (eventCounts ?? [])) {
    if (!counts[ev.variant_id]) counts[ev.variant_id] = { views: 0, conversions: 0 }
    if (ev.event_type === 'view') counts[ev.variant_id].views++
    if (ev.event_type === 'conversion') counts[ev.variant_id].conversions++
  }

  // Calculer les stats
  const variantsWithStats = (experiment.variants ?? []).map((v: { id: string; name: string; is_control: boolean }) => ({
    ...v,
    views: counts[v.id]?.views ?? 0,
    conversions: counts[v.id]?.conversions ?? 0,
  }))

  const results = computeResults(variantsWithStats)

  return NextResponse.json({ ...experiment, results })
}

// PATCH /api/experiments/[id] — changer le statut (start, pause, stop)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await req.json()
  const { status } = body

  const allowed = ['draft', 'running', 'paused', 'completed']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'running') updates.started_at = new Date().toISOString()
  if (status === 'completed') updates.ended_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('experiments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/experiments/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('experiments').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
