// cypress/e2e/create-product.spec.js

describe("API: Crear Producto en catálogo", () => {
  it("debería hacer login y crear un producto con id válido", () => {
    cy.loginApi().then((token) => {
      cy.createProductApi(token).then((product) => {
        expect(product).to.have.property("id");
        // El nombre debe coincidir con el formato: 'API Product [timestamp]'
        expect(product.name).to.match(/^API Product \d{13}$/);
        cy.log("✔ Producto creado:", product.id);
      });
    });
  });
});
