/// <reference types="cypress" />

describe('自动化流程页', () => {
  it('展示流程卡片、可切换开关、并有最近执行', () => {
    cy.visit('/automations')

    // 流程卡片渲染
    cy.get('[data-testid="automation-card"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 切换第一个开关并断言状态变化
    cy.get('[data-testid="automation-toggle"]')
      .first()
      .then(($btn) => {
        const before = $btn.attr('data-enabled')
        cy.wrap($btn).click()
        cy.get('[data-testid="automation-toggle"]')
          .first()
          .should(($after) => {
            expect($after.attr('data-enabled')).to.not.eq(before)
          })
      })

    // 最近执行区块存在
    cy.contains('最近执行').should('be.visible')
  })
})
