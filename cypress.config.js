// cypress.config.js
const { defineConfig } = require("cypress");
require("dotenv").config();
module.exports = defineConfig({
  e2e: {
    baseUrl: "https://factupro-frontend-dev.vercel.app",
    specPattern: "cypress/e2e/**/*.{spec,cy}.js",
    supportFile: "cypress/support/e2e.js",
    env: {
      apiBase: process.env.API_BASE,
            USER_EMAIL: process.env.USER_EMAIL,
      USER_PASSWORD: process.env.USER_PASSWORD,
      merchantId: process.env.MERCHANT_ID,
    },
    setupNodeEvents(on, config) {
      // Tarea custom para limpieza automática
      const { execSync } = require('child_process');
      on('task', {
        nodeCleanContacts() {
          try {
            execSync('node scripts/cleanup-contacts.js', { stdio: 'inherit' });
            return null;
          } catch (e) {
            console.error('Error ejecutando limpieza automática:', e);
            throw e;
          }
        },
      });
      return config;
    },
  },
});
