import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computeResults } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: experiment, error } = await supabase
    .from('experiments')
    .select('*, site:sites(name, domain), variants(*)')
    .eq('id', params.id)
    .single()

  if (error || !experiment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { data: events } = await supabase
    .from('events')
    .select('variant_id, event_type')
    .eq('experiment_id', params.id)

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

  return NextResponse.json({ ...experiment, results: computeResults(variantsWithStats) })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { status, name, description, goalType, goalValue, variants } = body

  // Mise à jour du statut uniquement
  if (status !== undefined && !name) {
    const allowed = ['draft', 'running', 'paused', 'completed']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })

    const updates: Record<string, unknown> = { status }
    if (status === 'running') updates.started_at = new Date().toISOString()
    if (status === 'completed') updates.ended_at = new Date().toISOString()

    const { data, error } = await supabase.from('experiments').update(updates).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Mise à jour complète (edit)
  const { data, error } = await supabase
    .from('experiments')
    .update({ name, description: description || null, goal_type: goalType, goal_value: goalValue || null })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour les variations si fournies
  if (variants && variants.length > 0) {
    await supabase.from('variants').delete().eq('experiment_id', params.id)
    const variantsToInsert = variants.map((v: { name: string; weight: number; isControl: boolean; changes: unknown[] }) => ({
      experiment_id: params.id,
      name: v.name,
      weight: v.weight,
      is_control: v.isControl,
      changes: v.changes || [],
    }))
    await supabase.from('variants').insert(variantsToInsert)
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('experiments').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
