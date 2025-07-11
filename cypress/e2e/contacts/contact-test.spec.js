// cypress/e2e/contacts/contact-test.spec.js
describe("UI: Prueba de Contactos", () => {
  // Deshabilitar el manejo de excepciones no capturadas
  Cypress.on('uncaught:exception', (err) => {
    // Ignorar el error NEXT_REDIRECT
    if (err.message.includes('NEXT_REDIRECT')) {
      return false; // No fallar la prueba
    }
    // Para otros errores, fallar la prueba
    return true;
  });
  // Datos de prueba
  const testContact = {
    name: `Cypress UI Test ${Date.now()}`,
    email: `cypress.ui.${Date.now()}@test.com`,
    phone: `6${Math.floor(10000000 + Math.random() * 90000000)}`,
    nif: `B${Math.floor(1000000 + Math.random() * 9000000)}X`,
    address: "Calle de Prueba UI, 123",
    city: "Madrid",
    zipCode: "28001",
    country: "España"
  };

  // Comando para login vía API
  Cypress.Commands.add('loginByApi', (email, password) => {
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiBase')}/auth/login`,
      body: { email, password },
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200 || response.status === 201) {
        return response.body.data.token;
      }
      throw new Error('Login fallido');
    });
  });

  before(() => {
    // Limpiar cookies y localStorage
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Iniciar sesión y guardar el token
    const email = 'testfpro1@adrirodrigoagencia.es';
    const password = 'Testfpro_123!!';
    
    // Usar el comando de login por API
    return cy.loginByApi(email, password).then((token) => {
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      
      // Guardar el token en una variable de entorno
      Cypress.env('authToken', token);
      
      // Configurar el token en localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('auth-token', token);
      });
      
      // Configurar el token en las cookies
      return cy.setCookie('auth-token', token, {
        domain: 'factupro-frontend-dev.vercel.app',
        path: '/',
        secure: true,
        sameSite: 'Lax'
      });
    }).then(() => {
      cy.log('Sesión configurada correctamente');
    });
  });

  it("debería cargar la aplicación", () => {
    // Verificar que el token existe antes de continuar
    const token = Cypress.env('authToken');
    expect(token, 'El token de autenticación debe existir').to.exist;
    
    // Configurar localStorage antes de visitar la página
    cy.window().then((win) => {
      win.localStorage.setItem('auth-token', token);
    });
    
    // Configurar cookies antes de visitar la página
    cy.setCookie('auth-token', token, {
      domain: '.factupro-frontend-dev.vercel.app',
      path: '/',
      secure: true,
      sameSite: 'Lax'
    });
    
    // Visitar la página principal con headers de autenticación
    cy.visit('/', {
      timeout: 60000,
      failOnStatusCode: false,
      onBeforeLoad: (win) => {
        win.localStorage.setItem('auth-token', token);
      }
    });
    
    // Verificar que la aplicación se cargó
    cy.get('body', { timeout: 30000 }).should('be.visible');
    
    // Verificar que estamos autenticados
    cy.window().its('localStorage.auth-token').should('exist');
    cy.getCookie('auth-token').should('exist');
    
    // Depuración: imprimir información útil
    cy.window().then((win) => {
      cy.log('Token en localStorage:', win.localStorage.getItem('auth-token'));
      cy.log('URL actual:', win.location.href);
    });
    
    // Tomar captura de pantalla
    cy.screenshot('pagina-principal');
  });
  
  it.only("debería navegar al formulario de contacto", () => {
    // Primero asegurarnos de estar en la página principal
    cy.visit('/', {
      timeout: 60000,
      failOnStatusCode: false
    });
    
    // Esperar a que la aplicación esté lista
    cy.get('body', { timeout: 30000 }).should('be.visible');
    
    // Navegar al formulario de contacto
    cy.window().then((win) => {
      // Usar window.location para evitar problemas con el router de Next.js
      win.location.href = '/contacts/new';
    });
    
    // Verificar que estamos en la página correcta
    cy.url({ timeout: 60000 }).should('include', '/contacts/new');
    
    // Esperar a que el contenido se cargue
    cy.get('body', { timeout: 30000 }).should('be.visible');
    
    // Verificar que el formulario está visible
    // Usamos varios selectores comunes para formularios
    cy.get('form, [data-testid="contact-form"], [role="form"], form', { timeout: 30000 })
      .should('be.visible')
      .then(($form) => {
        cy.log('Formulario encontrado:', $form[0]);
      });
    
    // Tomar captura de pantalla
    cy.screenshot('formulario-contacto');
    
    // Depuración adicional
    cy.document().then((doc) => {
      cy.log('Contenido del body:', doc.body.innerText.substring(0, 1000));
    });
  });
  
  after(() => {
    // Limpiar el token después de las pruebas
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Opcional: Eliminar el contacto de prueba creado
    if (testContact && testContact.email) {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBase')}/contacts`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('authToken')}`,
          'x-merchant-id': Cypress.env('merchantId')
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.body && response.body.data) {
          const contact = response.body.data.find(c => c.email === testContact.email);
          if (contact) {
            return cy.request({
              method: 'DELETE',
              url: `${Cypress.env('apiBase')}/contacts/${contact.id}`,
              headers: {
                'Authorization': `Bearer ${Cypress.env('authToken')}`,
                'x-merchant-id': Cypress.env('merchantId')
              },
              failOnStatusCode: false
            });
          }
        }
      }).then(() => {
        cy.log('Limpieza de datos de prueba completada');
      });
    }
  });
});
