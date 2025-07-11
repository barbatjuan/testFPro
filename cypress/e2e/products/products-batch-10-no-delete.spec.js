describe('API: Creación y verificación de 10 productos (sin borrado)', () => {
  let token;
  const PRODUCT_COUNT = 10;

  before(() => {
    // Obtener token de autenticación
    cy.loginApi().then(t => {
      token = t;
      expect(token).to.be.a('string');
    });
  });

  it(`debería crear y verificar ${PRODUCT_COUNT} productos`, () => {
    const createdProductIds = [];

    // Paso 1: Crear productos
    Cypress._.times(PRODUCT_COUNT, (i) => {
      const productData = {
        name: `Producto Cypress ${Date.now()}-${i + 1}`,
        description: `Descripción del producto de prueba ${i + 1}`,
        price: 99.99 + i,
        type: 'PRODUCT',
        tags: ['test', 'cypress', `batch-10-no-delete-${i + 1}`]
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

    // Paso 2: Verificar que se crearon los productos
    cy.wrap(createdProductIds).should('have.length', PRODUCT_COUNT).then(() => {
      // Paso 3: Verificar que los productos existen en el sistema
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
    });
  });
});
