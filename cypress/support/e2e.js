import 'cypress-plugin-tab';
import "./commands";

// The following code is used to prevent Cypress from
// failing the test on uncaught exceptions from the application code.
// Specifically, Next.js sometimes throws a 'NEXT_REDIRECT' error that is safe to ignore.
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  if (err.message.includes('NEXT_REDIRECT')) {
    return false
  }
  // we still want to fail on other uncaught exceptions
  return true
});

// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// Limpieza automática antes de cada suite de tests (DESACTIVADA TEMPORALMENTE)
// before(() => {
//   cy.task('nodeCleanContacts');
// });
// ***********************************************************
