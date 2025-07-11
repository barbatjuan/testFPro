describe('Invoice List Filtering and Sorting', () => {
  before(() => {
    // Para probar esto de forma fiable, es ideal tener un conjunto de datos predecible.
    // Puedes usar un comando personalizado para sembrar la base de datos con varias facturas
    // con diferentes clientes, fechas y estados.
    // cy.seedInvoices();
    cy.log('Asegúrate de tener varias facturas con diferentes estados y fechas.');
  });

  beforeEach(() => {
    // cy.loginAs('admin');
    cy.visit('/invoices');
  });

  it('should filter invoices by status "Pagada"', () => {
    cy.get('.filter-by-status-select').select('Pagada');
    cy.get('button.apply-filters').click();

    // Verificar que todas las facturas visibles tienen el estado 'Pagada'.
    cy.get('.invoice-list-table tbody tr').each(($row) => {
      cy.wrap($row).find('.status-badge').should('contain', 'Pagada');
    });
  });

  it('should filter invoices by a specific date range', () => {
    cy.get('input[name="startDate"]').type('2024-01-01');
    cy.get('input[name="endDate"]').type('2024-03-31');
    cy.get('button.apply-filters').click();

    // Verificar que las facturas mostradas están dentro del rango de fechas.
    // Esto requeriría parsear las fechas de la tabla, lo cual puede ser complejo.
    // Una verificación más simple es contar el número de resultados esperados.
    cy.get('.invoice-list-table tbody tr').should('have.length', 5); // Reemplazar con el número esperado
  });

  it('should sort invoices by total amount in descending order', () => {
    // Hacer clic en la cabecera de la columna 'Total' para ordenar.
    cy.get('th.sortable[data-column="total"]').click(); // Puede que necesites un segundo clic para descendente
    cy.get('th.sortable[data-column="total"]').click();

    // Verificar que los importes están en orden descendente.
    const totals = [];
    cy.get('.invoice-list-table td.total-amount').each($td => {
      totals.push(parseFloat($td.text().replace('€', ''))); // Ajustar al formato de tu moneda
    }).then(() => {
      const sortedTotals = [...totals].sort((a, b) => b - a);
      expect(totals).to.deep.equal(sortedTotals);
    });
  });
});
