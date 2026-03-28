import { db, transactionsTable, alertsTable } from "@workspace/db";

const merchants = [
  { name: "Amazon", category: "E-commerce" },
  { name: "Walmart", category: "Retail" },
  { name: "Shell Gas Station", category: "Fuel" },
  { name: "Netflix", category: "Subscription" },
  { name: "Marriott Hotels", category: "Travel" },
  { name: "Delta Airlines", category: "Travel" },
  { name: "Whole Foods", category: "Grocery" },
  { name: "Best Buy", category: "Electronics" },
  { name: "Casino Royale", category: "Gambling" },
  { name: "CryptoExchange Pro", category: "Cryptocurrency" },
  { name: "Wire Transfer Service", category: "Financial" },
  { name: "Luxury Watches NYC", category: "Jewelry" },
  { name: "ATM Withdrawal", category: "ATM" },
  { name: "PayPal Transfer", category: "Payment" },
  { name: "Offshore Bank Ltd", category: "Financial" },
];

const users = [
  { id: "USR-001", name: "Alice Johnson" },
  { id: "USR-002", name: "Bob Martinez" },
  { id: "USR-003", name: "Carol Smith" },
  { id: "USR-004", name: "David Lee" },
  { id: "USR-005", name: "Emma Wilson" },
  { id: "USR-006", name: "Frank Chen" },
  { id: "USR-007", name: "Grace Kim" },
  { id: "USR-008", name: "Henry Brown" },
];

const locations = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Lagos, Nigeria",
  "Moscow, Russia",
  "Unknown Location",
  "Cayman Islands",
  "Singapore",
];

const devices = ["Mobile", "Desktop", "Tablet", "Unknown"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function computeRiskScore(
  amount: number,
  merchant: { name: string; category: string },
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

  const riskCategories = ["Gambling", "Cryptocurrency", "Financial"];
  if (riskCategories.includes(merchant.category)) {
    score += 25;
    reasons.push(`High-risk merchant category: ${merchant.category}`);
  }

  const suspiciousLocations = ["Lagos, Nigeria", "Moscow, Russia", "Unknown Location", "Cayman Islands"];
  if (suspiciousLocations.includes(location)) {
    score += 35;
    reasons.push("Transaction from high-risk geographic location");
  }

  if (deviceType === "Unknown") {
    score += 15;
    reasons.push("Unknown device used for transaction");
  }

  if (merchant.name.includes("Wire Transfer") || merchant.name.includes("Offshore")) {
    score += 20;
    reasons.push("Suspicious merchant name");
  }

  score += Math.random() * 10;
  return { score: Math.min(100, score), reasons };
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getStatus(riskLevel: string): "pending" | "approved" | "flagged" | "blocked" {
  if (riskLevel === "critical") return Math.random() > 0.3 ? "blocked" : "flagged";
  if (riskLevel === "high") return Math.random() > 0.5 ? "flagged" : "pending";
  if (riskLevel === "medium") return Math.random() > 0.8 ? "flagged" : "approved";
  return Math.random() > 0.05 ? "approved" : "pending";
}

async function seed() {
  console.log("Seeding transactions...");

  const transactions: (typeof transactionsTable.$inferInsert)[] = [];

  for (let i = 0; i < 150; i++) {
    const merchant = randomChoice(merchants);
    const user = randomChoice(users);
    const location = randomChoice(locations);
    const deviceType = randomChoice(devices);
    const amount = Math.round(randomBetween(5, 15000) * 100) / 100;
    const { score, reasons } = computeRiskScore(amount, merchant, location, deviceType);
    const riskLevel = getRiskLevel(score);
    const status = getStatus(riskLevel);

    const daysAgo = Math.floor(Math.random() * 45);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(Math.floor(Math.random() * 24));
    createdAt.setMinutes(Math.floor(Math.random() * 60));

    transactions.push({
      transactionId: `TXN-${String(i + 1).padStart(6, "0")}`,
      userId: user.id,
      userName: user.name,
      amount: String(amount),
      currency: "USD",
      merchantName: merchant.name,
      merchantCategory: merchant.category,
      location,
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      deviceType,
      riskScore: String(Math.round(score * 100) / 100),
      riskLevel,
      status,
      flagReasons: reasons,
      createdAt,
    });
  }

  const inserted = await db.insert(transactionsTable).values(transactions).returning();
  console.log(`Inserted ${inserted.length} transactions`);

  const alertTypes = [
    "Velocity Check",
    "Geographic Anomaly",
    "High-Risk Merchant",
    "Large Amount",
    "Device Fingerprint Mismatch",
    "Unusual Spending Pattern",
    "Known Fraud Network",
  ];

  const flaggedTxs = inserted.filter((t) => t.status === "flagged" || t.status === "blocked");
  const alerts: (typeof alertsTable.$inferInsert)[] = [];

  for (const tx of flaggedTxs) {
    const alertType = randomChoice(alertTypes);
    const severity = tx.riskLevel as "low" | "medium" | "high" | "critical";
    const statusRoll = Math.random();
    const alertStatus =
      statusRoll > 0.6
        ? "open"
        : statusRoll > 0.4
        ? "reviewed"
        : statusRoll > 0.2
        ? "dismissed"
        : "escalated";

    const alertCreatedAt = new Date(tx.createdAt);
    alertCreatedAt.setMinutes(alertCreatedAt.getMinutes() + Math.floor(Math.random() * 30));

    alerts.push({
      alertType,
      severity,
      status: alertStatus as "open" | "reviewed" | "dismissed" | "escalated",
      transactionId: tx.id,
      description: `${alertType} triggered for transaction ${tx.transactionId}. ${(tx.flagReasons as string[]).join(". ")}.`,
      reviewNote: alertStatus !== "open" ? "Reviewed by security team" : null,
      reviewedBy: alertStatus !== "open" ? "analyst@fraudguard.io" : null,
      reviewedAt: alertStatus !== "open" ? new Date() : null,
      createdAt: alertCreatedAt,
    });
  }

  if (alerts.length > 0) {
    const insertedAlerts = await db.insert(alertsTable).values(alerts).returning();
    console.log(`Inserted ${insertedAlerts.length} alerts`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
