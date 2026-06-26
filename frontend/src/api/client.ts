import axios from 'axios'
import type {
  AbResult,
  AiSuggestResponse,
  Automation,
  AutomationRun,
  Campaign,
  Channel,
  ChannelDetail,
  Customer,
  CustomerDetail,
  DashboardStats,
  Event,
  Flow,
  FlowEdge,
  FlowNode,
  FlowRun,
  Form,
  FormDetail,
  FormSubmission,
  LandingPage,
  Member,
  MemberDetail,
  Message,
  OfflineEvent,
  OfflineEventDetail,
  Order,
  OrderItem,
  Poster,
  ScoreRule,
  Template,
  Webinar,
  WebinarDetail,
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

export async function getChannel(key: string): Promise<ChannelDetail> {
  const { data } = await api.get<ChannelDetail>(`/channels/${key}`)
  return data
}

export async function simulateChannelEvent(
  key: string,
  body: { event_key: string; customer_id?: number; content?: string }
): Promise<{ event: Event; message?: Message | null }> {
  const { data } = await api.post<{ event: Event; message?: Message | null }>(
    `/channels/${key}/simulate`,
    body
  )
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

// ---- Forms ----
export async function getForms(): Promise<Form[]> {
  const { data } = await api.get<Form[]>('/forms')
  return data
}

export async function getForm(id: number): Promise<FormDetail> {
  const { data } = await api.get<FormDetail>(`/forms/${id}`)
  return data
}

export async function createForm(body: {
  name: string
  channel_key?: string
  fields: { key: string; label: string; type: string; required: boolean }[]
}): Promise<Form> {
  const { data } = await api.post<Form>('/forms', body)
  return data
}

export async function submitForm(
  id: number,
  body: {
    data: Record<string, unknown>
    name?: string
    phone?: string
    email?: string
    channel_key?: string
  }
): Promise<FormSubmission> {
  const { data } = await api.post<FormSubmission>(`/forms/${id}/submit`, body)
  return data
}

// ---- Landing Pages ----
export async function getLandingPages(): Promise<LandingPage[]> {
  const { data } = await api.get<LandingPage[]>('/landing-pages')
  return data
}

export async function getLandingPage(id: number): Promise<LandingPage> {
  const { data } = await api.get<LandingPage>(`/landing-pages/${id}`)
  return data
}

export async function createLandingPage(body: {
  title: string
  headline?: string
  body?: string
  slug?: string
  form_id?: number
  channel_key?: string
}): Promise<LandingPage> {
  const { data } = await api.post<LandingPage>('/landing-pages', body)
  return data
}

export async function patchLandingPage(
  id: number,
  body: {
    title?: string
    headline?: string
    body?: string
    status?: string
    form_id?: number
  }
): Promise<LandingPage> {
  const { data } = await api.patch<LandingPage>(`/landing-pages/${id}`, body)
  return data
}

export async function viewLandingPage(id: number): Promise<LandingPage> {
  const { data } = await api.post<LandingPage>(`/landing-pages/${id}/view`)
  return data
}

// ---- Posters ----
export async function getPosters(): Promise<Poster[]> {
  const { data } = await api.get<Poster[]>('/posters')
  return data
}

export async function getPosterTemplates(): Promise<string[]> {
  const { data } = await api.get<string[]>('/posters/templates')
  return data
}

export async function createPoster(body: {
  name: string
  template: string
  title: string
  subtitle: string
  cta?: string
  qr_target?: string
}): Promise<Poster> {
  const { data } = await api.post<Poster>('/posters', body)
  return data
}

// ---- Members ----
export async function getMembers(search?: string): Promise<Member[]> {
  const { data } = await api.get<Member[]>('/members', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function createMember(customerId: number): Promise<Member> {
  const { data } = await api.post<Member>('/members', { customer_id: customerId })
  return data
}

export async function getMember(customerId: number): Promise<MemberDetail> {
  const { data } = await api.get<MemberDetail>(`/members/${customerId}`)
  return data
}

export async function adjustMemberPoints(
  customerId: number,
  body: { delta: number; reason: string }
): Promise<Member> {
  const { data } = await api.post<Member>(`/members/${customerId}/points`, body)
  return data
}

// ---- Webinars ----
export async function getWebinars(): Promise<Webinar[]> {
  const { data } = await api.get<Webinar[]>('/webinars')
  return data
}

export async function createWebinar(body: {
  title: string
  host?: string
  scheduled_at?: string
  channel_key?: string
  form_id?: number
}): Promise<Webinar> {
  const { data } = await api.post<Webinar>('/webinars', body)
  return data
}

export async function getWebinar(id: number): Promise<WebinarDetail> {
  const { data } = await api.get<WebinarDetail>(`/webinars/${id}`)
  return data
}

export async function patchWebinar(
  id: number,
  body: { status?: string; form_id?: number }
): Promise<Webinar> {
  const { data } = await api.patch<Webinar>(`/webinars/${id}`, body)
  return data
}

export async function sendWebinarForm(
  id: number,
  body: { form_id?: number } = {}
): Promise<WebinarDetail> {
  const { data } = await api.post<WebinarDetail>(`/webinars/${id}/send-form`, body)
  return data
}

// ---- Offline Events ----
export async function getOfflineEvents(): Promise<OfflineEvent[]> {
  const { data } = await api.get<OfflineEvent[]>('/offline-events')
  return data
}

export async function createOfflineEvent(body: {
  title: string
  location?: string
  scheduled_at?: string
  landing_page_id?: number
  poster_id?: number
}): Promise<OfflineEvent> {
  const { data } = await api.post<OfflineEvent>('/offline-events', body)
  return data
}

export async function getOfflineEvent(id: number): Promise<OfflineEventDetail> {
  const { data } = await api.get<OfflineEventDetail>(`/offline-events/${id}`)
  return data
}

export async function patchOfflineEvent(
  id: number,
  body: { status?: string; landing_page_id?: number; poster_id?: number }
): Promise<OfflineEvent> {
  const { data } = await api.patch<OfflineEvent>(`/offline-events/${id}`, body)
  return data
}

export async function checkinOfflineEvent(
  id: number,
  body: { customer_id?: number } = {}
): Promise<OfflineEvent> {
  const { data } = await api.post<OfflineEvent>(`/offline-events/${id}/checkin`, body)
  return data
}

// ---- Orders ----
export async function getCustomerOrders(customerId: number): Promise<Order[]> {
  const { data } = await api.get<Order[]>(`/customers/${customerId}/orders`)
  return data
}

export async function createOrder(body: {
  customer_id: number
  items: OrderItem[]
  amount?: number
  status?: string
}): Promise<Order> {
  const { data } = await api.post<Order>('/orders', body)
  return data
}

// ---- Flows (automation canvas) ----
export async function getFlows(): Promise<Flow[]> {
  const { data } = await api.get<Flow[]>('/flows')
  return data
}

export async function createFlow(body: {
  name: string
  nodes?: FlowNode[]
  edges?: FlowEdge[]
}): Promise<Flow> {
  const { data } = await api.post<Flow>('/flows', body)
  return data
}

export async function getFlow(id: number): Promise<Flow> {
  const { data } = await api.get<Flow>(`/flows/${id}`)
  return data
}

export async function saveFlow(
  id: number,
  body: { name?: string; status?: string; nodes: FlowNode[]; edges: FlowEdge[] }
): Promise<Flow> {
  const { data } = await api.patch<Flow>(`/flows/${id}`, body)
  return data
}

export async function runFlow(
  id: number,
  body: { customer_id?: number } = {}
): Promise<FlowRun> {
  const { data } = await api.post<FlowRun>(`/flows/${id}/run`, body)
  return data
}

export async function getFlowRuns(id: number): Promise<FlowRun[]> {
  const { data } = await api.get<FlowRun[]>(`/flows/${id}/runs`)
  return data
}

export async function getAbResults(id: number): Promise<AbResult[]> {
  const { data } = await api.get<AbResult[]>(`/flows/${id}/abtest-results`)
  return data
}
