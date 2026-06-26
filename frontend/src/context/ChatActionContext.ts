import { createContext, useContext } from 'react'

export interface ChatAction {
  /** Send a follow-up message into the conversation (e.g. from an inline card). */
  ask: (text: string) => void
}

export const ChatActionCtx = createContext<ChatAction>({ ask: () => {} })

export function useChatAction(): ChatAction {
  return useContext(ChatActionCtx)
}
