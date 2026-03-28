import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { ListTransactionsQueryParams, GetTransactionParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res) => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { page, limit, riskLevel, status } = query.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (riskLevel) conditions.push(eq(transactionsTable.riskLevel, riskLevel));
  if (status) conditions.push(eq(transactionsTable.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count: total }]] = await Promise.all([
    db
      .select()
      .from(transactionsTable)
      .where(whereClause)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(transactionsTable).where(whereClause),
  ]);

  const totalNum = Number(total);
  res.json({
    transactions: rows.map(serializeTransaction),
    total: totalNum,
    page,
    limit,
    totalPages: Math.ceil(totalNum / limit),
  });
});

router.get("/transactions/:id", async (req, res) => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(serializeTransaction(row));
});

function serializeTransaction(row: typeof transactionsTable.$inferSelect) {
  return {
    ...row,
    amount: Number(row.amount),
    riskScore: Number(row.riskScore),
    createdAt: row.createdAt.toISOString(),
    flagReasons: Array.isArray(row.flagReasons) ? row.flagReasons : [],
  };
}

export default router;
