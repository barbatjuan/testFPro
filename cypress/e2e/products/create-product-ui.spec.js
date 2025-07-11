describe('UI: Crear Producto', () => {
  Cypress.on('uncaught:exception', (err, runnable) => {
    // El error 'NEXT_REDIRECT' es un problema conocido en el entorno de desarrollo
    // de Next.js al intentar redirigir y no debe bloquear las pruebas de UI.
    if (err.message.includes('NEXT_REDIRECT')) {
      return false;
    }
    return true;
  });

  beforeEach(() => {
    cy.loginApi().then((token) => {
      // Visitar la página de inventario (productos)
      cy.visit('/inventary', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('merchantId', Cypress.env('merchantId'));
        },
        failOnStatusCode: false,
      });
      cy.wait(2000);
    });
  });

  it('debería crear un nuevo producto con todos los campos', () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const productName = `Producto UI ${suffix}`;
    const productDesc = `Descripción del producto ${suffix}`;
    const productPrice = (Math.random() * 90 + 10).toFixed(2);

    // 1. Hacer clic en 'Nuevo Producto'
    cy.contains('button', /nuevo item/i, { timeout: 20000 }).click();
    cy.wait(1000); // Esperar a que el formulario/modal aparezca

    // 2. Rellenar el formulario con selectores y pausas
    cy.get('input[name="name"]').type(productName);
    cy.wait(500);
    cy.get('#price').type(productPrice);
    cy.wait(500);
    cy.get('#description').type(productDesc);
    cy.wait(500);

    // 3. Seleccionar el impuesto con teclado para mayor robustez
    cy.get('#type').click();
    cy.wait(500);
    cy.get('body').type('{downarrow}'); // Mover a la siguiente opción
    cy.get('body').type('{enter}'); // Seleccionar

    // 4. Guardar el producto
    cy.get('form').contains('button', 'Guardar').click();

    // 5. Verificar que volvemos a la lista y refrescar
    cy.url().should('include', '/inventary');
    cy.reload();

    // 6. Esperar a que la página cargue, usar el buscador y verificar que el producto aparece
    cy.contains('button', /nuevo item/i, { timeout: 20000 }).should('be.visible');
    cy.get('input[placeholder="Buscar"]').type(`${productName}{enter}`);
    cy.contains(productName, { timeout: 10000 }).should('be.visible');
    cy.log(`✔ Producto ${productName} creado y visible.`);
  });
});
