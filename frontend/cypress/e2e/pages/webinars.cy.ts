/// <reference types="cypress" />

const apiBase = Cypress.env('apiBase') as string

interface WebinarLite {
  id: number
  form_id?: number | null
}

describe('线上直播页', () => {
  it('展示直播卡片并能新建直播', () => {
    cy.visit('/webinars')

    // 现有直播渲染（种子 >= 1）
    cy.get('[data-testid="webinar-grid"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="webinar-card"]', { timeout: 15000 })
      .its('length')
      .should('be.gte', 1)

    // 创建唯一直播
    const title = `Cy直播_${Date.now()}`
    cy.get('[data-testid="new-webinar-button"]').click()
    cy.get('input[placeholder="如 新品发布直播"]', { timeout: 10000 }).type(title)
    cy.contains('button', '保存').click()

    cy.get('[data-testid="webinar-grid"]', { timeout: 15000 })
      .contains(title)
      .should('be.visible')
  })

  it('打开带表单的直播并发送表单', () => {
    // 找一个关联了表单的直播（卡片顺序与接口顺序一致）
    cy.request(`${apiBase}/api/webinars`).then((res) => {
      const list = res.body as WebinarLite[]
      const idx = Math.max(
        0,
        list.findIndex((w) => w.form_id != null)
      )

      cy.visit('/webinars')
      cy.get('[data-testid="webinar-card"]', { timeout: 15000 }).should('exist')
      cy.get('[data-testid="webinar-card"]').eq(idx).click()

      // 读取当前已发送数量，点击发送表单后应递增并显示「已发送」
      cy.get('[data-testid="send-form-button"]', { timeout: 15000 }).should('not.be.disabled')
      cy.get('[data-testid="webinar-forms-sent"]', { timeout: 15000 })
        .invoke('text')
        .then((before) => {
          const beforeNum = parseInt(before, 10)
          cy.get('[data-testid="send-form-button"]').click()
          cy.get('[data-testid="send-form-button"]', { timeout: 15000 }).should(
            'contain.text',
            '已发送'
          )
          cy.get('[data-testid="webinar-forms-sent"]').should(($el) => {
            expect(parseInt($el.text(), 10)).to.be.greaterThan(beforeNum)
          })
        })
    })
  })
})
