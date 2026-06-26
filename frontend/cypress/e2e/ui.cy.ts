/// <reference types="cypress" />

describe('Nebula 控制台 UI e2e', () => {
  it('仪表盘展示统计卡片', () => {
    cy.visit('/')
    cy.get('[data-testid="stat-customers"]', { timeout: 15000 }).should('be.visible')
    cy.contains('客户总数').should('be.visible')
    cy.contains('平均评分').should('be.visible')
  })

  it('收件箱：模拟来消息触发 AI 建议与自动回复', () => {
    cy.visit('/inbox')

    // 选择列表中的第一个客户
    cy.get('[data-testid="customer-row"]', { timeout: 15000 })
      .first()
      .click()

    // 记录模拟前的消息气泡数量
    cy.get('body').then(($body) => {
      const before = $body.find('[data-testid="message-bubble"]').length

      // 点击「模拟客户来消息」
      cy.get('[data-testid="sim-inbound"]').should('be.visible').click()

      // 会话中出现新的消息气泡（异步，给较长超时）
      cy.get('[data-testid="message-bubble"]', { timeout: 20000 }).should(
        ($bubbles) => {
          expect($bubbles.length).to.be.greaterThan(before)
        }
      )
    })

    // AI 建议卡片出现
    cy.get('[data-testid="ai-suggestion"]', { timeout: 20000 }).should('be.visible')
  })

  it('渠道：切换开关并反映状态', () => {
    cy.visit('/channels')

    cy.get('[data-testid="channel-toggle"]', { timeout: 15000 })
      .first()
      .then(($btn) => {
        const before = $btn.attr('data-enabled')
        cy.wrap($btn).click()
        cy.get('[data-testid="channel-toggle"]')
          .first()
          .should(($after) => {
            expect($after.attr('data-enabled')).to.not.eq(before)
          })
      })
  })
})
