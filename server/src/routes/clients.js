import { Router } from 'express';
import { query, execQuery } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM accounting_app.clients WHERE active = 1`;
    const params = [];
    if (search) { sql += ` AND (name ILIKE ? OR email ILIKE ? OR phone ILIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ` ORDER BY name`;
    const [rows] = await query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await query(`SELECT * FROM accounting_app.clients WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const [invoices] = await query(`SELECT * FROM accounting_app.invoices WHERE client_id = ? ORDER BY created_at DESC`, [req.params.id]);
    res.json({ ...rows[0], invoices });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, mobile, address, city, country, tva_number, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const client = await execQuery(`INSERT INTO accounting_app.clients (name, email, phone, mobile, address, city, country, tva_number, notes) VALUES (?,?,?,?,?,?,?,?,?)`, [name, email, phone, mobile, address, city, country || 'Mauritanie', tva_number, notes]);
    res.json(client);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, mobile, address, city, country, tva_number, notes } = req.body;
    const client = await execQuery(`UPDATE accounting_app.clients SET name=?, email=?, phone=?, mobile=?, address=?, city=?, country=?, tva_number=?, notes=? WHERE id=?`, [name, email, phone, mobile, address, city, country, tva_number, notes, req.params.id]);
    res.json(client);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execQuery(`UPDATE accounting_app.clients SET active = 0 WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
