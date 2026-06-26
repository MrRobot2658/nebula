/// <reference types="cypress" />

describe('营销活动页', () => {
  it('展示活动列表并能创建活动', () => {
    cy.visit('/campaigns')

    // 列表（表格）渲染
    cy.get('[data-testid="campaign-table"]', { timeout: 15000 }).should('be.visible')

    // 创建唯一活动
    const name = `Cy活动_${Date.now()}`
    cy.contains('button', '新建活动').click()
    cy.get('input[placeholder="如 618 大促唤醒"]', { timeout: 10000 }).type(name)
    cy.contains('button', '创建').click()

    // 新活动出现且带状态徽标
    cy.get('[data-testid="campaign-row"]', { timeout: 15000 })
      .contains(name)
      .should('be.visible')
    cy.contains('[data-testid="campaign-row"]', name)
      .find('.campaign-status')
      .should('exist')
  })
})
