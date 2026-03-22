import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/experiments?siteId=XXX
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')

  let query = supabase
    .from('experiments')
    .select(`*, site:sites(name, domain), variants(*)`)
    .order('created_at', { ascending: false })

  if (siteId) query = query.eq('site_id', siteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/experiments — créer une expérience + ses variations
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { siteId, name, description, goalType, goalValue, variants } = body

  if (!siteId || !name) {
    return NextResponse.json({ error: 'siteId et name requis' }, { status: 400 })
  }

  // Créer l'expérience
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .insert({
      site_id: siteId,
      name,
      description: description || null,
      goal_type: goalType || 'pageview',
      goal_value: goalValue || null,
      status: 'draft',
    })
    .select()
    .single()

  if (expError) return NextResponse.json({ error: expError.message }, { status: 500 })

  // Créer les variations
  if (variants && variants.length > 0) {
    const variantsToInsert = variants.map((v: { name: string; weight: number; isControl: boolean; changes: unknown[] }) => ({
      experiment_id: experiment.id,
      name: v.name,
      weight: v.weight,
      is_control: v.isControl,
      changes: v.changes || [],
    }))

    const { error: varError } = await supabase.from('variants').insert(variantsToInsert)
    if (varError) return NextResponse.json({ error: varError.message }, { status: 500 })
  }

  return NextResponse.json(experiment, { status: 201 })
}
