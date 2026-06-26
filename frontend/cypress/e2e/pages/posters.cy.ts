/// <reference types="cypress" />

describe('海报页', () => {
  it('展示海报卡片并能新建海报', () => {
    cy.visit('/posters')

    // 现有海报卡片渲染（种子 >= 2）
    cy.get('[data-testid="poster-card"]', { timeout: 15000 })
      .its('length')
      .should('be.gte', 2)

    // 创建唯一海报
    const name = `Cy海报_${Date.now()}`
    cy.get('[data-testid="new-poster-button"]').click()
    cy.get('input[placeholder="如 双十一裂变海报"]', { timeout: 10000 }).type(name)
    cy.get('input[placeholder="主标题文案"]').type('限时福利')
    cy.contains('button', '保存').click()

    // 新海报出现
    cy.get('[data-testid="poster-card"]', { timeout: 15000 })
      .contains(name)
      .should('be.visible')
  })
})
