import { Router } from 'express';
import { query, execQuery } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await query(`SELECT * FROM accounting_app.settings LIMIT 1`);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/', async (req, res) => {
  try {
    const { company_name, company_address, company_phone, company_email, company_tva, currency, currency_symbol, invoice_prefix } = req.body;
    await execQuery(`UPDATE accounting_app.settings SET company_name=?, company_address=?, company_phone=?, company_email=?, company_tva=?, currency=?, currency_symbol=?, invoice_prefix=? WHERE id = (SELECT id FROM accounting_app.settings LIMIT 1)`,
      [company_name, company_address, company_phone, company_email, company_tva, currency, currency_symbol, invoice_prefix]);
    const [rows] = await query(`SELECT * FROM accounting_app.settings LIMIT 1`);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
