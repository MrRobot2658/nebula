/// <reference types="cypress" />

describe('落地页', () => {
  it('展示落地页、创建并记录访问递增浏览量', () => {
    cy.visit('/landing-pages')

    // 现有落地页渲染
    cy.get('[data-testid="landing-table"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="landing-row"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)

    // 创建唯一落地页
    const title = `Cy落地页_${Date.now()}`
    cy.get('[data-testid="new-landing-button"]').click()
    cy.get('input[placeholder="如 新品首发活动"]', { timeout: 10000 }).type(title)
    cy.contains('button', '保存').click()

    // 新落地页出现并被选中预览
    cy.get('[data-testid="landing-table"]', { timeout: 15000 })
      .contains(title)
      .should('be.visible')
      .click()

    // 记录当前浏览量，点击「记录访问」后应递增
    cy.get('[data-testid="landing-detail-views"]', { timeout: 15000 })
      .invoke('text')
      .then((before) => {
        const beforeNum = parseInt(before, 10)
        cy.get('[data-testid="record-view-button"]').click()
        cy.get('[data-testid="landing-detail-views"]')
          .should(($el) => {
            expect(parseInt($el.text(), 10)).to.be.greaterThan(beforeNum)
          })
      })
  })
})
