export interface TrendPoint {
  date: string
  count: number
}

export interface DashboardStats {
  customers: number
  messages_today: number
  running_campaigns: number
  avg_score: number
  channels_enabled: number
  automations_enabled: number
  messages_trend: TrendPoint[]
  recent_events: Event[]
}

export interface Channel {
  id: number
  key: string
  name: string
  category: 'channel'
  enabled: boolean
  config: Record<string, unknown>
  created_at: string
}

export interface Customer {
  id: number
  name: string
  oneid: string
  phone: string | null
  email: string | null
  source_channel: string | null
  tags: string[]
  score: number
  stage: string
  created_at: string
  updated_at: string
}

export interface CustomerDetail extends Customer {
  messages: Message[]
  score_logs: ScoreLog[]
}

export interface Message {
  id: number
  customer_id: number
  channel_id: number | null
  channel_key: string
  direction: 'in' | 'out'
  content: string
  template_id: number | null
  status: string
  created_at: string
}

export interface Template {
  id: number
  name: string
  category: string
  channel_key: string | null
  content: string
  created_at: string
}

export interface Campaign {
  id: number
  name: string
  status: string
  channel_key: string | null
  stats: Record<string, unknown>
  created_at: string
}

export interface Automation {
  id: number
  name: string
  enabled: boolean
  trigger_event: string
  conditions: Record<string, unknown>
  actions: Record<string, unknown>[]
  created_at: string
}

export interface AutomationRun {
  id: number
  automation_id: number
  automation_name: string
  customer_id: number | null
  status: string
  log: Record<string, unknown>
  created_at: string
}

export interface ScoreRule {
  id: number
  name: string
  event_type: string
  dimension: string
  points: number
  created_at: string
}

export interface ScoreLog {
  id: number
  customer_id: number
  delta: number
  reason: string
  total_after: number
  created_at: string
}

export interface Event {
  id: number
  type: string
  customer_id: number | null
  channel_key: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface AiSuggestResponse {
  intent: string
  suggestion: string
  sentiment: string
  source: string
  error?: string | null
}
