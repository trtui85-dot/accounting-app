import pg from 'pg';
const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accounting_local';

const pool = new Pool({
  connectionString: DB_URL,
  ssl: DB_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  options: '-c search_path=accounting_app,public',
});

export async function query(sql, params = []) {
  let processed = sql;
  const processedParams = [];
  let paramIndex = 1;
  if (params && params.length > 0) {
    for (let i = 0; i < sql.length; i++) {
      if (sql[i] === '?') {
        processed = processed.substring(0, i) + `$${paramIndex++}` + processed.substring(i + 1);
        processedParams.push(params[processedParams.length]);
        i += 1;
      }
    }
  }
  const result = await pool.query(processed, processedParams);
  return [result.rows, result.fields];
}

export async function execQuery(sql, params = []) {
  let processed = sql;
  const processedParams = [];
  let paramIndex = 1;

  if (params && params.length > 0) {
    for (let i = 0; i < sql.length; i++) {
      if (sql[i] === '?') {
        const param = params[processedParams.length];
        if (Array.isArray(param)) {
          const placeholders = param.map(() => `$${paramIndex++}`).join(', ');
          processed = processed.substring(0, i) + placeholders + processed.substring(i + 1);
          processedParams.push(...param);
          i += placeholders.length - 1;
        } else {
          processed = processed.substring(0, i) + `$${paramIndex++}` + processed.substring(i + 1);
          processedParams.push(param);
        }
      }
    }
  }

  const isInsert = /^\s*INSERT/i.test(sql);
  if (isInsert && !processed.includes('RETURNING')) {
    processed += ' RETURNING *';
  }

  const result = await pool.query(processed, processedParams);
  return isInsert ? result.rows[0] : result.rows;
}

async function ensureSchema() {
  await pool.query('CREATE SCHEMA IF NOT EXISTS accounting_app');
}

async function migrate() {
  await ensureSchema();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      pin_hash VARCHAR(200) NOT NULL,
      role VARCHAR(20) DEFAULT 'USER',
      avatar_color VARCHAR(7) DEFAULT '#6366f1',
      permissions JSONB DEFAULT '{}',
      active SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200),
      phone VARCHAR(30),
      mobile VARCHAR(30),
      address TEXT,
      city VARCHAR(100),
      country VARCHAR(100) DEFAULT 'Mauritanie',
      tva_number VARCHAR(50),
      notes TEXT,
      active SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      unit_price DECIMAL(12,2) DEFAULT 0,
      tva_rate DECIMAL(5,2) DEFAULT 0,
      unit VARCHAR(20) DEFAULT 'unité',
      active SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(30) UNIQUE NOT NULL,
      client_id INTEGER REFERENCES accounting_app.clients(id),
      status VARCHAR(20) DEFAULT 'draft',
      issue_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(12,2) DEFAULT 0,
      tva_total DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES accounting_app.invoices(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES accounting_app.products(id),
      description VARCHAR(500),
      quantity DECIMAL(10,2) DEFAULT 1,
      unit_price DECIMAL(12,2) DEFAULT 0,
      tva_rate DECIMAL(5,2) DEFAULT 0,
      subtotal DECIMAL(12,2) DEFAULT 0,
      tva_amount DECIMAL(12,2) DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES accounting_app.invoices(id) ON DELETE CASCADE,
      amount DECIMAL(12,2) NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      method VARCHAR(30) DEFAULT 'cash',
      reference VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounting_app.settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(200) DEFAULT 'Mon Entreprise',
      company_address TEXT,
      company_phone VARCHAR(30),
      company_email VARCHAR(200),
      company_tva VARCHAR(50),
      currency VARCHAR(10) DEFAULT 'MRU',
      currency_symbol VARCHAR(5) DEFAULT 'MRU',
      invoice_prefix VARCHAR(10) DEFAULT 'FA',
      invoice_next_number INTEGER DEFAULT 1,
      notes TEXT
    )
  `);

  // Fix admin phone + PIN
  const bcryptMod = await import('bcryptjs');
  const bcrypt = bcryptMod.default || bcryptMod;
  const adminPinHash = await bcrypt.hash('2222', 10);
  await pool.query(`UPDATE accounting_app.users SET phone = '22222222', pin_hash = $1, active = 1 WHERE role = 'ADMIN'`, [adminPinHash]);

  // Seed admin if not exists
  const existingResult = await pool.query(`SELECT id FROM accounting_app.users WHERE phone = '22222222'`);
  if (existingResult.rows.length === 0) {
    await pool.query(`INSERT INTO accounting_app.users (name, phone, pin_hash, role, avatar_color) VALUES ('Admin', '22222222', $1, 'ADMIN', '#ef4444')`, [adminPinHash]);
  }

  // Seed settings
  const settingsResult = await pool.query(`SELECT id FROM accounting_app.settings LIMIT 1`);
  if (settingsResult.rows.length === 0) {
    await pool.query(`INSERT INTO accounting_app.settings (company_name, currency, currency_symbol, invoice_prefix, invoice_next_number) VALUES ('Mon Entreprise', 'MRU', 'MRU', 'FA', 1)`);
  }

  // Seed clients
  const clientsResult = await pool.query(`SELECT id FROM accounting_app.clients LIMIT 1`);
  if (clientsResult.rows.length === 0) {
    const clients = [
      ['Société NHAMA', 'contact@nhama.mr', '45321010', '44123456', 'Avenue de la République', 'Nouakchott'],
      ['Boulangerie El Baraka', 'elbaraka@gmail.com', '45201020', '44234567', 'Quartier Ancienne', 'Nouakchott'],
      ['Entreprise Taghyra', 'info@taghyra.mr', '45303030', '44345678', 'Zone Industrielle', 'Nouakchott'],
      ['Café Restaurant Tchernou', 'tchernou@gmail.com', '45404040', '44456789', 'Centre Ville', 'Nouadhibou'],
      ['Librairie Safahat', 'safahat@gmail.com', '45505050', '44567890', 'Avenue Ksar', 'Nouakchott'],
    ];
    for (const c of clients) {
      await pool.query(`INSERT INTO accounting_app.clients (name, email, phone, mobile, address, city) VALUES ($1,$2,$3,$4,$5,$6)`, c);
    }
  }

  // Seed products
  const productsResult = await pool.query(`SELECT id FROM accounting_app.products LIMIT 1`);
  if (productsResult.rows.length === 0) {
    const products = [
      ['Consultation', 'Service de conseil', 15000, 16, 'heure'],
      ['Développement Web', 'Création de site web', 150000, 16, 'projet'],
      ['Maintenance Informatique', 'Support technique mensuel', 25000, 16, 'mois'],
      ['Fournitures Bureau', 'Papeterie et fournitures', 5000, 16, 'lot'],
      ['Formation', 'Formation professionnelle', 50000, 16, 'jour'],
      ['Impression', 'Service d\'impression', 2000, 16, 'page'],
      ['Transport', 'Frais de transport', 10000, 16, 'course'],
      ['Hébergement Web', 'Hébergement annuel', 30000, 16, 'an'],
    ];
    for (const p of products) {
      await pool.query(`INSERT INTO accounting_app.products (name, description, unit_price, tva_rate, unit) VALUES ($1,$2,$3,$4,$5)`, p);
    }
  }

  // Seed invoices + items + payments
  const invoicesResult = await pool.query(`SELECT id FROM accounting_app.invoices LIMIT 1`);
  if (invoicesResult.rows.length === 0) {
    const invoices = [
      ['FA-0001', 1, 'paid', '2026-01-15', '2026-02-15', 150000, 24000, 174000, 174000],
      ['FA-0002', 2, 'paid', '2026-02-10', '2026-03-10', 200000, 32000, 232000, 232000],
      ['FA-0003', 3, 'sent', '2026-03-01', '2026-04-01', 75000, 12000, 87000, 0],
      ['FA-0004', 1, 'overdue', '2026-04-20', '2026-05-20', 50000, 8000, 58000, 0],
      ['FA-0005', 4, 'sent', '2026-05-10', '2026-06-10', 300000, 48000, 348000, 100000],
      ['FA-0006', 5, 'draft', '2026-06-01', '2026-07-01', 10000, 1600, 11600, 0],
      ['FA-0007', 2, 'sent', '2026-06-15', '2026-07-15', 120000, 19200, 139200, 0],
      ['FA-0008', 3, 'paid', '2026-07-01', '2026-08-01', 45000, 7200, 52200, 52200],
      ['FA-0009', 1, 'draft', '2026-07-20', '2026-08-20', 80000, 12800, 92800, 0],
      ['FA-0010', 4, 'sent', '2026-08-01', '2026-09-01', 250000, 40000, 290000, 50000],
    ];
    for (const inv of invoices) {
      await pool.query(`INSERT INTO accounting_app.invoices (invoice_number, client_id, status, issue_date, due_date, subtotal, tva_total, total, paid_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, inv);
    }

    // Invoice items
    const items = [
      [1, 2, 'Développement site vitrine', 1, 150000, 16, 150000, 24000],
      [3, 1, 'Consultation technique', 5, 15000, 16, 75000, 12000],
      [4, 3, 'Maintenance mensuelle', 2, 25000, 16, 50000, 8000],
      [5, 5, 'Formation React', 6, 50000, 16, 300000, 48000],
      [7, 8, 'Hébergement web 3 ans', 4, 30000, 16, 120000, 19200],
      [10, 2, 'Développement application', 1, 150000, 16, 150000, 24000],
      [10, 4, 'Formation avancée', 2, 50000, 16, 100000, 16000],
    ];
    for (const it of items) {
      await pool.query(`INSERT INTO accounting_app.invoice_items (invoice_id, product_id, description, quantity, unit_price, tva_rate, subtotal, tva_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, it);
    }

    // Payments
    const payments = [
      [1, 174000, '2026-02-14', 'bank_transfer', 'VIR-2026-001', 'Paiement complet'],
      [2, 232000, '2026-03-08', 'bank_transfer', 'VIR-2026-002', 'Paiement complet'],
      [5, 100000, '2026-05-15', 'cash', 'ESP-001', 'Acompte'],
      [8, 52200, '2026-07-30', 'check', 'CHQ-2026-001', 'Paiement par chèque'],
      [10, 50000, '2026-08-05', 'cash', 'ESP-002', 'Premier acompte'],
    ];
    for (const p of payments) {
      await pool.query(`INSERT INTO accounting_app.payments (invoice_id, amount, payment_date, method, reference, notes) VALUES ($1,$2,$3,$4,$5,$6)`, p);
    }

    // Update invoice next number
    await pool.query(`UPDATE accounting_app.settings SET invoice_next_number = 11`);
  }

  console.log('✓ Accounting DB migrated + seeded');
}

export default pool;
export { migrate };
