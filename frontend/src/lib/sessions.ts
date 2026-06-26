export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  intent?: string
}

export interface ChatSession {
  id: string
  title: string
  updatedAt: number
  messages: ChatMessage[]
}

const STORAGE_KEY = 'nebula.chat.sessions'
const MAX_SESSIONS = 30
export const SESSIONS_EVENT = 'nebula-sessions-updated'

export function newId(prefix = 's'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    if (!Array.isArray(parsed)) return []
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function getSession(id: string): ChatSession | undefined {
  return loadSessions().find((s) => s.id === id)
}

export function saveSession(session: ChatSession): void {
  try {
    const all = loadSessions().filter((s) => s.id !== session.id)
    all.unshift(session)
    const trimmed = all
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    window.dispatchEvent(new Event(SESSIONS_EVENT))
  } catch {
    /* storage unavailable — ignore */
  }
}

export function deleteSession(id: string): void {
  try {
    const all = loadSessions().filter((s) => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event(SESSIONS_EVENT))
  } catch {
    /* ignore */
  }
}

export function titleFromMessage(content: string): string {
  const t = content.trim().replace(/\s+/g, ' ')
  return t.length > 24 ? `${t.slice(0, 24)}…` : t || '新对话'
}
