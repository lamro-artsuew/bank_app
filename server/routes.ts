import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertTransactionSchema, 
  insertAccountSchema, 
  insertBillSchema, 
  insertCardSchema, 
  insertLoanSchema, 
  insertNotificationSchema
} from "@shared/schema";

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes with /api prefix
  // All routes except /api/login and /api/register require authentication

  // ==================== Account Routes ====================
  // Get all accounts for the authenticated user
  app.get("/api/accounts", ensureAuthenticated, async (req, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.user.id);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // Get a specific account
  app.get("/api/accounts/:id", ensureAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Ensure the user owns this account
      if (account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  // Create a new account
  app.post("/api/accounts", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertAccountSchema.parse({ ...req.body, userId: req.user.id });
      const account = await storage.createAccount(data);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Update an account
  app.patch("/api/accounts/:id", ensureAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Ensure the user owns this account
      if (account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const data = insertAccountSchema.partial().parse(req.body);
      const updatedAccount = await storage.updateAccount(accountId, data);
      res.json(updatedAccount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  // Delete an account
  app.delete("/api/accounts/:id", ensureAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Ensure the user owns this account
      if (account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteAccount(accountId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // ==================== Transaction Routes ====================
  // Get transactions for the authenticated user
  app.get("/api/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Get transactions for a specific account
  app.get("/api/accounts/:id/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Ensure the user owns this account
      if (account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const transactions = await storage.getTransactionsByAccountId(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create a new transaction (deposit, withdrawal, transfer, payment)
  app.post("/api/transactions", ensureAuthenticated, async (req, res) => {
    try {
      // Validate transaction data with the account owner check
      const data = insertTransactionSchema.parse({ ...req.body, userId: req.user.id });
      
      // Check if the user owns the account
      const account = await storage.getAccount(data.accountId);
      if (!account || account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied to this account" });
      }
      
      // If it's a transfer, check if the recipient account exists
      if (data.transactionType === 'transfer' && data.recipientAccountId) {
        const recipientAccount = await storage.getAccount(data.recipientAccountId);
        if (!recipientAccount) {
          return res.status(404).json({ error: "Recipient account not found" });
        }
      }
      
      // Check if there are sufficient funds for withdrawals, transfers, and payments
      if (['withdrawal', 'transfer', 'payment'].includes(data.transactionType)) {
        const balance = parseFloat(account.balance.toString());
        const amount = parseFloat(data.amount.toString());
        
        if (balance < amount) {
          return res.status(400).json({ error: "Insufficient funds" });
        }
      }
      
      const transaction = await storage.createTransaction(data);
      
      // Create a notification for the transaction
      await storage.createNotification({
        userId: req.user.id,
        title: `${data.transactionType.charAt(0).toUpperCase() + data.transactionType.slice(1)} Completed`,
        message: `A ${data.transactionType} of ${data.amount} has been processed on your account.`,
        type: 'transaction'
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // ==================== Bill Routes ====================
  // Get all bills for the authenticated user
  app.get("/api/bills", ensureAuthenticated, async (req, res) => {
    try {
      const bills = await storage.getBillsByUserId(req.user.id);
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bills" });
    }
  });

  // Get a specific bill
  app.get("/api/bills/:id", ensureAuthenticated, async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const bill = await storage.getBill(billId);
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Ensure the user owns this bill
      if (bill.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(bill);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bill" });
    }
  });

  // Create a new bill
  app.post("/api/bills", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertBillSchema.parse({ ...req.body, userId: req.user.id });
      const bill = await storage.createBill(data);
      res.status(201).json(bill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create bill" });
    }
  });

  // Update a bill
  app.patch("/api/bills/:id", ensureAuthenticated, async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const bill = await storage.getBill(billId);
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Ensure the user owns this bill
      if (bill.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const data = insertBillSchema.partial().parse(req.body);
      const updatedBill = await storage.updateBill(billId, data);
      res.json(updatedBill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update bill" });
    }
  });

  // Delete a bill
  app.delete("/api/bills/:id", ensureAuthenticated, async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const bill = await storage.getBill(billId);
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Ensure the user owns this bill
      if (bill.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteBill(billId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bill" });
    }
  });

  // Pay a bill
  app.post("/api/bills/:id/pay", ensureAuthenticated, async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const { accountId } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }
      
      const bill = await storage.getBill(billId);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      // Ensure the user owns this bill
      if (bill.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied to this bill" });
      }
      
      // Check if the account exists and the user owns it
      const account = await storage.getAccount(parseInt(accountId));
      if (!account || account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied to this account" });
      }
      
      // Check if there are sufficient funds
      const balance = parseFloat(account.balance.toString());
      const amount = parseFloat(bill.amount.toString());
      
      if (balance < amount) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      
      // Create a payment transaction
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        accountId: parseInt(accountId),
        amount: bill.amount,
        description: `Payment for ${bill.payee}`,
        transactionType: 'payment',
        category: 'Bill Payment'
      });
      
      // Update the bill status
      const updatedBill = await storage.updateBill(billId, { status: 'paid' });
      
      // Create a notification
      await storage.createNotification({
        userId: req.user.id,
        title: `Bill Paid`,
        message: `Your payment of ${bill.amount} to ${bill.payee} has been processed.`,
        type: 'bill'
      });
      
      res.json({ transaction, bill: updatedBill });
    } catch (error) {
      res.status(500).json({ error: "Failed to pay bill" });
    }
  });

  // ==================== Card Routes ====================
  // Get all cards for the authenticated user
  app.get("/api/cards", ensureAuthenticated, async (req, res) => {
    try {
      const cards = await storage.getCardsByUserId(req.user.id);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  // Get cards for a specific account
  app.get("/api/accounts/:id/cards", ensureAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Ensure the user owns this account
      if (account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const cards = await storage.getCardsByAccountId(accountId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  // Create a new card
  app.post("/api/cards", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertCardSchema.parse({ ...req.body, userId: req.user.id });
      
      // Check if the account exists and the user owns it
      const account = await storage.getAccount(data.accountId);
      if (!account || account.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied to this account" });
      }
      
      const card = await storage.createCard(data);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  // Update a card
  app.patch("/api/cards/:id", ensureAuthenticated, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getCard(cardId);
      
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      
      // Ensure the user owns this card
      if (card.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const data = insertCardSchema.partial().parse(req.body);
      const updatedCard = await storage.updateCard(cardId, data);
      res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update card" });
    }
  });

  // ==================== Loan Routes ====================
  // Get all loans for the authenticated user
  app.get("/api/loans", ensureAuthenticated, async (req, res) => {
    try {
      const loans = await storage.getLoansByUserId(req.user.id);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loans" });
    }
  });

  // Get a specific loan
  app.get("/api/loans/:id", ensureAuthenticated, async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);
      const loan = await storage.getLoan(loanId);
      
      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }
      
      // Ensure the user owns this loan
      if (loan.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(loan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loan" });
    }
  });

  // Apply for a new loan
  app.post("/api/loans", ensureAuthenticated, async (req, res) => {
    try {
      const data = insertLoanSchema.parse({ ...req.body, userId: req.user.id });
      const loan = await storage.createLoan(data);
      
      // Create a notification for the loan application
      await storage.createNotification({
        userId: req.user.id,
        title: "Loan Application Submitted",
        message: `Your application for a ${data.loanType} loan of ${data.amount} has been submitted for review.`,
        type: 'system'
      });
      
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create loan" });
    }
  });

  // ==================== Notification Routes ====================
  // Get all notifications for the authenticated user
  app.get("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark a notification as read
  app.patch("/api/notifications/:id/read", ensureAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      // Ensure the notification belongs to the user
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ==================== User Profile Routes ====================
  // Update user profile
  app.patch("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      // Do not allow password updates through this endpoint
      const { password, ...data } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, data);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send the password back to the client
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
