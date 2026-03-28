import { Router, type IRouter } from "express";
import { db, transactionsTable, alertsTable } from "@workspace/db";
import { SimulateTransactionBody } from "@workspace/api-zod";

const router: IRouter = Router();

const RISK_CATEGORIES = ["Gambling", "Cryptocurrency", "Financial"];
const SUSPICIOUS_LOCATIONS = ["Lagos, Nigeria", "Moscow, Russia", "Unknown Location", "Cayman Islands"];
const SUSPICIOUS_MERCHANTS = ["Wire Transfer", "Offshore", "Cash Advance", "Pawn"];

const ALERT_TYPES_BY_REASON: Record<string, string> = {
  "High transaction amount": "Large Amount",
  "Above-average transaction amount": "Velocity Check",
  "High-risk merchant category": "High-Risk Merchant",
  "Transaction from high-risk geographic location": "Geographic Anomaly",
  "Unknown device used for transaction": "Device Fingerprint Mismatch",
  "Suspicious merchant name": "Known Fraud Network",
};

function computeRisk(
  amount: number,
  merchantName: string,
  merchantCategory: string,
  location: string,
  deviceType: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (amount > 5000) {
    score += 30;
    reasons.push("High transaction amount");
  } else if (amount > 2000) {
    score += 15;
    reasons.push("Above-average transaction amount");
  }

  if (RISK_CATEGORIES.includes(merchantCategory)) {
    score += 25;
    reasons.push(`High-risk merchant category: ${merchantCategory}`);
  }

  if (SUSPICIOUS_LOCATIONS.includes(location)) {
    score += 35;
    reasons.push("Transaction from high-risk geographic location");
  }

  if (deviceType === "Unknown") {
    score += 15;
    reasons.push("Unknown device used for transaction");
  }

  if (SUSPICIOUS_MERCHANTS.some((s) => merchantName.includes(s))) {
    score += 20;
    reasons.push("Suspicious merchant name");
  }

  return { score: Math.min(100, Math.round(score * 100) / 100), reasons };
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getStatus(riskLevel: string): "pending" | "approved" | "flagged" | "blocked" {
  if (riskLevel === "critical") return "blocked";
  if (riskLevel === "high") return "flagged";
  if (riskLevel === "medium") return "flagged";
  return "approved";
}

function buildExplanation(
  riskLevel: string,
  score: number,
  reasons: string[],
  status: string
): string {
  const verdict =
    status === "blocked"
      ? "BLOCKED — this transaction would be stopped automatically."
      : status === "flagged"
      ? "FLAGGED — this transaction has been queued for manual review."
      : "APPROVED — this transaction passed all fraud checks.";

  if (reasons.length === 0) {
    return `Risk score: ${score}/100 (${riskLevel.toUpperCase()}). ${verdict} No suspicious signals detected.`;
  }

  return `Risk score: ${score}/100 (${riskLevel.toUpperCase()}). ${verdict} Triggered by: ${reasons.join("; ")}.`;
}

router.post("/transactions/simulate", async (req, res) => {
  const body = SimulateTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
    return;
  }

  const {
    amount,
    merchantName,
    merchantCategory,
    location,
    deviceType,
    userName = "Demo User",
  } = body.data;

  const { score, reasons } = computeRisk(amount, merchantName, merchantCategory, location, deviceType);
  const riskLevel = getRiskLevel(score);
  const status = getStatus(riskLevel);

  const txCount = await db.$count(transactionsTable);
  const txId = `DEMO-${String(txCount + 1).padStart(6, "0")}`;

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      transactionId: txId,
      userId: "DEMO-USR",
      userName,
      amount: String(amount),
      currency: "USD",
      merchantName,
      merchantCategory,
      location,
      ipAddress: "203.0.113.42",
      deviceType,
      riskScore: String(score),
      riskLevel,
      status,
      flagReasons: reasons,
    })
    .returning();

  let alertCreated = false;
  if (status === "flagged" || status === "blocked") {
    const primaryReason = reasons[0] ?? "Suspicious Activity";
    const alertType = ALERT_TYPES_BY_REASON[primaryReason] ?? "Suspicious Activity";

    await db.insert(alertsTable).values({
      alertType,
      severity: riskLevel as "low" | "medium" | "high" | "critical",
      status: "open",
      transactionId: tx.id,
      description: `[DEMO] ${alertType} triggered for ${txId}. ${reasons.join(". ")}.`,
    });
    alertCreated = true;
  }

  const explanation = buildExplanation(riskLevel, score, reasons, status);

  res.status(201).json({
    transaction: {
      ...tx,
      amount: Number(tx.amount),
      riskScore: Number(tx.riskScore),
      createdAt: tx.createdAt.toISOString(),
      flagReasons: Array.isArray(tx.flagReasons) ? tx.flagReasons : [],
    },
    alertCreated,
    explanation,
  });
});

export default router;
