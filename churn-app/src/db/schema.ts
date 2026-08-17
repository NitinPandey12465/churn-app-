import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * fact table: one row per telco subscriber (IBM Telco Customer Churn shape).
 * Mirrors the normalized star schema from the original project
 * (dim_customers + dim_services + dim_contracts + fact_billing) flattened
 * into a single analytical table for fast web queries.
 */
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    customerId: text("customer_id").notNull().unique(),
    gender: text("gender").notNull(),
    seniorCitizen: boolean("senior_citizen").notNull().default(false),
    partner: boolean("partner").notNull().default(false),
    dependents: boolean("dependents").notNull().default(false),
    tenure: integer("tenure").notNull(),
    phoneService: boolean("phone_service").notNull().default(true),
    multipleLines: boolean("multiple_lines").notNull().default(false),
    internetService: text("internet_service").notNull(),
    onlineSecurity: boolean("online_security").notNull().default(false),
    onlineBackup: boolean("online_backup").notNull().default(false),
    deviceProtection: boolean("device_protection").notNull().default(false),
    techSupport: boolean("tech_support").notNull().default(false),
    streamingTv: boolean("streaming_tv").notNull().default(false),
    streamingMovies: boolean("streaming_movies").notNull().default(false),
    contract: text("contract").notNull(),
    paperlessBilling: boolean("paperless_billing").notNull().default(false),
    paymentMethod: text("payment_method").notNull(),
    monthlyCharges: real("monthly_charges").notNull(),
    totalCharges: real("total_charges").notNull(),
    churn: boolean("churn").notNull().default(false),
    riskScore: real("risk_score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("customers_contract_idx").on(table.contract),
    index("customers_risk_idx").on(table.riskScore),
    index("customers_tenure_idx").on(table.tenure),
  ],
);

/** every scoring request made through the live predictor UI */
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  probability: real("probability").notNull(),
  band: text("band").notNull(),
  revenueAtRisk: real("revenue_at_risk").notNull().default(0),
  features: jsonb("features").$type<Record<string, string | number | boolean>>().notNull(),
  drivers: jsonb("drivers").$type<{ label: string; value: number }[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** inbound messages from recruiters / HR / business stakeholders */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  persona: text("persona").notNull().default("recruiter"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
export type PredictionRow = typeof predictions.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
