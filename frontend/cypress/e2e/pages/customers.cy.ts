/// <reference types="cypress" />

describe('客户列表页', () => {
  it('展示客户表格并能新建客户', () => {
    cy.visit('/customers')

    // 表格渲染
    cy.get('[data-testid="customer-table"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="customer-row"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 打开新建客户表单并创建唯一客户
    const name = `Cy客户_${Date.now()}`
    cy.get('[data-testid="new-customer-button"]').click()
    cy.get('input[placeholder="请输入客户姓名"]', { timeout: 10000 }).type(name)
    cy.contains('button', '保存').click()

    // 新客户出现在列表中
    cy.get('[data-testid="customer-table"]', { timeout: 15000 })
      .contains(name)
      .should('be.visible')
  })
})
