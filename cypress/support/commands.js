// Archivo commands.js reconstruido para arreglar errores de sintaxis
// Importar y registrar el plugin cypress-xpath para poder usar selectores XPath
require('cypress-xpath');

/**
 * → LOGIN UI
 * Realiza el login a través de la interfaz de usuario y cachea la sesión para tests E2E.
 */
Cypress.Commands.add("login", () => {
  // cy.session() es la forma moderna y eficiente de manejar el login.
  // Guarda y restaura cookies, localStorage, etc., evitando el login repetido.
  cy.session("userSession", () => {
    const username = Cypress.env("USER_EMAIL");
    const password = Cypress.env("USER_PASSWORD");

    if (!username || !password) {
      throw new Error("Las credenciales USER_EMAIL y USER_PASSWORD no están configuradas en cypress.env");
    }

    cy.visit("/login", { failOnStatusCode: false });
    cy.get("#email").type(username);
    cy.get("#password").type(password);
    cy.get("button[type=\"submit\"]").click();
    
    // Verificamos que la URL ha cambiado, confirmando que el login fue exitoso.
    cy.url().should("not.include", "/login");
  });
});

/**
 * → LOGIN API
 * Devuelve el JWT (string) para las llamadas posteriores.
 */
Cypress.Commands.add("loginApi", () => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiBase")}/auth/login`,
      body: {
        email: Cypress.env("USER_EMAIL"),
        password: Cypress.env("USER_PASSWORD"),
      },
    })
;
});

/**
 * → DELETE CONTACT API
 * Elimina un contacto por su ID
 */
Cypress.Commands.add("deleteContactApi", (token, id) => {
  return cy
    .request({
      method: "DELETE",
      url: `${Cypress.env("apiBase")}/contacts/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      failOnStatusCode: false,
    })
    .its("status");
});

/**
 * → DELETE PRODUCT API
 * Elimina un producto por su ID
 */
Cypress.Commands.add("deleteProductApi", (token, id) => {
  return cy
    .request({
      method: "DELETE",
      url: `${Cypress.env("apiBase")}/catalog/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      failOnStatusCode: false,
    })
    .its("status");
});

/**
 * → DELETE INVOICE API
 * Elimina una factura por su ID
 */
Cypress.Commands.add("deleteInvoiceApi", (token, invoiceId) => {
  return cy
    .request({
      method: "DELETE",
      url: `${Cypress.env("apiBase")}/invoices/${invoiceId}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      failOnStatusCode: false,
    })
    .its("status");
});

/**
 * → CREATE CONTACT API
 * Crea un contacto y devuelve el objeto completo.
 * Opcional: pasar un objeto para sobreescribir el body por defecto.
 */
Cypress.Commands.add("createContactApi", (token, contactData = {}) => {
  const defaultBody = {
    name: `API Contact ${Date.now()}`,
    email: `api.contact.${Date.now()}@test.com`,
    nif: "B12345678",
    isCustomer: false,
    isSupplier: false,
    contactType: 'COMPANY',
    preferences: [],
  };

  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiBase")}/contacts`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      body: { ...defaultBody, ...contactData },
    })
    .its("body.data");
});

/**
 * → CREATE PRODUCT API
 * Crea un producto y devuelve el objeto completo.
 */
Cypress.Commands.add("createProductApi", (token) => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiBase")}/catalog`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      body: {
        name: `API Product ${Date.now()}`,
        price: Math.floor(Math.random() * 100) + 1,
        type: "PRODUCT",
      },
    })
    .its("body.data");
});

/**
 * → CREATE INVOICE MINIMAL API
 * Crea una factura mínima con los datos esenciales.
 */
Cypress.Commands.add("createInvoiceMinimalApi", (token, contactId, product, invoiceCategory = "SALE") => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiBase")}/invoices`,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-merchant-id": Cypress.env("merchantId"),
      },
      body: {
        contact_id: contactId,
        invoice_category: invoiceCategory,
        line_items: [
          {
            catalog_item_id: product.id,
            description: product.name,
            quantity: 1,
            unit_price: product.price,
          },
        ],
      },
    })
    .its("body.data");
});
