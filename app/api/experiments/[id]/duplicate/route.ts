import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: original, error } = await supabase
    .from('experiments')
    .select('*, variants(*)')
    .eq('id', params.id)
    .single()

  if (error || !original) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { data: copy, error: copyError } = await supabase
    .from('experiments')
    .insert({
      site_id: original.site_id,
      name: `${original.name} (copie)`,
      description: original.description,
      goal_type: original.goal_type,
      goal_value: original.goal_value,
      status: 'draft',
    })
    .select()
    .single()

  if (copyError) return NextResponse.json({ error: copyError.message }, { status: 500 })

  const variantsCopies = (original.variants ?? []).map((v: { name: string; weight: number; is_control: boolean; changes: unknown[] }) => ({
    experiment_id: copy.id,
    name: v.name,
    weight: v.weight,
    is_control: v.is_control,
    changes: v.changes,
  }))

  await supabase.from('variants').insert(variantsCopies)

  return NextResponse.json(copy, { status: 201 })
}
