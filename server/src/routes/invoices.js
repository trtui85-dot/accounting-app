import { Router } from 'express';
import { query, execQuery } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

// GET / - List all invoices
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT i.id, i.invoice_number, i.client_id, c.name AS client_name,
             i.status, i.issue_date, i.due_date, i.subtotal, i.tva_total,
             i.total, i.paid_amount, i.created_at
      FROM accounting_app.invoices i
      LEFT JOIN accounting_app.clients c ON i.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND i.status = ?`; params.push(status); }
    if (search) { sql += ` AND (i.invoice_number ILIKE ? OR c.name ILIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    sql += ` ORDER BY i.created_at DESC`;
    const [rows] = await query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /stats - Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN status IN ('sent') THEN total ELSE 0 END), 0) AS total_pending,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END), 0) AS total_overdue,
        COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
        COUNT(*) FILTER (WHERE status = 'sent') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
        COUNT(*) AS total_invoices
      FROM accounting_app.invoices
      WHERE status != 'cancelled'
    `);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /:id - Full invoice detail
router.get('/:id', async (req, res) => {
  try {
    const [invoices] = await query(`
      SELECT i.*, c.name AS client_name, c.email AS client_email,
             c.phone AS client_phone, c.address AS client_address,
             c.city AS client_city, c.country AS client_country,
             c.tva_number AS client_tva_number
      FROM accounting_app.invoices i
      LEFT JOIN accounting_app.clients c ON i.client_id = c.id
      WHERE i.id = ?
    `, [req.params.id]);
    if (invoices.length === 0) return res.status(404).json({ error: 'Not found' });

    const [items] = await query(`
      SELECT ii.*, p.name AS product_name
      FROM accounting_app.invoice_items ii
      LEFT JOIN accounting_app.products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `, [req.params.id]);

    const [payments] = await query(`
      SELECT * FROM accounting_app.payments WHERE invoice_id = ? ORDER BY payment_date
    `, [req.params.id]);

    res.json({ ...invoices[0], items, payments });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST / - Create invoice
router.post('/', async (req, res) => {
  try {
    const { client_id, issue_date, due_date, notes, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Au moins un article requis' });

    // Generate invoice number
    const [settingsRows] = await query(`SELECT invoice_prefix, invoice_next_number FROM accounting_app.settings LIMIT 1`);
    const settings = settingsRows[0];
    const invoice_number = `${settings.invoice_prefix}-${String(settings.invoice_next_number).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let tva_total = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const tvaRate = Number(item.tva_rate) || 0;
      const lineSubtotal = qty * price;
      const lineTva = lineSubtotal * (tvaRate / 100);
      subtotal += lineSubtotal;
      tva_total += lineTva;
    }
    const total = subtotal + tva_total;

    // Insert invoice
    const invoice = await execQuery(
      `INSERT INTO accounting_app.invoices (invoice_number, client_id, status, issue_date, due_date, subtotal, tva_total, total, paid_amount, notes) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, 0, ?)`,
      [invoice_number, client_id, issue_date, due_date, subtotal, tva_total, total, notes]
    );

    // Insert items
    const createdItems = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const tvaRate = Number(item.tva_rate) || 0;
      const lineSubtotal = qty * price;
      const lineTva = lineSubtotal * (tvaRate / 100);
      const createdItem = await execQuery(
        `INSERT INTO accounting_app.invoice_items (invoice_id, product_id, description, quantity, unit_price, tva_rate, subtotal, tva_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoice.id, item.product_id, item.description, qty, price, tvaRate, lineSubtotal, lineTva]
      );
      createdItems.push(createdItem);
    }

    // Increment next number
    await execQuery(
      `UPDATE accounting_app.settings SET invoice_next_number = invoice_next_number + 1 WHERE id = ?`,
      [settings.id]
    );

    res.json({ ...invoice, items: createdItems });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /:id - Update invoice (draft only)
router.put('/:id', async (req, res) => {
  try {
    const [existing] = await query(`SELECT status FROM accounting_app.invoices WHERE id = ?`, [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    if (existing[0].status !== 'draft') return res.status(400).json({ error: 'Seules les factures brouillon peuvent être modifiées' });

    const { client_id, issue_date, due_date, notes, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Au moins un article requis' });

    // Calculate totals
    let subtotal = 0;
    let tva_total = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const tvaRate = Number(item.tva_rate) || 0;
      const lineSubtotal = qty * price;
      const lineTva = lineSubtotal * (tvaRate / 100);
      subtotal += lineSubtotal;
      tva_total += lineTva;
    }
    const total = subtotal + tva_total;

    // Update invoice
    await execQuery(
      `UPDATE accounting_app.invoices SET client_id=?, issue_date=?, due_date=?, subtotal=?, tva_total=?, total=?, notes=? WHERE id=?`,
      [client_id, issue_date, due_date, subtotal, tva_total, total, notes, req.params.id]
    );

    // Delete old items
    await execQuery(`DELETE FROM accounting_app.invoice_items WHERE invoice_id = ?`, [req.params.id]);

    // Insert new items
    const createdItems = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const tvaRate = Number(item.tva_rate) || 0;
      const lineSubtotal = qty * price;
      const lineTva = lineSubtotal * (tvaRate / 100);
      const createdItem = await execQuery(
        `INSERT INTO accounting_app.invoice_items (invoice_id, product_id, description, quantity, unit_price, tva_rate, subtotal, tva_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, item.product_id, item.description, qty, price, tvaRate, lineSubtotal, lineTva]
      );
      createdItems.push(createdItem);
    }

    const [updated] = await query(`SELECT * FROM accounting_app.invoices WHERE id = ?`, [req.params.id]);
    res.json({ ...updated[0], items: createdItems });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /:id/status - Update status only
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Statut requis' });
    await execQuery(`UPDATE accounting_app.invoices SET status = ? WHERE id = ?`, [status, req.params.id]);
    const [rows] = await query(`SELECT * FROM accounting_app.invoices WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /:id - Soft delete
router.delete('/:id', async (req, res) => {
  try {
    await execQuery(`UPDATE accounting_app.invoices SET status = 'cancelled' WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /:id/payments - Add payment
router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, payment_date, method, reference, notes } = req.body;
    if (!amount) return res.status(400).json({ error: 'Montant requis' });

    const payment = await execQuery(
      `INSERT INTO accounting_app.payments (invoice_id, amount, payment_date, method, reference, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, amount, payment_date, method || 'cash', reference, notes]
    );

    // Update paid_amount
    const [sumRows] = await query(`SELECT COALESCE(SUM(amount), 0) AS total_paid FROM accounting_app.payments WHERE invoice_id = ?`, [req.params.id]);
    await execQuery(`UPDATE accounting_app.invoices SET paid_amount = ? WHERE id = ?`, [sumRows[0].total_paid, req.params.id]);

    res.json(payment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /:id/payments/:paymentId - Delete payment
router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    await execQuery(`DELETE FROM accounting_app.payments WHERE id = ? AND invoice_id = ?`, [req.params.paymentId, req.params.id]);

    // Update paid_amount
    const [sumRows] = await query(`SELECT COALESCE(SUM(amount), 0) AS total_paid FROM accounting_app.payments WHERE invoice_id = ?`, [req.params.id]);
    await execQuery(`UPDATE accounting_app.invoices SET paid_amount = ? WHERE id = ?`, [sumRows[0].total_paid, req.params.id]);

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
