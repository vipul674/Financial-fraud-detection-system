import { Router, type IRouter } from "express";
import { db, alertsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  ListAlertsQueryParams,
  ReviewAlertParams,
  ReviewAlertBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res) => {
  const query = ListAlertsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { page, limit, status } = query.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(alertsTable.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count: total }]] = await Promise.all([
    db
      .select({
        alert: alertsTable,
        transaction: transactionsTable,
      })
      .from(alertsTable)
      .leftJoin(transactionsTable, eq(alertsTable.transactionId, transactionsTable.id))
      .where(whereClause)
      .orderBy(desc(alertsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(alertsTable).where(whereClause),
  ]);

  const totalNum = Number(total);
  res.json({
    alerts: rows.map(({ alert, transaction }) => serializeAlert(alert, transaction ?? undefined)),
    total: totalNum,
    page,
    limit,
    totalPages: Math.ceil(totalNum / limit),
  });
});

router.patch("/alerts/:id/review", async (req, res) => {
  const params = ReviewAlertParams.safeParse(req.params);
  const body = ReviewAlertBody.safeParse(req.body);

  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [existing] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const [updated] = await db
    .update(alertsTable)
    .set({
      status: body.data.status,
      reviewNote: body.data.reviewNote ?? null,
      reviewedBy: body.data.reviewedBy ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, updated.transactionId));

  res.json(serializeAlert(updated, transaction ?? undefined));
});

function serializeAlert(
  alert: typeof alertsTable.$inferSelect,
  transaction?: typeof transactionsTable.$inferSelect
) {
  return {
    ...alert,
    createdAt: alert.createdAt.toISOString(),
    reviewedAt: alert.reviewedAt?.toISOString() ?? null,
    transaction: transaction
      ? {
          ...transaction,
          amount: Number(transaction.amount),
          riskScore: Number(transaction.riskScore),
          createdAt: transaction.createdAt.toISOString(),
          flagReasons: Array.isArray(transaction.flagReasons)
            ? transaction.flagReasons
            : [],
        }
      : undefined,
  };
}

export default router;
