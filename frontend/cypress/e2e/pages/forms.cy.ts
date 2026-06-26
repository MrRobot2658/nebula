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

  it('预览模式：渲染可填写表单并成功提交', () => {
    cy.visit('/forms')

    cy.get('[data-testid="form-row"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 打开第一个表单的预览
    cy.get('[data-testid="preview-form-button"]', { timeout: 15000 }).first().click()

    // 预览容器可见且包含至少一个输入框
    cy.get('[data-testid="form-preview"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="form-preview"]')
      .find('input, textarea')
      .its('length')
      .should('be.greaterThan', 0)

    // 填写所有输入框（数字串可兼容 text/tel/email/number 等类型）
    cy.get('[data-testid="form-preview"]')
      .find('input, textarea')
      .each(($el) => {
        cy.wrap($el).type('13800138000')
      })

    // 提交并断言成功提示
    cy.get('[data-testid="form-preview-submit"]').click()
    cy.get('[data-testid="form-preview"]', { timeout: 15000 })
      .contains('提交成功')
      .should('be.visible')
  })
})
