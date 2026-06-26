/// <reference types="cypress" />

describe('自动化画布', () => {
  it('新建流程、编辑画布、保存并运行', () => {
    cy.visit('/flows')

    // 流程列表渲染
    cy.get('[data-testid="flow-list"]', { timeout: 15000 }).should('be.visible')

    // 新建流程 → 跳转到画布编辑器
    cy.get('[data-testid="new-flow-button"]').click()
    cy.location('pathname', { timeout: 15000 }).should('match', /\/flows\/\d+$/)

    // React Flow 画布与组件面板渲染
    cy.get('.react-flow', { timeout: 15000 }).should('exist')
    cy.get('[data-testid="node-palette"]', { timeout: 15000 }).should('be.visible')

    // 通过组件面板添加一个「动作」节点
    cy.get('[data-testid="palette-action"]').click()
    cy.get('.react-flow__node', { timeout: 15000 }).should('have.length.gte', 1)

    // 保存
    cy.get('[data-testid="save-flow-button"]').click()

    // 运行 → 执行日志至少 1 条
    cy.get('[data-testid="run-flow-button"]').click()
    cy.get('[data-testid="flow-run-log"]', { timeout: 15000 })
      .find('[data-testid="run-log-item"]')
      .its('length')
      .should('be.gte', 1)
  })
})
