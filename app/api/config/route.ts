import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/config?siteId=XXX
// Appelé par le snippet JS depuis le site du client
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')

  if (!siteId) {
    return NextResponse.json({ error: 'siteId manquant' }, { status: 400 })
  }

  // Retrouver le site via son api_key
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id')
    .eq('api_key', siteId)
    .single()

  if (siteError || !site) {
    return NextResponse.json([], { status: 200 }) // Retourner tableau vide si site inconnu
  }

  // Charger les expériences actives avec leurs variations
  const { data: experiments, error } = await supabase
    .from('experiments')
    .select(`
      id,
      name,
      goal_type,
      goal_value,
      variants (
        id,
        name,
        weight,
        is_control,
        changes
      )
    `)
    .eq('site_id', site.id)
    .eq('status', 'running')

  if (error) {
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(experiments ?? [], {
    headers: {
      'Cache-Control': 'public, s-maxage=60', // Cache CDN 60 secondes
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
