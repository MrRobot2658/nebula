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

export interface ChannelEventOption {
  key: string
  label: string
}

export interface ChannelConfigField {
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string | null
}

export interface ChannelMessageStats {
  messages_in: number
  messages_out: number
}

export interface ChannelDetail {
  channel: Channel
  capabilities: string[]
  events: ChannelEventOption[]
  config_schema: ChannelConfigField[]
  recent_events: Event[]
  stats: ChannelMessageStats
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

// ---- Forms ----
export interface FormField {
  key: string
  label: string
  type: string
  required: boolean
}

export interface Form {
  id: number
  name: string
  channel_key?: string | null
  fields: FormField[]
  created_at: string
}

export interface FormSubmission {
  id: number
  form_id: number
  customer_id?: number | null
  data: Record<string, unknown>
  created_at: string
}

export interface FormDetail extends Form {
  submissions: FormSubmission[]
}

// ---- Landing Pages ----
export interface LandingPage {
  id: number
  slug: string
  title: string
  headline: string
  body: string
  form_id?: number | null
  channel_key?: string | null
  status: string
  views: number
  created_at: string
}

// ---- Posters ----
export interface Poster {
  id: number
  name: string
  template: string
  title: string
  subtitle: string
  cta?: string | null
  qr_target?: string | null
  created_at: string
}

// ---- Members ----
export interface Member {
  id: number
  customer_id: number
  customer_name?: string | null
  level: string
  points: number
  joined_at: string
}

export interface PointTransaction {
  id: number
  customer_id: number
  delta: number
  reason: string
  balance_after: number
  created_at: string
}

export interface MemberDetail extends Member {
  next_level?: string | null
  points_to_next: number
  transactions: PointTransaction[]
}

// ---- Orders ----
export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: number
  customer_id: number
  amount: number
  items: OrderItem[]
  status: string
  created_at: string
}

// ---- Webinars ----
export interface Webinar {
  id: number
  title: string
  host?: string | null
  scheduled_at?: string | null
  status: string
  channel_key?: string | null
  form_id?: number | null
  stats: Record<string, unknown>
  created_at: string
}

export interface WebinarDetail extends Webinar {
  form?: Form | null
  registrations: number
}

// ---- Offline Events ----
export interface OfflineEvent {
  id: number
  title: string
  location?: string | null
  scheduled_at?: string | null
  status: string
  landing_page_id?: number | null
  poster_id?: number | null
  stats: Record<string, unknown>
  created_at: string
}

export interface OfflineEventDetail extends OfflineEvent {
  landing?: LandingPage | null
  public_url?: string | null
  poster?: Poster | null
  registrations: number
}
