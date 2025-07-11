// cypress/e2e/contacts/create-multiple-contacts.spec.js
describe("API: Creación masiva de Contactos", () => {
  const NUM_CONTACTS = 200; // Aumentamos a 200 contactos
  const BATCH_SIZE = 10; // Procesar en lotes para evitar sobrecargar la API
  let token;
  const contactIds = [];
  const creationTimes = [];
  let testRunId; // Identificador único para esta ejecución de pruebas
  let startTime; // Para medir el tiempo total

  before(() => {
    // Generar un ID único para esta ejecución de pruebas
    testRunId = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    cy.log(`🆔 ID de esta ejecución: ${testRunId}`);
    
    // Iniciar sesión una sola vez
    return cy.loginApi().then((t) => {
      token = t;
      cy.log('✅ Token de autenticación obtenido');
    });
  });

  function generateUniqueNif(index) {
    // Generar un NIF válido para empresa española
    // Formato: Una letra (A, B, C, D, E, F, G, H, J, N, P, Q, R, S, U, V, W) + 7 números + letra de control
    const letrasValidas = 'ABCDEFGHJNPQRSUVW';
    const letraInicial = letrasValidas[Math.floor(Math.random() * letrasValidas.length)];
    
    // Generar 7 dígitos aleatorios únicos usando el testRunId y el índice
    const numeros = (testRunId + index).padStart(7, '0').slice(-7);
    
    // Calcular letra de control (para simplificar, usaremos 'A' como letra de control)
    // En un entorno real, aquí iría el algoritmo de cálculo de la letra del NIF
    const letraControl = 'A';
    
    return `${letraInicial}${numeros}${letraControl}`;
  }

  function generateContactData(contactNum) {
    const uniqueNif = generateUniqueNif(contactNum);
    return {
      name: `Contacto Test ${testRunId}-${contactNum}`,
      email: `contacto.${testRunId}.${contactNum}@test.com`,
      nif: uniqueNif,
      isCustomer: true,
      isSupplier: false,
      type: "company",
      phone: `+34 600 ${String(contactNum).padStart(3, '0')} ${String(testRunId).slice(-3)}`,
      address: `Calle Test ${testRunId}, ${contactNum}`,
      city: "Madrid",
      zipCode: "28001",
      country: "ESP",
      state: "Madrid"
    };
  }

  function processBatch(batch) {
    return batch.reduce((chain, contactData) => {
      return chain.then(() => {
        const startTime = Date.now();
        return cy.createContactApi(token, contactData).then(response => {
          const endTime = Date.now();
          creationTimes.push(endTime - startTime);
          
          // Validaciones básicas
          expect(response).to.be.an('object');
          expect(response).to.have.property('id').and.to.be.a('string');
          expect(response).to.have.property('name', contactData.name);
          expect(response).to.have.property('email', contactData.email);
          expect(response).to.have.property('nif', contactData.nif);
          
          contactIds.push(response.id);
          cy.log(`✅ Contacto ${contactIds.length}/${NUM_CONTACTS} creado - ID: ${response.id}`);
          
          return cy.wrap(response);
        });
      });
    }, cy.wrap([]));
  }

  it(`debería crear ${NUM_CONTACTS} contactos correctamente`, () => {
    startTime = Date.now();
    cy.log(`🚀 Iniciando creación de ${NUM_CONTACTS} contactos...`);
    
    // Crear un array con todos los lotes
    const allBatches = [];
    for (let i = 0; i < NUM_CONTACTS; i += BATCH_SIZE) {
      const batch = [];
      const batchEnd = Math.min(i + BATCH_SIZE, NUM_CONTACTS);
      
      // Crear datos para este lote
      for (let j = i; j < batchEnd; j++) {
        batch.push(generateContactData(j + 1));
      }
      allBatches.push(batch);
    }
    
    // Procesar cada lote secuencialmente
    return allBatches.reduce((chain, batch, index) => {
      return chain.then(() => {
        cy.log(`🔄 Procesando lote ${index + 1}/${allBatches.length} (${batch.length} contactos)`);
        return processBatch(batch).then(() => {
          // Pequeña pausa entre lotes si no es el último
          if (index < allBatches.length - 1) {
            return cy.wait(500);
          }
        });
      });
    }, cy.wrap());
    
    // Crear los contactos uno por uno
    cy.wrap(contactsData).each((contactData, index) => {
      const contactNum = index + 1;
      
      cy.log(`\n📝 Creando contacto ${contactNum}/${NUM_CONTACTS}...`);
      cy.log('Datos del contacto:', JSON.stringify(contactData, null, 2));
      
      // Crear el contacto
      cy.createContactApi(token, contactData).then((response) => {
        // Mostrar la respuesta completa para depuración
        cy.log(`✅ Respuesta del API para contacto ${contactNum}:`, JSON.stringify(response, null, 2));
        
        // Verificar que la respuesta sea un objeto
        if (!response || typeof response !== 'object') {
          cy.log('❌ La respuesta no es un objeto:', response);
          throw new Error('La respuesta del API no es un objeto');
        }
        
        // Verificar propiedades requeridas
        const requiredProps = ['id', 'name', 'email', 'nif'];
        requiredProps.forEach(prop => {
          if (!(prop in response)) {
            cy.log(`❌ La respuesta no tiene la propiedad requerida: ${prop}`);
            cy.log('Propiedades disponibles:', Object.keys(response));
            throw new Error(`Falta la propiedad requerida: ${prop}`);
          }
        });
        
        // Verificar tipos de datos
        expect(response.id, 'ID debe ser un string').to.be.a('string');
        expect(response.name, 'Name debe ser un string').to.be.a('string');
        expect(response.email, 'Email debe ser un string').to.be.a('string');
        expect(response.nif, 'NIF debe ser un string').to.be.a('string');
        
        // Verificar que los datos coincidan con los enviados
        expect(response.name, 'El nombre no coincide').to.equal(contactData.name);
        expect(response.email, 'El email no coincide').to.equal(contactData.email);
        expect(response.nif, 'El NIF no coincide').to.equal(contactData.nif);
        
        // Guardar el ID para limpieza posterior
        contactIds.push(response.id);
        cy.log(`✅ Contacto ${contactNum} creado - ID: ${response.id}`);
      });
    });
    
    // Calcular métricas
    cy.then(() => {
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // en segundos
      const avgTimePerContact = creationTimes.reduce((a, b) => a + b, 0) / creationTimes.length;
      
      // Mostrar métricas
      cy.log('\n📊 Métricas de rendimiento:');
      cy.log(`- Tiempo total: ${totalTime.toFixed(2)} segundos`);
      cy.log(`- Contactos por segundo: ${(NUM_CONTACTS / totalTime).toFixed(2)}`);
      cy.log(`- Tiempo promedio por contacto: ${avgTimePerContact.toFixed(2)} ms`);
      cy.log(`- Tiempo mínimo: ${Math.min(...creationTimes)} ms`);
      cy.log(`- Tiempo máximo: ${Math.max(...creationTimes)} ms`);
      
      // Verificar que se crearon todos los contactos
      expect(contactIds, 'No se crearon todos los contactos')
        .to.have.length(NUM_CONTACTS);
      cy.log(`\n✅ Se crearon correctamente ${contactIds.length} de ${NUM_CONTACTS} contactos`);
      
      // Verificar unicidad de NIFs (opcional, para asegurar que no hay duplicados)
      const uniqueNifs = [...new Set(contactIds)];
      expect(uniqueNifs.length, 'Se detectaron NIFs duplicados')
        .to.equal(contactIds.length);
    });
  });

  after(() => {
    // Limpieza: Eliminar todos los contactos creados
    if (contactIds.length > 0) {
      const startCleanup = Date.now();
      cy.log(`\n🧹 Iniciando limpieza de ${contactIds.length} contactos de prueba...`);
      
      // Crear una función para eliminar un solo contacto
      function deleteContact(id) {
        return cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiBase')}/contacts/${id}`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-merchant-id': Cypress.env('merchantId'),
            'Content-Type': 'application/json'
          },
          failOnStatusCode: false,
          timeout: 10000
        }).then((response) => ({
          id,
          success: response.status === 200 || response.status === 204,
          status: response.status
        }));
      }
      
      // Eliminar contactos en lotes secuenciales
      let deletedCount = 0;
      let errorCount = 0;
      
      // Función para procesar un lote
      function processCleanupBatch(batch) {
        return batch.reduce((chain, id, index) => {
          return chain.then(() => {
            return deleteContact(id).then(result => {
              if (result.success) {
                deletedCount++;
                if (deletedCount % 10 === 0) {
                  cy.log(`🗑️  Eliminados ${deletedCount}/${contactIds.length} contactos...`);
                }
              } else {
                errorCount++;
                cy.log(`❌ Error eliminando contacto ${id}: ${result.status}`);
              }
              // Pequeña pausa entre eliminaciones
              return cy.wait(100);
            });
          });
        }, cy.wrap());
      }
      
      // Procesar todos los contactos en lotes
      return cy.wrap(contactIds).then(ids => {
        const batches = [];
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          batches.push(ids.slice(i, i + BATCH_SIZE));
        }
        
        return batches.reduce((chain, batch, index) => {
          return chain.then(() => {
            cy.log(`🧹 Procesando lote de limpieza ${index + 1}/${batches.length}`);
            return processCleanupBatch(batch);
          });
        }, cy.wrap()).then(() => {
          // Mostrar resumen de limpieza
          const cleanupTime = (Date.now() - startCleanup) / 1000;
          cy.log(`\n✅ Proceso de limpieza completado en ${cleanupTime.toFixed(2)} segundos`);
          cy.log(`- Contactos eliminados: ${deletedCount}`);
          if (errorCount > 0) {
            cy.log(`⚠️  Errores durante la limpieza: ${errorCount}`);
          }
        });
      });
    } else {
      cy.log('ℹ️  No hay contactos para eliminar');
      return cy.wrap();
    }
  });
});
