import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST /api/track
// Reçoit les événements envoyés par le snippet (vues + conversions)
export async function POST(req: NextRequest) {
  let body: {
    experimentId?: string
    variantId?: string
    visitorId?: string
    eventType?: string
    url?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { experimentId, variantId, visitorId, eventType, url } = body

  if (!experimentId || !variantId || !visitorId || !eventType) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  if (!['view', 'conversion'].includes(eventType)) {
    return NextResponse.json({ error: 'eventType invalide' }, { status: 400 })
  }

  // Éviter les doublons de vues (un visiteur ne compte qu'une fois par expérience)
  if (eventType === 'view') {
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('visitor_id', visitorId)
      .eq('event_type', 'view')

    if (count && count > 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }
  }

  const { error } = await supabase.from('events').insert({
    experiment_id: experimentId,
    variant_id: variantId,
    visitor_id: visitorId,
    event_type: eventType,
    url: url ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
