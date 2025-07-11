// cypress/e2e/invoices-minimal-crud.spec.js

describe("API CRUD: Facturas (payload mínimo)", () => {
  let token, contact, product, invoiceSummary;

  before(() => {
    // Login → contacto → producto
    return cy
      .loginApi()
      .then((t) => {
        token = t;
        return cy.createContactApi(token);
      })
      .then((c) => {
        contact = c;
        return cy.createProductApi(token);
      })
      .then((p) => {
        product = p;
      });
  });

  it("→ Crea factura y valida summary", () => {
    cy.createInvoiceMinimalApi(token, contact.id, product).then((inv) => {
      invoiceSummary = inv;
      expect(inv).to.have.property("id");
      expect(inv.invoiceCategory).to.eq("SALE");
      expect(inv.netTotalAmount).to.eq(product.price);
    });
  });

  it("→ Recupera factura por ID y valida items", () => {
    cy.getInvoiceApi(token, invoiceSummary.id).then((full) => {
      expect(full).to.have.property("id", invoiceSummary.id);

      // CORREGIDO: aserción del array
      expect(full.items).to.be.an("array").with.length(1);

      expect(full.items[0]).to.include({
        productId: product.id,
        netTotalAmount: product.price,
      });
    });
  });

  it("→ Elimina la factura (200/204)", () => {
    cy.deleteInvoiceApi(token, invoiceSummary.id).should((status) => {
      expect([200, 204]).to.include(status);
    });
  });

  it("→ Verifica GET tras borrado (400/404)", () => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiBase")}/invoices/${invoiceSummary.id}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should((status) => {
        // La API puede devolver 400 o 404 tras el delete
        expect([400, 404]).to.include(status);
      });
  });
});
