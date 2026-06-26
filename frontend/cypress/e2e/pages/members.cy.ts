/// <reference types="cypress" />

describe('会员页', () => {
  it('展示会员、搜索过滤并进入会员画像页', () => {
    cy.visit('/members')

    // 会员表格渲染（种子 >= 2）
    cy.get('[data-testid="member-table"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="member-row"]', { timeout: 15000 }).should('have.length.gte', 2)

    // 记录第一位会员姓名首字用于搜索
    cy.get('[data-testid="member-row"]').first().invoke('text').then((text) => {
      const keyword = text.replace(/\s/g, '').slice(0, 1)
      cy.get('[data-testid="member-search"]').clear().type(keyword)
      cy.wait(700) // 等待防抖触发重新拉取后再断言
      // 单个可重试的回调断言，避免 .each 持有已分离的 DOM 引用
      cy.get('[data-testid="member-row"]', { timeout: 10000 }).should(($rows) => {
        expect($rows.length, '过滤后至少一行').to.be.gte(1)
        $rows.each((_, el) => {
          expect(el.innerText).to.contain(keyword)
        })
      })
    })

    // 清空搜索后进入第一位会员的画像页
    cy.get('[data-testid="member-search"]').clear()
    cy.wait(700)
    cy.get('[data-testid="member-row"]', { timeout: 15000 }).should('have.length.gte', 1)
    cy.get('[data-testid="member-row"]').first().click()

    // 独立的会员画像路由
    cy.location('pathname', { timeout: 15000 }).should('match', /\/members\/\d+$/)
    cy.get('[data-testid="member-profile"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="member-profile-level"]').should('be.visible')
    cy.get('[data-testid="member-profile-transactions"]').should('exist')

    // 订单与购买商品区块渲染
    cy.get('[data-testid="member-orders"]', { timeout: 15000 }).should('exist')
    cy.get('[data-testid="member-products"]').should('exist')

    // 模拟下单后应出现订单行（无论该会员是否已有订单都能稳定通过）
    cy.get('[data-testid="place-order-button"]').click()
    cy.get('[data-testid="member-orders"]', { timeout: 15000 })
      .find('[data-testid="order-row"]')
      .its('length')
      .should('be.gte', 1)
  })
})
