import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, execQuery } from '../db.js';
import { generateToken, authMiddleware } from '../auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) return res.status(400).json({ error: 'Phone + PIN required' });

    const [users] = await query(`SELECT * FROM accounting_app.users WHERE phone = ? AND active = 1`, [phone]);
    if (users.length === 0) return res.status(401).json({ error: 'Utilisateur introuvable' });

    const user = users[0];
    const valid = await bcrypt.compare(pin, user.pin_hash);
    if (!valid) return res.status(401).json({ error: 'PIN incorrect' });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar_color: user.avatar_color, permissions: user.permissions } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await query(`SELECT id, name, phone, role, avatar_color, permissions FROM accounting_app.users WHERE id = ?`, [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(users[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
