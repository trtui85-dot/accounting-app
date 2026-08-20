import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [totalRevenue] = await query(`SELECT COALESCE(SUM(total), 0) as value FROM accounting_app.invoices WHERE status != 'cancelled'`);
    const [paidRevenue] = await query(`SELECT COALESCE(SUM(paid_amount), 0) as value FROM accounting_app.invoices WHERE status != 'cancelled'`);
    const [pendingAmount] = await query(`SELECT COALESCE(SUM(total - paid_amount), 0) as value FROM accounting_app.invoices WHERE status IN ('sent', 'overdue')`);
    const [overdueAmount] = await query(`SELECT COALESCE(SUM(total - paid_amount), 0) as value FROM accounting_app.invoices WHERE status = 'overdue'`);
    const [totalClients] = await query(`SELECT COUNT(*) as value FROM accounting_app.clients WHERE active = 1`);
    const [totalInvoices] = await query(`SELECT COUNT(*) as value FROM accounting_app.invoices WHERE status != 'cancelled'`);
    const [paidCount] = await query(`SELECT COUNT(*) as value FROM accounting_app.invoices WHERE status = 'paid'`);
    const [recentInvoices] = await query(`
      SELECT i.*, c.name as client_name
      FROM accounting_app.invoices i
      LEFT JOIN accounting_app.clients c ON c.id = i.client_id
      WHERE i.status != 'cancelled'
      ORDER BY i.created_at DESC LIMIT 5
    `);
    const [monthlyStats] = await query(`
      SELECT TO_CHAR(issue_date, 'YYYY-MM') as month,
        SUM(total) as revenue, SUM(paid_amount) as paid
      FROM accounting_app.invoices
      WHERE status != 'cancelled' AND issue_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY 1 ORDER BY 1
    `);
    res.json({
      totalRevenue: totalRevenue.value,
      paidRevenue: paidRevenue.value,
      pendingAmount: pendingAmount.value,
      overdueAmount: overdueAmount.value,
      totalClients: totalClients.value,
      totalInvoices: totalInvoices.value,
      paidCount: paidCount.value,
      recentInvoices,
      monthlyStats,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
