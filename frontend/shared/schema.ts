import { pgTable, text, serial, integer, boolean, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  profileImage: true,
});

// Account model
export const accountTypeEnum = pgEnum('account_type', ['checking', 'savings', 'investment', 'credit']);

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountType: accountTypeEnum("account_type").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  cardType: text("card_type"),
  validThru: text("valid_thru"),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  userId: true,
  accountType: true,
  accountNumber: true,
  accountName: true,
  balance: true,
  cardType: true,
  validThru: true,
});

// Transaction model
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'transfer', 'payment']);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  recipientAccountId: integer("recipient_account_id"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  accountId: true,
  amount: true,
  description: true,
  transactionType: true,
  category: true,
  recipientAccountId: true,
});

// Bill model
export const billStatusEnum = pgEnum('bill_status', ['pending', 'paid', 'overdue']);

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  payee: text("payee").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: billStatusEnum("status").notNull().default("pending"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: text("recurring_interval"),
});

export const insertBillSchema = createInsertSchema(bills).pick({
  userId: true,
  payee: true,
  amount: true,
  dueDate: true,
  status: true,
  isRecurring: true,
  recurringInterval: true,
});

// Card model
export const cardTypeEnum = pgEnum('card_type', ['debit', 'credit']);
export const cardStatusEnum = pgEnum('card_status', ['active', 'inactive', 'blocked']);

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  cardNumber: text("card_number").notNull(),
  cardType: cardTypeEnum("card_type").notNull(),
  cardNetwork: text("card_network").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  status: cardStatusEnum("status").notNull().default("active"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
});

export const insertCardSchema = createInsertSchema(cards).pick({
  userId: true,
  accountId: true,
  cardNumber: true,
  cardType: true,
  cardNetwork: true,
  expiryDate: true,
  cvv: true,
  creditLimit: true,
});

// Loan model
export const loanStatusEnum = pgEnum('loan_status', ['pending', 'approved', 'rejected', 'active', 'closed']);

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  loanType: text("loan_type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  term: integer("term").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: loanStatusEnum("status").notNull().default("pending"),
  monthlyPayment: numeric("monthly_payment", { precision: 12, scale: 2 }),
});

export const insertLoanSchema = createInsertSchema(loans).pick({
  userId: true,
  loanType: true,
  amount: true,
  interestRate: true,
  term: true,
  startDate: true,
  endDate: true,
  monthlyPayment: true,
});

// Notification model
export const notificationTypeEnum = pgEnum('notification_type', ['transaction', 'bill', 'security', 'system']);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
});

// Types export
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
