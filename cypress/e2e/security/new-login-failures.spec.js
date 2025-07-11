describe('Authentication Failures', () => {
  beforeEach(() => {
    // Reemplaza '/login' con la URL real de tu página de inicio de sesión.
        cy.visit('/login', { failOnStatusCode: false });
  });

  it('should show an error message with invalid credentials', () => {
    // Intenta iniciar sesión con credenciales incorrectas.
        cy.get('#email').type('invalid-user@test.com');
    cy.get('#password').type('wrong-password');
    cy.get('button[type="submit"]').click();

    // Verificar que se muestra un mensaje de error.
    // Verificamos que la URL no ha cambiado, lo que indica un fallo de login.
    cy.url().should('include', '/login');
  });

  it('should show a validation error for empty username', () => {
        cy.get('#password').type('some-password');
    cy.get('button[type="submit"]').click();

    // Verificar que aparece el mensaje de error de campo requerido.
    cy.contains('p.text-red-500', 'El correo electrónico es requerido').should('be.visible');
  });

  it('should show a validation error for empty password', () => {
        cy.get('#email').type('some-user@test.com');
    cy.get('button[type="submit"]').click();

    // Verificar que el mensaje de error para la contraseña es visible.
    cy.get('p.text-red-500').should('be.visible');
  });
});
