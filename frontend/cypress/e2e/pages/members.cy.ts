/// <reference types="cypress" />

describe('会员页', () => {
  it('展示会员并打开详情查看等级与流水', () => {
    cy.visit('/members')

    // 会员表格渲染（种子 >= 2）
    cy.get('[data-testid="member-table"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="member-row"]', { timeout: 15000 })
      .its('length')
      .should('be.gte', 2)

    // 打开第一位会员详情
    cy.get('[data-testid="member-row"]').first().click()

    // 详情面板展示等级与积分流水（部分文字在可滚动容器内，断言存在并滚动到可视区）
    cy.contains('会员详情').should('be.visible')
    cy.contains('当前积分', { timeout: 15000 }).scrollIntoView().should('exist')
    cy.contains('积分流水').scrollIntoView().should('exist')
  })
})
