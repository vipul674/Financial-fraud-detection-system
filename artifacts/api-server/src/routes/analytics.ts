import { Router, type IRouter } from "express";
import { db, transactionsTable, alertsTable } from "@workspace/db";
import { eq, count, sum, gte, sql } from "drizzle-orm";
import { GetFraudTrendsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res) => {
  const [totalTx] = await db.select({ count: count() }).from(transactionsTable);
  const [flaggedTx] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "flagged"));
  const [blockedTx] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "blocked"));
  const [openAlerts] = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(eq(alertsTable.status, "open"));
  const [amountFlagged] = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(sql`${transactionsTable.status} IN ('flagged', 'blocked')`);

  const [lowCount] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.riskLevel, "low"));
  const [mediumCount] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.riskLevel, "medium"));
  const [highCount] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.riskLevel, "high"));
  const [criticalCount] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.riskLevel, "critical"));

  const total = Number(totalTx.count);
  const flagged = Number(flaggedTx.count);
  const blocked = Number(blockedTx.count);
  const fraudRate = total > 0 ? ((flagged + blocked) / total) * 100 : 0;

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 7);
  const [recentAlerts] = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(gte(alertsTable.createdAt, recentCutoff));

  res.json({
    totalTransactions: total,
    flaggedTransactions: flagged,
    blockedTransactions: blocked,
    totalAlertsOpen: Number(openAlerts.count),
    fraudRate: Math.round(fraudRate * 100) / 100,
    totalAmountFlagged: Number(amountFlagged.total ?? 0),
    riskDistribution: {
      low: Number(lowCount.count),
      medium: Number(mediumCount.count),
      high: Number(highCount.count),
      critical: Number(criticalCount.count),
    },
    recentAlertCount: Number(recentAlerts.count),
  });
});

router.get("/analytics/trends", async (req, res) => {
  const query = GetFraudTrendsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const days = query.data.days ?? 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${transactionsTable.createdAt})::text`,
      totalTransactions: count(),
      flaggedCount: sql<number>`COUNT(CASE WHEN ${transactionsTable.status} = 'flagged' THEN 1 END)`,
      blockedCount: sql<number>`COUNT(CASE WHEN ${transactionsTable.status} = 'blocked' THEN 1 END)`,
    })
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, cutoff))
    .groupBy(sql`DATE(${transactionsTable.createdAt})`)
    .orderBy(sql`DATE(${transactionsTable.createdAt})`);

  const result = rows.map((r) => {
    const total = Number(r.totalTransactions);
    const flagged = Number(r.flaggedCount);
    const blocked = Number(r.blockedCount);
    return {
      date: r.date,
      totalTransactions: total,
      flaggedCount: flagged,
      blockedCount: blocked,
      fraudRate: total > 0 ? Math.round(((flagged + blocked) / total) * 10000) / 100 : 0,
    };
  });

  res.json(result);
});

export default router;
