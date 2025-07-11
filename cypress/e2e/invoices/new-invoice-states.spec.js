describe('Invoice Lifecycle States', () => {
  let invoiceNumber = '';

  before(() => {
    // Se necesita crear una factura base que se usará en todas las pruebas de estado.
    // cy.loginAs('admin');
    // cy.createInvoice('draft').then(invNum => {
    //   invoiceNumber = invNum;
    // });
    cy.log('Crear una factura en estado "Borrador" aquí.');
    invoiceNumber = 'INV-2024-001'; // Placeholder
  });

  beforeEach(() => {
    // cy.loginAs('admin');
    // Visitar la página de detalles de la factura creada.
    cy.visit(`/invoices/${invoiceNumber}`);
  });

  it('should allow changing state from "Draft" to "Sent"', () => {
    // Verificar estado inicial
    cy.get('.invoice-status').should('contain', 'Borrador');

    // Cambiar estado a Enviada
    cy.get('button.mark-as-sent').click();
    cy.get('.invoice-status').should('contain', 'Enviada');
  });

  it('should allow changing state from "Sent" to "Paid"', () => {
    // Asumimos que el estado anterior ya es "Enviada"
    cy.get('button.mark-as-paid').click();
    cy.get('.invoice-status').should('contain', 'Pagada');

    // Opcional: Verificar que se ha generado un recibo o registro de pago.
    cy.get('.payment-history').should('have.length', 1);
  });

  it('should allow voiding a "Sent" invoice', () => {
    // Para esta prueba, puede que necesites crear otra factura o resetear el estado.
    // cy.createInvoice('sent').then(invNum => cy.visit(`/invoices/${invNum}`));
    
    cy.get('button.void-invoice').click();
    // Confirmar la anulación
    // cy.get('.confirm-void-button').click();

    cy.get('.invoice-status').should('contain', 'Anulada');
    // Los botones de acción deberían desaparecer
    cy.get('button.mark-as-paid').should('not.exist');
  });

  after(() => {
    // Limpieza: Borrar la factura creada.
    // cy.cleanupInvoice(invoiceNumber);
  });
});
