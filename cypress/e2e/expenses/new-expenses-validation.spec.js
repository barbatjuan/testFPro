describe('Expenses Form Validations', () => {
  beforeEach(() => {
    // Iniciar sesión e ir a la página de creación de gastos.
    // cy.loginAs('admin');
    cy.visit('/expenses/new');
  });

  it('should not allow submitting with an empty description', () => {
    cy.get('input[name="amount"]').type('100');
    cy.get('button[type="submit"]').click();

    // El formulario no debería enviarse y debería mostrar un error de validación.
    cy.url().should('include', '/expenses/new');
    cy.get('input[name="description"]:invalid').should('exist');
  });

  it('should not allow submitting with a zero or negative amount', () => {
    cy.get('input[name="description"]').type('Gasto con importe inválido');
    
    // Probar con cero
    cy.get('input[name="amount"]').type('0');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message-amount').should('contain', 'El importe debe ser mayor que cero');

    // Probar con un número negativo
    cy.get('input[name="amount"]').clear().type('-50');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message-amount').should('contain', 'El importe debe ser mayor que cero');

    // El formulario no debería haberse enviado
    cy.url().should('include', '/expenses/new');
  });

  it('should show a validation error for an invalid date format', () => {
    cy.get('input[name="description"]').type('Gasto con fecha inválida');
    cy.get('input[name="amount"]').type('20');
    cy.get('input[name="date"]').type('esto-no-es-una-fecha');
    cy.get('button[type="submit"]').click();

    // Verificar el error de validación de la fecha.
    cy.get('.error-message-date').should('contain', 'El formato de la fecha no es válido');
  });
});
