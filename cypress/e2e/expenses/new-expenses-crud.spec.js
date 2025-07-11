describe('Expenses CRUD', () => {
  let expenseDescription = '';

  beforeEach(() => {
    // Iniciar sesión antes de cada prueba.
    // cy.loginAs('admin');

    // Generar una descripción única para el gasto.
    expenseDescription = `Gasto de prueba ${new Date().getTime()}`;

    // Ir a la página de creación de gastos.
    cy.visit('/expenses/new');
  });

  it('should create, read, update, and delete an expense', () => {
    // --- CREATE ---
    cy.get('input[name="description"]').type(expenseDescription);
    cy.get('input[name="amount"]').type('50.75');
    cy.get('input[name="date"]').type('2024-07-10'); // Asegúrate que el formato sea el correcto
    cy.get('button[type="submit"]').click();

    // Verificar que fuimos redirigidos a la lista y el gasto existe.
    cy.url().should('include', '/expenses');
    cy.contains(expenseDescription).should('be.visible');

    // --- READ (implícito al buscarlo para editar) ---
    // Buscar el gasto en la lista y hacer clic en editar.
    cy.contains('tr', expenseDescription).within(() => {
      cy.get('button.edit-button').click();
    });

    // --- UPDATE ---
    const updatedDescription = `${expenseDescription} - Editado`;
    cy.get('input[name="description"]').clear().type(updatedDescription);
    cy.get('input[name="amount"]').clear().type('99.99');
    cy.get('button[type="submit"]').click();

    // Verificar que el gasto se actualizó correctamente.
    cy.contains(updatedDescription).should('be.visible');
    cy.contains('99.99').should('be.visible');

    // --- DELETE ---
    // Buscar el gasto actualizado y hacer clic en borrar.
    cy.contains('tr', updatedDescription).within(() => {
      cy.get('button.delete-button').click();
    });

    // Confirmar la eliminación (si hay un modal de confirmación).
    // cy.get('.confirm-delete-button').click();

    // Verificar que el gasto ya no existe en la lista.
    cy.contains(updatedDescription).should('not.exist');
  });
});
