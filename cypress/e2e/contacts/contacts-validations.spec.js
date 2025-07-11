// Pruebas de validaciones negativas y duplicados para contactos

describe('Validaciones de contactos', () => {
  beforeEach(() => {
    cy.visit('/contacts');
  });

  it('No permite crear contacto con campos obligatorios vacíos', () => {
    cy.get('[data-cy=create-contact]').click();
    cy.get('[data-cy=save-contact]').should('be.disabled');
  });

  it('Muestra error si el email es inválido', () => {
    cy.get('[data-cy=create-contact]').click();
    cy.get('[data-cy=contact-name]').type('Test Email');
    cy.get('[data-cy=contact-email]').type('no-es-un-email');
    cy.get('[data-cy=save-contact]').click();
    cy.contains('email no es válido').should('exist');
  });

  it('No permite crear contacto con email duplicado', () => {
    const email = `duplicado${Date.now()}@test.com`;
    // Crear primero
    cy.get('[data-cy=create-contact]').click();
    cy.get('[data-cy=contact-name]').type('Duplicado');
    cy.get('[data-cy=contact-email]').type(email);
    cy.get('[data-cy=save-contact]').click();
    cy.contains(email).should('exist');
    // Intentar crear de nuevo
    cy.get('[data-cy=create-contact]').click();
    cy.get('[data-cy=contact-name]').type('Duplicado2');
    cy.get('[data-cy=contact-email]').type(email);
    cy.get('[data-cy=save-contact]').click();
    cy.contains('ya existe').should('exist');
  });
});
