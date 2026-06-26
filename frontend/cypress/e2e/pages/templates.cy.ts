/// <reference types="cypress" />

describe('模板库页', () => {
  it('展示模板并能创建模板', () => {
    cy.visit('/templates')

    // 现有模板渲染
    cy.get('[data-testid="template-card"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 创建唯一模板
    const name = `Cy模板_${Date.now()}`
    cy.contains('button', '新建模板').click()
    cy.get('input[placeholder="如 欢迎语"]', { timeout: 10000 }).type(name)
    cy.get('textarea[placeholder="您好 {{name}}，欢迎使用…"]').type(
      '您好 {{name}}，这是自动化测试模板。',
      { parseSpecialCharSequences: false }
    )
    cy.contains('button', '保存').click()

    // 新模板出现
    cy.get('[data-testid="template-card"]', { timeout: 15000 })
      .contains(name)
      .should('be.visible')
  })
})
