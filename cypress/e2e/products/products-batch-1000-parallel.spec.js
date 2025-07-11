describe('API: Creación masiva de 1000 productos por lotes', () => {
  let token;
  const PRODUCT_COUNT = 1000;
  const BATCH_SIZE = 50; // Procesar en lotes de 50

  before(() => {
    // Aumentar el timeout para comandos largos
    Cypress.config('defaultCommandTimeout', 180000); // 3 minutos

    cy.loginApi().then(t => {
      token = t;
      expect(token).to.be.a('string');
    });
  });

  it(`debería crear ${PRODUCT_COUNT} productos en lotes de ${BATCH_SIZE}`, () => {
    const productDataArray = [];
    for (let i = 0; i < PRODUCT_COUNT; i++) {
      productDataArray.push({
        name: `Producto Lote ${Date.now()}-${i + 1}`,
        description: `Descripción del producto de prueba en lote ${i + 1}`,
        price: parseFloat((Math.random() * 200 + 1).toFixed(2)),
        type: 'PRODUCT',
        tags: ['test', 'cypress', 'batch-1000']
      });
    }

    const batches = [];
    for (let i = 0; i < productDataArray.length; i += BATCH_SIZE) {
      batches.push(productDataArray.slice(i, i + BATCH_SIZE));
    }

    let successfulCreations = 0;
    let failedCreations = 0;

    // Usar cy.wrap().each() para procesar lotes secuencialmente
    cy.wrap(batches).each((batch, index) => {
      cy.log(`Procesando lote ${index + 1}/${batches.length}...`);
      
      const promises = batch.map(productData => {
        return cy.request({
          method: 'POST',
          url: `${Cypress.env('apiBase')}/catalog`,
          headers: {
            Authorization: `Bearer ${token}`,
            'x-merchant-id': Cypress.env('merchantId'),
            'Content-Type': 'application/json'
          },
          body: productData,
          failOnStatusCode: false
        });
      });

      // Esperar a que todas las promesas del lote actual se completen
      return cy.wrap(Promise.all(promises)).then(responses => {
        const successesInBatch = responses.filter(r => r.status === 201).length;
        const failuresInBatch = responses.length - successesInBatch;
        successfulCreations += successesInBatch;
        failedCreations += failuresInBatch;
        cy.log(`Lote ${index + 1} completado: ${successesInBatch} éxitos, ${failuresInBatch} fallos.`);
      });

    }).then(() => {
      // Verificación final después de procesar todos los lotes
      cy.log('--- Resumen Final ---');
      cy.log(`✅ Total de productos creados con éxito: ${successfulCreations}`);
      cy.log(`❌ Total de creaciones fallidas: ${failedCreations}`);
      
      expect(successfulCreations).to.eq(PRODUCT_COUNT);
      expect(failedCreations).to.eq(0);
    });
  });
});
