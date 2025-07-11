describe('API: Creación, verificación y eliminación de 100 productos', () => {
  let token;
  const createdProductIds = [];
  const PRODUCT_COUNT = 100;

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
        tags: ['test', 'cypress', `batch-100-${i + 1}`]
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
        if ((i + 1) % 10 === 0 || i === 0) {
          cy.log(`✅ ${i + 1}/${PRODUCT_COUNT} productos creados`);
        }
        createdProductIds.push(response.body.data.id);
      });
    });

    // Verificar que se crearon los productos
    cy.wrap(createdProductIds).should('have.length', PRODUCT_COUNT);

    // Paso 2: Verificar que los productos existen
    cy.wrap(createdProductIds).each((productId, index) => {
      if ((index + 1) % 25 === 0 || index === 0) {
        cy.log(`🔍 Verificando producto ${index + 1}/${PRODUCT_COUNT}`);
      }
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
      if ((index + 1) % 25 === 0 || index === 0) {
        cy.log(`🗑️  Eliminando producto ${index + 1}/${PRODUCT_COUNT}`);
      }
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
        if ((index + 1) % 25 === 0 || index === PRODUCT_COUNT - 1) {
          cy.log(`✅ ${index + 1}/${PRODUCT_COUNT} productos eliminados`);
        }
      });
    });

    // Verificar que los productos ya no existen
    cy.wrap(createdProductIds).each((productId, index) => {
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
