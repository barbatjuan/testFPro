// Node.js script to clean up Cypress test contacts (with phone or cellPhone) from all pages
// Usage: node scripts/cleanup-contacts.js

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Permitir argumentos por línea de comandos
// node cleanup-contacts.js --apiBase=... --merchantId=... --user=... --password=...
function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.replace(prefix, '') : undefined;
}

const apiBase = getArg('apiBase') || process.env.API_BASE;
const merchantId = getArg('merchantId') || process.env.MERCHANT_ID;
const user = getArg('user') || process.env.USER_EMAIL;
const password = getArg('password') || process.env.USER_PASSWORD;

if (!apiBase || !merchantId || !user || !password) {
  console.error('Faltan variables de entorno. Configura API_BASE, MERCHANT_ID, USER_EMAIL y USER_PASSWORD o pásalos como argumentos.');
  console.error('Ejemplo: node scripts/cleanup-contacts.js --apiBase=... --merchantId=... --user=... --password=...');
  process.exit(1);
}

async function login() {
  const res = await axios.post(`${apiBase}/auth/login`, {
    email: user,
    password: password,
  });
  return res.data.data.token;
}

async function fetchAllContacts(token) {
  let offset = 0;
  const limit = 100;
  let all = [];
  let hasNext = true;

  while (hasNext) {
    const res = await axios.get(`${apiBase}/contacts`, {
      params: { offset, limit },
      headers: {
        Authorization: `Bearer ${token}`,
        'x-merchant-id': merchantId,
      },
    });
    const data = res.data.data || [];
    all = all.concat(data);
    const pag = res.data.meta && res.data.meta.pagination;
    hasNext = pag && pag.hasNextPage;
    offset += limit;
    console.log(`Obtenidos ${data.length} contactos (offset ${offset - limit})`);
  }
  return all;
}

async function deleteContact(token, contact) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await axios.delete(`${apiBase}/contacts/${contact.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-merchant-id': merchantId,
            'Content-Type': 'application/json',
          },
        }
      );
      if (res.status === 200 || res.status === 204) {
        console.log(`✅ Eliminado: ${contact.name || 'Sin nombre'} (${contact.id})`);
        return true;
      }
    } catch (e) {
      if (e.response && e.response.status === 404) {
        console.log(`ℹ️ Ya eliminado: ${contact.id}`);
        return true;
      }
      console.warn(`Reintento ${i + 1} para ${contact.id}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.error(`❌ Error eliminando ${contact.id}`);
  return false;
}

(async () => {
  try {
    console.log('Autenticando...');
    const token = await login();
    console.log('Token obtenido. Buscando contactos...');
    const contacts = await fetchAllContacts(token);
    const toDelete = contacts.filter(c =>
      (c.phone && c.phone.trim() !== '') ||
      (c.cellPhone && c.cellPhone.trim() !== '')
    );
    console.log(`\nSe eliminarán ${toDelete.length} contactos de prueba.`);
    let deleted = 0, errors = 0;
    for (const c of toDelete) {
      const ok = await deleteContact(token, c);
      if (ok) deleted++; else errors++;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`\nResumen: Eliminados: ${deleted}, Errores: ${errors}`);
  } catch (e) {
    console.error('Error general:', e.message);
    process.exit(1);
  }
})();
