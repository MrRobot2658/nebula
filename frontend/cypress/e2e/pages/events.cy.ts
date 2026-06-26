/// <reference types="cypress" />

describe('事件流页', () => {
  it('展示事件表格且至少有一行', () => {
    cy.visit('/events')

    cy.get('[data-testid="event-table"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="event-row"]', { timeout: 15000 })
      .its('length')
      .should('be.greaterThan', 0)
  })
})
