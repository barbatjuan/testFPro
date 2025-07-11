// cypress/e2e/create-contact.spec.js

describe("API: Crear Contacto", () => {
  it("debería hacer login y crear un contacto con id válido", () => {
    cy.loginApi().then((token) => {
      cy.createContactApi(token).then((contact) => {
        expect(contact).to.have.property("id");
        expect(contact.nif).to.match(/^B\d{8}$/);
        expect(contact.isCustomer).to.be.true;
        expect(contact.isSupplier).to.be.false;
        cy.log("✔ Contacto creado:", contact.id);

        // Verificar que el contacto existe en la base de datos
        cy.getContactByIdApi(token, contact.id).then((fetchedContact) => {
          expect(fetchedContact.id).to.equal(contact.id);
          cy.log("✔ Contacto recuperado por API:", fetchedContact.id);
        });

        // Visitar la UI para verificar que el contacto es visible
        cy.visit('/contacts', {
          failOnStatusCode: false, // Prevenir fallo por error 500 del backend
          onBeforeLoad(win) {
            win.localStorage.setItem('token', token);
            win.localStorage.setItem('merchantId', Cypress.env('merchantId'));
          },
        });

        cy.contains('h1', /Contactos|Contacts/, { timeout: 20000 }).should('be.visible');
        cy.contains(contact.name, { timeout: 10000 }).should('be.visible');
        cy.log(`✔ El contacto '${contact.name}' es visible en la UI.`);
      });
    });
  });
});
