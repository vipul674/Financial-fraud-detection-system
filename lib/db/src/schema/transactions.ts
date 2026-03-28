import { pgTable, serial, text, numeric, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  merchantName: text("merchant_name").notNull(),
  merchantCategory: text("merchant_category").notNull(),
  location: text("location").notNull(),
  ipAddress: text("ip_address"),
  deviceType: text("device_type"),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }).notNull().default("0"),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull().default("low"),
  status: text("status", { enum: ["pending", "approved", "flagged", "blocked"] }).notNull().default("pending"),
  flagReasons: jsonb("flag_reasons").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
