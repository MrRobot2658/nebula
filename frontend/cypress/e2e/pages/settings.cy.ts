/// <reference types="cypress" />

describe('设置弹窗', () => {
  it('从侧栏打开设置弹窗并切换各标签', () => {
    cy.visit('/')

    // 从侧栏打开设置弹窗
    cy.get('[data-testid="settings-nav"]', { timeout: 15000 }).click()
    cy.get('[data-testid="settings-modal"]', { timeout: 15000 }).should('be.visible')

    // 默认 Skills 标签：至少一条 skill-row
    cy.get('[data-testid="skill-row"]', { timeout: 15000 })
      .its('length')
      .should('be.gte', 1)

    // MCP
    cy.get('[data-testid="settings-tab-mcp"]').click()
    cy.get('[data-testid="mcp-row"]', { timeout: 15000 }).its('length').should('be.gte', 1)

    // 记忆
    cy.get('[data-testid="settings-tab-memory"]').click()
    cy.get('[data-testid="memory-row"]', { timeout: 15000 }).its('length').should('be.gte', 1)

    // Token 消耗
    cy.get('[data-testid="settings-tab-token"]').click()
    cy.get('[data-testid="token-total"]', { timeout: 15000 }).should('be.visible')
  })
})
