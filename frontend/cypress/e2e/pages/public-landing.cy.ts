/// <reference types="cypress" />

const apiBase = Cypress.env('apiBase') as string

interface LandingPageLite {
  slug: string
  title: string
  headline?: string | null
  form_id?: number | null
}

describe('公开落地页 /l/{slug}', () => {
  it('渲染真实落地页并能提交线索', () => {
    // 取一个带 form_id 的落地页 slug，缺省回退到 summer-launch
    cy.request(`${apiBase}/api/landing-pages`).then((res) => {
      const pages = res.body as LandingPageLite[]
      const withForm = pages.find((p) => p.form_id != null)
      const slug = withForm?.slug ?? 'summer-launch'
      const heading = (withForm?.headline || withForm?.title || '').trim()

      cy.visit(`/l/${slug}`)

      // 正文包含标题/headline 文案
      if (heading) {
        cy.contains(heading, { timeout: 15000 }).should('exist')
      }

      // 存在线索表单
      cy.get('#lead-form', { timeout: 15000 }).should('exist')

      // 填写所有可见输入并提交
      cy.get('#lead-form')
        .find('input, textarea')
        .each(($el) => {
          if ($el.is(':visible')) {
            cy.wrap($el).type('13800138000')
          }
        })

      cy.get('#lead-form').find('button[type="submit"], button').first().click()

      // 成功提示
      cy.contains('提交成功', { timeout: 15000 }).should('be.visible')
    })
  })
})
