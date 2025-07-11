describe("API: Productos CRUD completo", () => {
  let token, product;

  before(() => {
    cy.loginApi().then((t) => {
      token = t;
      expect(token).to.be.a("string");
    });
  });

  it("1) Crea un producto", () => {
    cy.createProductApi(token).then((p) => {
      product = p;
      expect(p).to.have.property("id");
      // ahora name es “Prod Cypress <timestamp>-<n>”
      expect(p.name).to.match(/^Prod Cypress \d{13}-\d{1,4}$/);
    });
  });

  it("2) Obtiene el producto por su ID", () => {
    cy.getProductApi(token, product.id).then((found) => {
      expect(found.id).to.eq(product.id);
      expect(found.name).to.eq(product.name);
    });
  });

  it("3) Elimina el producto", () => {
    cy.deleteProductApi(token, product.id).should((status) =>
      expect([200, 204]).to.include(status)
    );
  });

  it("4) Comprueba que ya no existe vía GET", () => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiBase")}/catalog/${product.id}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 404);
  });
});
