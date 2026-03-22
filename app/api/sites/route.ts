import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/sites — liste tous les sites
export async function GET() {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/sites — créer un site
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, domain } = body

  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('sites')
    .insert({ name, domain: domain || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
