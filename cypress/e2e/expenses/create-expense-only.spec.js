// cypress/e2e/create-expense-only.spec.js

describe("API: Solo CREATE Expense (POST /invoices)", () => {
  let token, supplier, product;

  before(() => {
    // 1) Login y guardamos token
    return cy.loginApi().then(t => {
      token = t;
      // 2) Creamos un supplier (isSupplier: true) reusando tu helper
      return cy.createContactApi(token, { isSupplier: true });
    })
    .then(s => {
      supplier = s;
      // 3) Creamos un producto
      return cy.createProductApi(token);
    })
    .then(p => {
      product = p;
    });
  });

  it("POST /invoices con invoiceCategory PURCHASE (gasto)", () => {
    // 4) Llamamos a tu helper de invoice minimal, solo cambiamos category
    cy.createInvoiceMinimalApi(token, supplier.id, product, "PURCHASE")
      .then(exp => {
        // 5) Validamos que devuelve ID y categoría correcta
        expect(exp).to.have.property("id");
        expect(exp.invoiceCategory).to.eq("PURCHASE");
        cy.log("✔ Expense creado (invoice):", exp.id);
      });
  });
});
