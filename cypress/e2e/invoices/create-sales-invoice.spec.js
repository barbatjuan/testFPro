describe('API: Crear Factura de Venta', () => {
  let token;

  before(() => {
    cy.loginApi().then(t => {
      token = t;
    });
  });

  it('debería crear un contacto, un producto y luego una factura de venta', () => {
    let contactId;

    cy.createContactApi(token)
      .then(contact => {
        expect(contact).to.have.property('id');
        contactId = contact.id;
        return cy.createProductApi(token);
      })
      .then(product => {
        expect(product).to.have.property('id');
        return cy.createInvoiceMinimalApi(token, contactId, product, 'SALE');
      })
      .then(invoice => {
        expect(invoice).to.have.property('id');
        expect(invoice.id).to.be.a('string').and.not.be.empty;
        expect(invoice.invoiceCategory).to.equal('SALE');
        expect(invoice.contactId).to.equal(contactId);
      });
  });
});
