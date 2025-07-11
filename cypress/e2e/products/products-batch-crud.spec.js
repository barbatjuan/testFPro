describe('API: Creación, verificación y eliminación de 10 productos', () => {
  let token;
  const createdProductIds = [];

  before(() => {
    // Obtener token de autenticación
    cy.loginApi().then(t => {
      token = t;
      expect(token).to.be.a('string');
    });
  });

  it('debería crear, verificar y eliminar 10 productos en secuencia', () => {
    // Paso 1: Crear 100 productos
    Cypress._.times(100, (i) => {
      const productData = {
        name: `Producto Cypress ${Date.now()}-${i + 1}`,
        description: `Descripción del producto de prueba ${i + 1}`,
        price: 99.99 + i, // Precio único para cada producto
        type: 'PRODUCT', // Tipo fijo según Swagger
        tags: ['test', 'cypress', `batch-${i + 1}`]
      };

      // Crear producto directamente con la estructura esperada por la API
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiBase')}/catalog`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
          'Content-Type': 'application/json'
        },
        body: productData
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.data).to.have.property('id');
        cy.log(`✅ Producto ${i + 1} creado: ${response.body.data.id}`);
        createdProductIds.push(response.body.data.id);
      });
    });

    // Verificar que se crearon los 100 productos
    cy.wrap(createdProductIds).should('have.length', 100);

    // Paso 2: Verificar que los 10 productos existen
    cy.wrap(createdProductIds).each((productId, index) => {
      cy.log(`🔍 Verificando producto ${index + 1}: ${productId}`);
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBase')}/catalog/${productId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.have.property('id', productId);
      });
    });

    // Paso 3: Eliminar los 10 productos creados
    cy.wrap(createdProductIds).each((productId, index) => {
      cy.log(`🗑️  Eliminando producto ${index + 1}: ${productId}`);
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiBase')}/catalog/${productId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
        cy.log(`✅ Producto ${index + 1} eliminado correctamente`);
      });
    });

    // Verificar que los productos ya no existen
    cy.wrap(createdProductIds).each((productId) => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBase')}/catalog/${productId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  // Limpieza en caso de fallo
  after(() => {
    if (createdProductIds.length > 0) {
      cy.log('Realizando limpieza de productos de prueba...');
      createdProductIds.forEach(productId => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiBase')}/catalog/${productId}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'x-merchant-id': Cypress.env('merchantId'),
          },
          failOnStatusCode: false
        });
      });
    }
  });
});
