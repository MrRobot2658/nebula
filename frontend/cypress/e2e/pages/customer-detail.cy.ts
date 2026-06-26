/// <reference types="cypress" />

describe('客户详情页', () => {
  it('从列表进入详情并展示画像与时间线', () => {
    cy.visit('/customers')

    cy.get('[data-testid="customer-row"]', { timeout: 15000 })
      .first()
      .click()

    // 进入详情路由
    cy.location('pathname', { timeout: 15000 }).should('match', /\/customers\/\d+$/)

    // 画像卡片（含评分条）
    cy.get('[data-testid="customer-profile"]', { timeout: 15000 })
      .should('be.visible')
      .within(() => {
        cy.contains('评分').should('be.visible')
      })

    // 时间线
    cy.get('[data-testid="customer-timeline"]', { timeout: 15000 }).should('be.visible')
    cy.contains('客户时间线').should('be.visible')
  })
})
