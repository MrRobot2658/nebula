/// <reference types="cypress" />

describe('评分模型页', () => {
  it('展示评分规则并能创建规则', () => {
    cy.visit('/scoring')

    // 规则表格渲染
    cy.get('[data-testid="score-rule-table"]', { timeout: 15000 }).should('be.visible')

    // 创建唯一规则
    const name = `Cy规则_${Date.now()}`
    cy.contains('button', '新建规则').click()
    cy.get('input[placeholder="如 主动咨询加分"]', { timeout: 10000 }).type(name)
    cy.contains('button', '保存').click()

    // 新规则出现（行可能被滚动容器裁剪，滚动到可视区后断言存在）
    cy.contains('[data-testid="score-rule-row"]', name, { timeout: 15000 })
      .scrollIntoView()
      .should('exist')
    cy.get('[data-testid="score-rule-row"]')
      .its('length')
      .should('be.greaterThan', 0)
  })
})
