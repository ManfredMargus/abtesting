import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client serveur avec tous les droits (utilisé dans les API routes uniquement)
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types
export type Site = {
  id: string
  name: string
  domain: string | null
  api_key: string
  created_at: string
}

export type Experiment = {
  id: string
  site_id: string
  name: string
  description: string | null
  status: 'draft' | 'running' | 'paused' | 'completed'
  goal_type: 'pageview' | 'click' | 'custom'
  goal_value: string | null
  created_at: string
  started_at: string | null
  ended_at: string | null
  variants?: Variant[]
  site?: Site
}

export type Variant = {
  id: string
  experiment_id: string
  name: string
  weight: number
  is_control: boolean
  changes: Change[]
  created_at: string
}

export type Change = {
  type: 'css' | 'html' | 'js' | 'redirect'
  selector?: string
  value: string
}

export type Event = {
  id: string
  experiment_id: string
  variant_id: string
  visitor_id: string
  event_type: 'view' | 'conversion'
  url: string | null
  created_at: string
}
