/// <reference types="cypress" />

describe('ChatApp 对话式工作台', () => {
  it('在对话中通过指令渲染内联功能卡片', () => {
    cy.visit('/')

    cy.get('[data-testid="chat-home"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="quick-action"]').its('length').should('be.gte', 1)

    // 卡片在可滚动的对话区内，用 scrollIntoView + exist 断言（避免被 overflow 裁剪判为不可见）
    // 客户 → 内联客户卡片
    cy.get('[data-testid="chat-input"]').type('客户')
    cy.get('[data-testid="chat-send"]').click()
    cy.get('[data-testid="chat-message"][data-role="user"]', { timeout: 15000 }).should('exist')
    cy.get('[data-testid="view-customers"]', { timeout: 25000 }).scrollIntoView().should('exist')

    // 看板 → 内联概览卡片
    cy.get('[data-testid="chat-input"]').type('看板')
    cy.get('[data-testid="chat-send"]').click()
    cy.get('[data-testid="view-dashboard"]', { timeout: 25000 }).scrollIntoView().should('exist')

    // 自动化流程 → 内联流程卡片
    cy.get('[data-testid="chat-input"]').type('自动化流程')
    cy.get('[data-testid="chat-send"]').click()
    cy.get('[data-testid="view-flows"]', { timeout: 25000 }).scrollIntoView().should('exist')
  })

  it('查看某客户详情 → 对话内联展示会员详情卡片（不跳转）', () => {
    cy.visit('/')
    cy.get('[data-testid="chat-input"]', { timeout: 15000 }).type('查看 王五 的详情')
    cy.get('[data-testid="chat-send"]').click()
    cy.get('[data-testid="view-profile"]', { timeout: 25000 }).scrollIntoView().should('exist')
    cy.get('[data-testid="profile-member"]', { timeout: 15000 }).should('exist')
    cy.location('pathname').should('eq', '/') // 始终留在对话页
  })
})
