import {
  User, InsertUser, Account, InsertAccount, Transaction, InsertTransaction,
  Bill, InsertBill, Card, InsertCard, Loan, InsertLoan, Notification, InsertNotification
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Memory store for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Account operations
  getAccount(id: number): Promise<Account | undefined>;
  getAccountsByUserId(userId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getTransactionsByAccountId(accountId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Bill operations
  getBill(id: number): Promise<Bill | undefined>;
  getBillsByUserId(userId: number): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: number, bill: Partial<InsertBill>): Promise<Bill | undefined>;
  deleteBill(id: number): Promise<boolean>;
  
  // Card operations
  getCard(id: number): Promise<Card | undefined>;
  getCardsByUserId(userId: number): Promise<Card[]>;
  getCardsByAccountId(accountId: number): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, card: Partial<InsertCard>): Promise<Card | undefined>;
  deleteCard(id: number): Promise<boolean>;
  
  // Loan operations
  getLoan(id: number): Promise<Loan | undefined>;
  getLoansByUserId(userId: number): Promise<Loan[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private bills: Map<number, Bill>;
  private cards: Map<number, Card>;
  private loans: Map<number, Loan>;
  private notifications: Map<number, Notification>;
  
  sessionStore: session.SessionStore;
  
  private userId: number = 1;
  private accountId: number = 1;
  private transactionId: number = 1;
  private billId: number = 1;
  private cardId: number = 1;
  private loanId: number = 1;
  private notificationId: number = 1;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.bills = new Map();
    this.cards = new Map();
    this.loans = new Map();
    this.notifications = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // One day
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Account operations
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId,
    );
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const newAccount: Account = { ...account, id, isActive: true };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const existingAccount = this.accounts.get(id);
    if (!existingAccount) return undefined;
    
    const updatedAccount = { ...existingAccount, ...account };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => {
        // Sort by date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.accountId === accountId)
      .sort((a, b) => {
        // Sort by date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const now = new Date();
    const newTransaction: Transaction = { 
      ...transaction, 
      id, 
      createdAt: now 
    };
    this.transactions.set(id, newTransaction);
    
    // Update account balance
    if (transaction.accountId) {
      const account = await this.getAccount(transaction.accountId);
      if (account) {
        let newBalance = parseFloat(account.balance.toString());
        
        if (transaction.transactionType === 'deposit') {
          newBalance += parseFloat(transaction.amount.toString());
        } else if (transaction.transactionType === 'withdrawal' || transaction.transactionType === 'payment') {
          newBalance -= parseFloat(transaction.amount.toString());
        } else if (transaction.transactionType === 'transfer' && transaction.recipientAccountId) {
          // Deduct from sender account
          newBalance -= parseFloat(transaction.amount.toString());
          
          // Add to recipient account
          const recipientAccount = await this.getAccount(transaction.recipientAccountId);
          if (recipientAccount) {
            const recipientBalance = parseFloat(recipientAccount.balance.toString()) + 
                                   parseFloat(transaction.amount.toString());
            await this.updateAccount(transaction.recipientAccountId, { 
              balance: recipientBalance as any 
            });
          }
        }
        
        await this.updateAccount(transaction.accountId, { 
          balance: newBalance as any 
        });
      }
    }
    
    return newTransaction;
  }

  // Bill operations
  async getBill(id: number): Promise<Bill | undefined> {
    return this.bills.get(id);
  }

  async getBillsByUserId(userId: number): Promise<Bill[]> {
    return Array.from(this.bills.values())
      .filter((bill) => bill.userId === userId)
      .sort((a, b) => {
        // Sort by due date ascending
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const id = this.billId++;
    const newBill: Bill = { ...bill, id };
    this.bills.set(id, newBill);
    return newBill;
  }

  async updateBill(id: number, bill: Partial<InsertBill>): Promise<Bill | undefined> {
    const existingBill = this.bills.get(id);
    if (!existingBill) return undefined;
    
    const updatedBill = { ...existingBill, ...bill };
    this.bills.set(id, updatedBill);
    return updatedBill;
  }

  async deleteBill(id: number): Promise<boolean> {
    return this.bills.delete(id);
  }

  // Card operations
  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getCardsByUserId(userId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.userId === userId,
    );
  }

  async getCardsByAccountId(accountId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.accountId === accountId,
    );
  }

  async createCard(card: InsertCard): Promise<Card> {
    const id = this.cardId++;
    const newCard: Card = { ...card, id, status: "active" };
    this.cards.set(id, newCard);
    return newCard;
  }

  async updateCard(id: number, card: Partial<InsertCard>): Promise<Card | undefined> {
    const existingCard = this.cards.get(id);
    if (!existingCard) return undefined;
    
    const updatedCard = { ...existingCard, ...card };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteCard(id: number): Promise<boolean> {
    return this.cards.delete(id);
  }

  // Loan operations
  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }

  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.userId === userId,
    );
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const id = this.loanId++;
    const newLoan: Loan = { ...loan, id, status: "pending" };
    this.loans.set(id, newLoan);
    return newLoan;
  }

  async updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined> {
    const existingLoan = this.loans.get(id);
    if (!existingLoan) return undefined;
    
    const updatedLoan = { ...existingLoan, ...loan };
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => {
        // Sort by date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const now = new Date();
    const newNotification: Notification = { 
      ...notification, 
      id, 
      isRead: false, 
      createdAt: now 
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    return notification;
  }
}

export const storage = new MemStorage();
