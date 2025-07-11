// cypress/e2e/contacts-crud.spec.js

describe("API: Contactos CRUD completo", () => {
  let token, contact;

  before(() => {
    return cy
      .loginApi()
      .then((t) => {
        token = t;
        return cy.createContactApi(token);
      })
      .then((c) => {
        contact = c;
      });
  });

  it("1) Crea un contacto con id válido", () => {
    expect(contact).to.have.property("id");
    expect(contact.email).to.be.a("string");
  });

  // cypress/e2e/contacts-crud.spec.js
  it("2) Comprueba existencia con GET /contacts/:id", () => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiBase")}/contacts/${contact.id}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.have.property("id", contact.id);
      expect(resp.body.data.email).to.eq(contact.email);
    });
  });

  it("3) Elimina el contacto (200/204)", () => {
    cy.deleteContactApi(token, contact.id).should((status) =>
      expect([200, 204]).to.include(status)
    );
  });

  it("4) Comprueba que ya no aparece tras borrado", () => {
    cy.getContactsApi(token).then((list) => {
      const found = list.find((x) => x.id === contact.id);
      expect(found).to.be.undefined;
    });
  });
});
