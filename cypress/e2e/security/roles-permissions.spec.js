// Pruebas de roles y permisos básicos

describe('Roles y permisos', () => {
  it('No permite acceder a contactos sin login', () => {
    cy.clearCookies();
    cy.visit('/contacts');
    cy.url().should('include', '/login');
  });
  // Agrega más pruebas de permisos según tu app
});
