/// <reference types="cypress" />

describe('ChatHome 对话首页', () => {
  it('渲染欢迎页并能与 AI 助手对话', () => {
    cy.visit('/')

    cy.get('[data-testid="chat-home"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="quick-action"]').its('length').should('be.gte', 1)

    // 输入并发送
    cy.get('[data-testid="chat-input"]').type('帮我看看高价值客户')
    cy.get('[data-testid="chat-send"]').click()

    // 用户消息气泡出现
    cy.get('[data-testid="chat-message"][data-role="user"]', { timeout: 15000 }).should(
      'be.visible'
    )

    // AI 助手回复气泡出现（AI 调用，给较长超时）
    cy.get('[data-testid="chat-message"][data-role="assistant"]', { timeout: 25000 }).should(
      'be.visible'
    )
  })
})
