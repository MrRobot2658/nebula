/// <reference types="cypress" />

describe('渠道详情页', () => {
  it('从渠道列表进入详情、展示能力并模拟事件', () => {
    cy.visit('/channels')

    // 点击第一张渠道卡进入详情
    cy.get('[data-testid="channel-card"]', { timeout: 15000 })
      .first()
      .click()

    cy.location('pathname', { timeout: 15000 }).should('match', /\/channels\/.+/)

    // 详情容器与能力列表
    cy.get('[data-testid="channel-detail"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="capability-item"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 触发一个事件模拟
    cy.get('[data-testid="simulate-event-button"]', { timeout: 15000 })
      .first()
      .click()

    // 最近事件区出现条目
    cy.get('[data-testid="channel-events"]', { timeout: 15000 })
      .find('[data-testid="channel-event-item"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)
  })
})
