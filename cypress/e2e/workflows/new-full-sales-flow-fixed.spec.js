describe('Flujo completo de ventas E2E', () => {
  Cypress.on('uncaught:exception', (err, runnable) => {
    // Ignorar errores de redirección de Next.js que no son fallos reales del test
    if (err.message.includes('NEXT_REDIRECT')) {
      return false;
    }
    return true;
  });

  it('debería crear un contacto, un producto y luego una factura', () => {
    // --- Generación de datos dinámicos para asegurar la unicidad en cada ejecución ---
    const suffix = Date.now();
    const contactName = `Cliente E2E ${suffix}`;
    const nifNumber = Math.floor(Math.random() * 90000000) + 10000000;
    const nifLetter = 'TRWAGMYFPDXBNJZSQVHLCKE'.charAt(nifNumber % 23);
    const contactNif = `${nifNumber}${nifLetter}`;
    const contactEmail = `e2e.${suffix}@test.com`;

    const productName = `Producto E2E ${suffix}`;
    const productDesc = `Descripción E2E del producto ${suffix}`;
    const productPrice = (Math.random() * 90 + 10).toFixed(2);

    // --- FASE 1: Crear Contacto y Producto con una sesión de login ---
    cy.loginApi().then(response => {
      const token = response.body.data.token;

      // PASO 1: Crear Contacto
      cy.log('**PASO 1: Creando un nuevo contacto...**');
      cy.visit('/contacts', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('merchantId', Cypress.env('merchantId'));
        },
        failOnStatusCode: false,
      });
      cy.contains('h1', 'Contactos', { timeout: 20000 }).should('be.visible');
      cy.contains('button', /crear contacto/i).click();
      cy.get('div[role="dialog"]').within(() => {
        cy.get('input[name="name"]').type(contactName);
        cy.get('input[name="nif"]').type(contactNif);
        cy.get('input[name="email"]').type(contactEmail);
        cy.contains('button', 'Seleccionar').click();
        cy.contains('div', 'Cliente').click();
        cy.contains('button', 'Aplicar').click();
        cy.contains('button', 'Aceptar').click();
      });
      cy.get('div[role="dialog"]').should('not.exist');
      // Se omite la verificación por búsqueda para agilizar el test
      cy.log(`✔ Contacto '${contactName}' creado.`);

      // PASO 2: Crear Producto
      cy.log('**PASO 2: Creando un nuevo producto...**');
      cy.visit('/inventary', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('merchantId', Cypress.env('merchantId'));
        },
        failOnStatusCode: false,
      });
      cy.contains('h1', 'Productos y Servicios', { timeout: 20000 }).should('be.visible');
      cy.contains('button', /nuevo item/i).click();
      // Esperar a que el diálogo sea visible para evitar race conditions
      cy.get('div[role="dialog"]').should('be.visible');
      cy.get('input[name="name"]').type(productName);
      cy.get('#price').type(productPrice);
      cy.get('#description').type(productDesc);
      cy.get('#type').click();
      // Interactuar con el body para seleccionar del dropdown, que se renderiza fuera del diálogo
      cy.get('body').type('{downarrow}{enter}');
      cy.get('form').contains('button', 'Guardar').click();
      // Esperar a que el diálogo se cierre y verificar la URL
      cy.get('div[role="dialog"]').should('not.exist');
      cy.url().should('include', '/inventary');
      cy.contains('h1', 'Productos y Servicios', { timeout: 20000 }).should('be.visible');
      cy.log(`✔ Producto '${productName}' creado.`);
    });

    // --- FASE 2: Crear Factura con una NUEVA sesión de login para evitar problemas de token ---
    cy.loginApi().then(response => {
      const token = response.body.data.token;

      cy.log('**PASO 3: Creando una nueva factura...**');
      // Navegar directamente a la página de facturas
      cy.visit('/sales/invoices', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('merchantId', Cypress.env('merchantId'));
        },
        failOnStatusCode: false,
      });
      cy.contains('h1', 'Facturas', { timeout: 20000 }).should('be.visible');
      cy.contains('button', /nueva factura/i).click();
      // Verificar que la URL es la correcta para la creación de facturas
      cy.url().should('include', '/sales/invoices/create-normal', { timeout: 10000 });
      // Esperar a que la página de nueva factura cargue completamente
      cy.contains('h3', /crear factura/i, { timeout: 20000 }).should('be.visible');
      cy.contains('label', 'Contacto').parent().find('button').click();
      // El componente permite escribir directamente para buscar y se autoselecciona
      cy.focused().type(`${contactName}{enter}`);

      // Verificar que el contacto se ha seleccionado correctamente
      cy.contains('label', 'Contacto').parent().find('button').should('contain.text', contactName);

      // Hacer clic en el selector de producto y escribir para buscar
      cy.get('table tbody tr:first-child td:nth-child(2)').find('button').click();
      cy.get('body').type(productName);

      // Hacer clic en la opción del producto que aparece en el menú
      cy.contains('div[role="option"]', productName).click();

      // Verificar que el producto se ha seleccionado y es visible en la tabla
      cy.get('table tbody tr:first-child td:nth-child(2)').should('contain.text', productName);

      cy.contains('button', 'Emitir factura').click();

      // Esperar 2 segundos para la redirección y renderizado de la página de detalle
      cy.wait(2000);

      // Verificar que hemos salido de la página de creación
      cy.url().should('not.include', 'create-normal', { timeout: 10000 });

      // Verificar que el nombre del contacto es visible en la página de detalle
      cy.contains(contactName, { timeout: 20000 }).should('be.visible');
      cy.log('✔ Flujo de venta completado y verificado con éxito.');
    });
  });
});
