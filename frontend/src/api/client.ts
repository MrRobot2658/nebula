import axios from 'axios'
import type {
  AiSuggestResponse,
  Automation,
  AutomationRun,
  Campaign,
  Channel,
  Customer,
  CustomerDetail,
  DashboardStats,
  Event,
  Message,
  ScoreRule,
  Template,
} from './types'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ---- Dashboard ----
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

// ---- Channels ----
export async function getChannels(): Promise<Channel[]> {
  const { data } = await api.get<Channel[]>('/channels')
  return data
}

export async function patchChannel(
  id: number,
  body: { enabled?: boolean; config?: Record<string, unknown> }
): Promise<Channel> {
  const { data } = await api.patch<Channel>(`/channels/${id}`, body)
  return data
}

// ---- Customers ----
export async function getCustomers(params?: {
  search?: string
  limit?: number
}): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>('/customers', { params })
  return data
}

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const { data } = await api.get<CustomerDetail>(`/customers/${id}`)
  return data
}

export async function createCustomer(body: {
  name: string
  phone?: string
  email?: string
  source_channel?: string
}): Promise<Customer> {
  const { data } = await api.post<Customer>('/customers', body)
  return data
}

export async function patchCustomerTags(
  id: number,
  tags: string[]
): Promise<Customer> {
  const { data } = await api.patch<Customer>(`/customers/${id}/tags`, { tags })
  return data
}

// ---- Messages ----
export async function getMessages(customerId?: number): Promise<Message[]> {
  const { data } = await api.get<Message[]>('/messages', {
    params: customerId != null ? { customer_id: customerId } : undefined,
  })
  return data
}

export async function sendMessage(body: {
  customer_id: number
  channel_id?: number
  content: string
  template_id?: number
}): Promise<Message> {
  const { data } = await api.post<Message>('/messages/send', body)
  return data
}

export async function inboundMessage(body: {
  customer_id?: number
  customer_name?: string
  channel_key: string
  content: string
}): Promise<Message> {
  const { data } = await api.post<Message>('/messages/inbound', body)
  return data
}

// ---- Templates ----
export async function getTemplates(): Promise<Template[]> {
  const { data } = await api.get<Template[]>('/templates')
  return data
}

export async function createTemplate(body: {
  name: string
  category: string
  channel_key?: string
  content: string
}): Promise<Template> {
  const { data } = await api.post<Template>('/templates', body)
  return data
}

// ---- Campaigns ----
export async function getCampaigns(): Promise<Campaign[]> {
  const { data } = await api.get<Campaign[]>('/campaigns')
  return data
}

export async function createCampaign(body: {
  name: string
  channel_key?: string
}): Promise<Campaign> {
  const { data } = await api.post<Campaign>('/campaigns', body)
  return data
}

// ---- Automations ----
export async function getAutomations(): Promise<Automation[]> {
  const { data } = await api.get<Automation[]>('/automations')
  return data
}

export async function createAutomation(body: {
  name: string
  trigger_event: string
  conditions?: Record<string, unknown>
  actions: Record<string, unknown>[]
}): Promise<Automation> {
  const { data } = await api.post<Automation>('/automations', body)
  return data
}

export async function patchAutomation(
  id: number,
  enabled: boolean
): Promise<Automation> {
  const { data } = await api.patch<Automation>(`/automations/${id}`, { enabled })
  return data
}

export async function getAutomationRuns(limit?: number): Promise<AutomationRun[]> {
  const { data } = await api.get<AutomationRun[]>('/automations/runs', {
    params: limit != null ? { limit } : undefined,
  })
  return data
}

// ---- Scoring ----
export async function getScoreRules(): Promise<ScoreRule[]> {
  const { data } = await api.get<ScoreRule[]>('/scoring/rules')
  return data
}

export async function createScoreRule(body: {
  name: string
  event_type: string
  dimension: string
  points: number
}): Promise<ScoreRule> {
  const { data } = await api.post<ScoreRule>('/scoring/rules', body)
  return data
}

// ---- AI ----
export const aiSuggest = (body: { customer_id?: number; content: string }) =>
  api.post<AiSuggestResponse>('/ai/suggest', body).then((r) => r.data)

// ---- Events ----
export async function getEvents(limit?: number): Promise<Event[]> {
  const { data } = await api.get<Event[]>('/events', {
    params: limit != null ? { limit } : undefined,
  })
  return data
}
