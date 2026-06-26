/// <reference types="cypress" />

const apiBase = Cypress.env('apiBase') as string

interface Customer {
  id: number
  tags: string[]
  score: number
}

interface Message {
  direction: 'in' | 'out'
}

interface CustomerDetail extends Customer {
  messages: Message[]
}

interface EventItem {
  type: string
}

describe('Nebula 后端 API e2e', () => {
  it('GET /health → ok', () => {
    cy.request(`${apiBase}/health`).then((res) => {
      expect(res.status).to.eq(200)
      const body = res.body as { status?: string }
      // 允许 {status:'ok'} 或纯 'ok' 等形态
      const text = JSON.stringify(body).toLowerCase()
      expect(text).to.contain('ok')
    })
  })

  it('GET /api/dashboard/stats → 关键指标', () => {
    cy.request(`${apiBase}/api/dashboard/stats`).then((res) => {
      expect(res.status).to.eq(200)
      const body = res.body as {
        customers: number
        messages_trend: unknown[]
        channels_enabled: number
      }
      expect(body.customers).to.be.greaterThan(0)
      expect(body.messages_trend).to.have.length(7)
      expect(body.channels_enabled).to.be.gte(1)
    })
  })

  it('GET /api/channels → 9 个渠道', () => {
    cy.request(`${apiBase}/api/channels`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.length(9)
    })
  })

  it('POST /api/messages/inbound → 触发评分与自动化回复', () => {
    cy.request('POST', `${apiBase}/api/messages/inbound`, {
      customer_name: 'Cypress访客',
      channel_key: 'wechat',
      content: '你好，这款多少钱？',
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201])
      const customerId = (res.body as { customer_id: number }).customer_id
      expect(customerId).to.be.a('number')

      const pollCustomer = (attempt: number): void => {
        cy.request(`${apiBase}/api/customers/${customerId}`).then((r) => {
          const c = r.body as CustomerDetail
          const hasTag = Array.isArray(c.tags) && c.tags.includes('已互动')
          const hasOutbound =
            Array.isArray(c.messages) &&
            c.messages.some((m) => m.direction === 'out')
          const scoreOk = typeof c.score === 'number' && c.score >= 10

          if ((hasTag && hasOutbound && scoreOk) || attempt >= 15) {
            expect(c.tags, '标签包含 已互动').to.include('已互动')
            expect(hasOutbound, '存在 direction=out 的消息').to.eq(true)
            expect(c.score, '评分 >= 10').to.be.gte(10)
            return
          }
          cy.wait(1000)
          pollCustomer(attempt + 1)
        })
      }

      pollCustomer(1)
    })
  })

  it('GET /api/events → 包含 message_received 与 ai.suggestion', () => {
    // ai.suggestion 事件在 DeepSeek 调用后异步写入，轮询直至两类事件都出现
    const pollEvents = (attempt: number): void => {
      cy.request(`${apiBase}/api/events?limit=80`).then((res) => {
        expect(res.status).to.eq(200)
        const types = (res.body as EventItem[]).map((e) => e.type)
        const hasReceived = types.includes('message_received')
        const hasSuggestion = types.includes('ai.suggestion')

        if ((hasReceived && hasSuggestion) || attempt >= 12) {
          expect(types, '包含 message_received').to.include('message_received')
          expect(types, '包含 ai.suggestion').to.include('ai.suggestion')
          return
        }
        cy.wait(1000)
        pollEvents(attempt + 1)
      })
    }

    pollEvents(1)
  })

  it('POST /api/ai/suggest → 返回非空建议', () => {
    cy.request(`${apiBase}/api/customers`).then((listRes) => {
      const customers = listRes.body as Customer[]
      expect(customers.length, '存在客户').to.be.greaterThan(0)
      const customerId = customers[0].id

      cy.request('POST', `${apiBase}/api/ai/suggest`, {
        customer_id: customerId,
        content: '这个产品怎么卖？',
      }).then((res) => {
        expect(res.status).to.eq(200)
        const body = res.body as { suggestion: string }
        expect(body.suggestion).to.be.a('string')
        expect(body.suggestion.length).to.be.greaterThan(0)
      })
    })
  })
})
