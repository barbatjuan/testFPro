describe('API: Creación, verificación y eliminación de 10 productos', () => {
  let token;
  const createdProductIds = [];
  const PRODUCT_COUNT = 10;

  before(() => {
    // Obtener token de autenticación
    cy.loginApi().then(t => {
      token = t;
      expect(token).to.be.a('string');
    });
  });

  it(`debería crear, verificar y eliminar ${PRODUCT_COUNT} productos en secuencia`, () => {
    // Paso 1: Crear productos
    Cypress._.times(PRODUCT_COUNT, (i) => {
      const productData = {
        name: `Producto Cypress ${Date.now()}-${i + 1}`,
        description: `Descripción del producto de prueba ${i + 1}`,
        price: 99.99 + i,
        type: 'PRODUCT',
        tags: ['test', 'cypress', `batch-10-${i + 1}`]
      };

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
        cy.log(`✅ Producto ${i + 1}/${PRODUCT_COUNT} creado: ${response.body.data.id}`);
        createdProductIds.push(response.body.data.id);
      });
    });

    // Verificar que se crearon los productos
    cy.wrap(createdProductIds).should('have.length', PRODUCT_COUNT);

    // Paso 2: Verificar que los productos existen
    cy.wrap(createdProductIds).each((productId, index) => {
      cy.log(`🔍 Verificando producto ${index + 1}/${PRODUCT_COUNT}: ${productId}`);
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

    // Paso 3: Eliminar los productos creados
    cy.wrap(createdProductIds).each((productId, index) => {
      cy.log(`🗑️  Eliminando producto ${index + 1}/${PRODUCT_COUNT}: ${productId}`);
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
        cy.log(`✅ Producto ${index + 1}/${PRODUCT_COUNT} eliminado correctamente`);
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
      cy.log(`Realizando limpieza de ${createdProductIds.length} productos de prueba...`);
      createdProductIds.forEach((productId, index) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiBase')}/catalog/${productId}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'x-merchant-id': Cypress.env('merchantId'),
          },
          failOnStatusCode: false
        }).then(() => {
          if ((index + 1) % 10 === 0 || index === createdProductIds.length - 1) {
            cy.log(`Limpieza: ${index + 1}/${createdProductIds.length} productos procesados`);
          }
        });
      });
    }
  });
});
