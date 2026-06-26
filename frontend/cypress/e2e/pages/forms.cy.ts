/// <reference types="cypress" />

describe('表单页', () => {
  it('展示表单并能新建表单', () => {
    cy.visit('/forms')

    // 现有表单渲染
    cy.get('[data-testid="form-table"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="form-row"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 创建唯一表单
    const name = `Cy表单_${Date.now()}`
    cy.get('[data-testid="new-form-button"]').click()
    cy.get('input[placeholder="如 预约咨询表单"]', { timeout: 10000 }).type(name)
    cy.contains('button', '保存').click()

    // 新表单出现
    cy.get('[data-testid="form-table"]', { timeout: 15000 })
      .contains(name)
      .should('be.visible')
  })
})
