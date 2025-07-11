describe('UI de Contactos - Flujo E2E', () => {
  beforeEach(() => {
    // Hacemos login vía API y visitamos la página de contactos
    cy.loginApi().then((token) => {
      cy.visit('/contacts', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('merchantId', Cypress.env('merchantId'));
        },
        failOnStatusCode: false,
      });
    });
    // Esperamos a que la página de contactos cargue verificando un elemento clave
    cy.contains('h1', 'Contactos', { timeout: 20000 }).should('be.visible');
  });

  it('debería crear un contacto, buscarlo y verificar que aparece en la lista', () => {
    const contactName = `Contacto UI ${Date.now()}`;
    const contactEmail = `ui.${Date.now()}@test.com`;
    // Generamos un DNI aleatorio (8 números + 1 letra) para el NIF de una persona
    const nifNumber = Math.floor(Math.random() * 90000000) + 10000000;
    const nifLetter = 'TRWAGMYFPDXBNJZSQVHLCKE'.charAt(nifNumber % 23);
    const contactNif = `${nifNumber}${nifLetter}`;

    // 1. Abrir el popup de creación de contacto
    cy.contains('button', /crear contacto/i).click();

    // Añadimos una pequeña espera para que el popup se renderice completamente
    cy.wait(500);

    // 2. Rellenar el formulario (el popup)
    // Usamos el contenedor del diálogo para asegurar que interactuamos con el popup
    cy.get('div[role="dialog"]').within(() => {
      // 'Persona' está seleccionado por defecto, así que solo rellenamos los campos
      cy.get('input[name="name"]').type(contactName);
      cy.get('input[name="nif"]').type(contactNif);
      cy.get('input[name="email"]').type(contactEmail);
      
      // Seleccionar 'Cliente' en el desplegable 'Este contacto es'
      cy.contains('button', 'Seleccionar').click(); // 1. Abrir el desplegable
      cy.contains('div', 'Cliente').click(); // 2. Seleccionar 'Cliente'
      cy.contains('button', 'Aplicar').click(); // 3. Confirmar con 'Aplicar'

      // El botón de guardado final es 'Aceptar'
      cy.contains('button', 'Aceptar').click();
    });

    // 3. Verificar que el popup se cierra y aparece un mensaje de éxito
    cy.get('div[role="dialog"]').should('not.exist');
    cy.contains(/contacto creado/i, { timeout: 15000 }).should('be.visible');

    // 4. Buscar el contacto recién creado para verificar que está en la lista
    cy.get('input[placeholder="Buscar"]').type(`${contactName}{enter}`);
    cy.contains('td', contactName, { timeout: 10000 }).should('be.visible');

    cy.log(`✔ Contacto '${contactName}' creado y verificado con éxito.`);
  });
});
