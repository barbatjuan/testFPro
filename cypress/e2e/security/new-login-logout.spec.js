describe('Authentication', () => {
  beforeEach(() => {
    // Es una buena práctica visitar la página de login antes de cada prueba.
    // Reemplaza '/login' con la URL real de tu página de inicio de sesión.
        cy.visit('/login', { failOnStatusCode: false });
  });

  it('should allow a user to log in and log out successfully', () => {
            // Usamos las credenciales del archivo .env que Cypress carga automáticamente.
            const username = Cypress.env('USER_EMAIL');
    const password = Cypress.env('USER_PASSWORD');

    // Reemplaza los selectores con los de tu aplicación.
        // Usamos los selectores de ID proporcionados por el usuario.
    cy.get('#email').type(username);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();

    // Verificar que el usuario es redirigido a la página principal.
    cy.url().should('eq', 'https://factupro-frontend-dev.vercel.app/');

        // --- Prueba de Logout ---
    // 1. Hacemos clic en el menú desplegable del usuario. Buscamos un botón que contenga el email.
    cy.get('button').filter(`:contains("${Cypress.env('USER_EMAIL')}")`).click();

    // 2. Hacemos clic en el item del menú que contiene el texto exacto "Cerrar sesión".
    cy.get('[role="menuitem"]').contains('Cerrar sesión').click();

    // Verificar que el usuario es redirigido a la página de login.
    cy.url().should('include', '/login');
  });
});
