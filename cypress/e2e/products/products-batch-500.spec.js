describe('API: Creación, verificación y eliminación de 500 productos', () => {
  let token;
  const createdProductIds = [];
  const PRODUCT_COUNT = 500;
  const BATCH_SIZE = 50; // Tamaño de lote para reportes de progreso

  before(() => {
    // Obtener token de autenticación
    cy.loginApi().then(t => {
      token = t;
      expect(token).to.be.a('string');
    });
  });

  it(`debería crear, verificar y eliminar ${PRODUCT_COUNT} productos en secuencia`, () => {
    // Paso 1: Crear productos
    cy.log(`🚀 Iniciando creación de ${PRODUCT_COUNT} productos...`);
    Cypress._.times(PRODUCT_COUNT, (i) => {
      const productData = {
        name: `Producto Cypress ${Date.now()}-${i + 1}`,
        description: `Descripción del producto de prueba ${i + 1}`,
        price: 99.99 + (i % 100), // Reutilizamos precios para no hacer números demasiado grandes
        type: 'PRODUCT',
        tags: ['test', 'cypress', `batch-500-${i + 1}`]
      };

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiBase')}/catalog`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
          'Content-Type': 'application/json'
        },
        body: productData,
        timeout: 30000 // Aumentar timeout para operaciones largas
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.data).to.have.property('id');
        createdProductIds.push(response.body.data.id);
        
        // Reportar progreso cada BATCH_SIZE productos
        if ((i + 1) % BATCH_SIZE === 0 || i === 0) {
          cy.log(`✅ ${i + 1}/${PRODUCT_COUNT} productos creados`);
        }
      });
    });

    // Verificar que se crearon los productos
    cy.wrap(createdProductIds).should('have.length', PRODUCT_COUNT);
    cy.log(`\n✅ Se crearon correctamente ${PRODUCT_COUNT} productos\n`);

    // Paso 2: Verificar que los productos existen
    cy.log(`🔍 Verificando ${PRODUCT_COUNT} productos...`);
    cy.wrap(createdProductIds).each((productId, index) => {
      // Reportar progreso cada BATCH_SIZE productos
      if ((index + 1) % BATCH_SIZE === 0 || index === 0) {
        cy.log(`🔍 Verificando productos ${index + 1}-${Math.min(index + BATCH_SIZE, PRODUCT_COUNT)}/${PRODUCT_COUNT}`);
      }
      
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBase')}/catalog/${productId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
        },
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.have.property('id', productId);
      });
    });
    cy.log(`\n✅ Verificación completada para ${PRODUCT_COUNT} productos\n`);

    // Paso 3: Eliminar los productos creados
    cy.log(`🗑️  Iniciando eliminación de ${PRODUCT_COUNT} productos...`);
    cy.wrap(createdProductIds).each((productId, index) => {
      // Reportar progreso cada BATCH_SIZE productos
      if ((index + 1) % BATCH_SIZE === 0 || index === 0) {
        cy.log(`🗑️  Eliminando productos ${index + 1}-${Math.min(index + BATCH_SIZE, PRODUCT_COUNT)}/${PRODUCT_COUNT}`);
      }
      
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiBase')}/catalog/${productId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
        },
        failOnStatusCode: false,
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
        
        // Reportar progreso al final de cada lote
        if ((index + 1) % BATCH_SIZE === 0 || index === PRODUCT_COUNT - 1) {
          cy.log(`✅ ${index + 1}/${PRODUCT_COUNT} productos eliminados`);
        }
      });
    });
    cy.log(`\n✅ Eliminación completada para ${PRODUCT_COUNT} productos\n`);

    // Verificar que los productos ya no existen
    cy.log(`🔍 Verificando que los ${PRODUCT_COUNT} productos han sido eliminados...`);
    cy.wrap(createdProductIds).each((productId, index) => {
      if ((index + 1) % BATCH_SIZE === 0 || index === 0) {
        cy.log(`🔍 Verificando eliminación de productos ${index + 1}-${Math.min(index + BATCH_SIZE, PRODUCT_COUNT)}/${PRODUCT_COUNT}`);
      }
      
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBase')}/catalog/${productId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-merchant-id': Cypress.env('merchantId'),
        },
        failOnStatusCode: false,
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
    cy.log(`\n✅ Verificación de eliminación completada para ${PRODUCT_COUNT} productos\n`);
  });

  // Limpieza en caso de fallo
  after(() => {
    if (createdProductIds.length > 0) {
      const remaining = createdProductIds.length;
      cy.log(`\n⚠️  Realizando limpieza de ${remaining} productos de prueba restantes...`);
      
      createdProductIds.forEach((productId, index) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiBase')}/catalog/${productId}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'x-merchant-id': Cypress.env('merchantId'),
          },
          failOnStatusCode: false,
          timeout: 30000
        }).then(() => {
          if ((index + 1) % BATCH_SIZE === 0 || index === remaining - 1) {
            const progress = Math.round(((index + 1) / remaining) * 100);
            cy.log(`Limpieza: ${index + 1}/${remaining} productos (${progress}%)`);
          }
        });
      });
      
      cy.log(`\n✅ Limpieza completada para ${remaining} productos\n`);
    }
  });
});
