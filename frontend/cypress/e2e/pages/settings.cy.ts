/// <reference types="cypress" />

describe('设置页', () => {
  it('展示全部功能模块并能进入', () => {
    cy.visit('/settings')

    cy.get('[data-testid="settings-page"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="settings-item"]', { timeout: 15000 })
      .its('length')
      .should('be.gte', 1)

    // 点击其中一个模块应跳转到对应路由
    cy.contains('[data-testid="settings-item"]', '仪表盘').click()
    cy.location('pathname', { timeout: 15000 }).should('eq', '/dashboard')
  })
})
