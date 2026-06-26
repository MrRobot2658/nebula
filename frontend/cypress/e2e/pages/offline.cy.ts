/// <reference types="cypress" />

const apiBase = Cypress.env('apiBase') as string

interface OfflineLite {
  id: number
  landing_page_id?: number | null
}

describe('线下会议页', () => {
  it('展示会议卡片并能新建会议', () => {
    cy.visit('/offline-events')

    cy.get('[data-testid="offline-grid"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="offline-card"]', { timeout: 15000 })
      .its('length')
      .should('be.gte', 1)

    const title = `Cy会议_${Date.now()}`
    cy.get('[data-testid="new-offline-button"]').click()
    cy.get('input[placeholder="如 城市合伙人见面会"]', { timeout: 10000 }).type(title)
    cy.contains('button', '保存').click()

    cy.get('[data-testid="offline-grid"]', { timeout: 15000 })
      .contains(title)
      .should('be.visible')
  })

  it('打开会议详情：扫码报名 QR 与公开页链接，现场签到递增', () => {
    // 选择带落地页的会议（卡片顺序与接口顺序一致）
    cy.request(`${apiBase}/api/offline-events`).then((res) => {
      const list = res.body as OfflineLite[]
      const idx = Math.max(
        0,
        list.findIndex((e) => e.landing_page_id != null)
      )

      cy.visit('/offline-events')
      cy.get('[data-testid="offline-card"]', { timeout: 15000 }).should('exist')
      cy.get('[data-testid="offline-card"]').eq(idx).click()

      // QR 与公开页链接渲染
      cy.get('[data-testid="offline-qr"]', { timeout: 15000 }).should('be.visible')
      cy.get('[data-testid="offline-public-link"]')
        .should('have.attr', 'href')
        .and('match', /^\/l\//)

      // 现场签到后签到数递增
      cy.get('[data-testid="offline-checkins"]', { timeout: 15000 })
        .invoke('text')
        .then((before) => {
          const beforeNum = parseInt(before, 10)
          cy.get('[data-testid="checkin-button"]').click()
          cy.get('[data-testid="offline-checkins"]').should(($el) => {
            expect(parseInt($el.text(), 10)).to.be.greaterThan(beforeNum)
          })
        })
    })
  })
})
