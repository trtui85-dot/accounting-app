import { Router } from 'express';
import { query, execQuery } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM accounting_app.products WHERE active = 1`;
    const params = [];
    if (search) { sql += ` AND (name ILIKE ? OR description ILIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    sql += ` ORDER BY name`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await query(`SELECT * FROM accounting_app.products WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, unit_price, tva_rate, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const product = await execQuery(`INSERT INTO accounting_app.products (name, description, unit_price, tva_rate, unit) VALUES (?,?,?,?,?)`, [name, description, unit_price || 0, tva_rate || 0, unit || 'unité']);
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, unit_price, tva_rate, unit } = req.body;
    const product = await execQuery(`UPDATE accounting_app.products SET name=?, description=?, unit_price=?, tva_rate=?, unit=? WHERE id=?`, [name, description, unit_price, tva_rate, unit, req.params.id]);
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execQuery(`UPDATE accounting_app.products SET active = 0 WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
