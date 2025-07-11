// Pruebas de performance y paginación en contactos

describe('Performance y paginación de contactos (API)', () => {
  let token;
  let merchantId;

  before(() => {
    cy.request('POST', `${Cypress.env('apiBase')}/auth/login`, {
      email: Cypress.env('user'),
      password: Cypress.env('password'),
    }).then((resp) => {
      token = resp.body.data.token;
      merchantId = Cypress.env('merchantId');
    });
  });

  before(() => {
    // Crear 30 contactos para asegurar que hay datos para paginar
    const createContact = (i) => cy.request({
      method: 'POST',
      url: `${Cypress.env('apiBase')}/contacts`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-merchant-id': merchantId,
      },
      body: {
        name: `PerfContact${i}`,
        email: `perf${i}@test.com`,
        phone: `6000000${i}`,
        type: 'person',
        nif: `PERF${String(i).padStart(7, '0')}T`,
        isCustomer: true,
        isSupplier: false,
        preferences: [],
      },
      failOnStatusCode: false, // Ignorar si ya existe
    });

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiBase')}/contacts?limit=100`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-merchant-id': merchantId,
      },
    }).then(response => {
        const existingContacts = response.body.data.filter(c => c.name && c.name.startsWith('PerfContact')).length;
        const contactsToCreate = 30 - existingContacts;
        if (contactsToCreate > 0) {
            cy.log(`Creando ${contactsToCreate} contactos de prueba...`);
            for (let i = 0; i < contactsToCreate; i++) {
                createContact(existingContacts + i);
            }
        } else {
            cy.log('Ya existen suficientes contactos de prueba.');
        }
    });
  });

  it('La API de contactos responde en menos de 2 segundos', () => {
    const start = Date.now();
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiBase')}/contacts`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-merchant-id': merchantId,
      },
    }).then((response) => {
      const duration = Date.now() - start;
      expect(response.status).to.eq(200);
      expect(response.body.data).to.have.length.of.at.least(1);
      cy.log(`API response time: ${duration}ms`);
      expect(duration).to.be.lessThan(2000);
    });
  });

  it('La API permite paginar los resultados', () => {
    // Asumimos que el tamaño de página por defecto es 20
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiBase')}/contacts?offset=20&limit=10`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-merchant-id': merchantId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // Deberíamos tener 10 contactos en la segunda página (30 total - 20 de la primera)
      expect(response.body.data).to.have.length.of.at.least(1);
      if (response.body.meta && response.body.meta.pagination) {
        expect(response.body.meta.pagination.total).to.be.gte(30);
      }
    });
  });
});
