import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, ArrowUpIcon } from "lucide-react";
import AccountCard from "@/components/account-card";
import TransactionItem from "@/components/transaction-item";
import StatCard from "@/components/stat-card";
import QuickAction from "@/components/quick-action";
import ExpenseChart from "@/components/expense-chart";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TransferMoney from "@/components/modals/transfer-money";
import PayBill from "@/components/modals/pay-bill";
import { apiRequest } from "@/lib/queryClient";
import { Account, Transaction } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const closeDialog = () => setActiveDialog(null);

  // Fetch accounts
  const { 
    data: accounts = [], 
    isLoading: isLoadingAccounts 
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Calculate totals when data is loaded
  useEffect(() => {
    if (accounts.length > 0) {
      // Calculate total balance across all accounts
      const balance = accounts.reduce(
        (total, account) => total + parseFloat(account.balance.toString()), 0
      );
      setTotalBalance(balance);
    }

    if (transactions.length > 0) {
      // Calculate income (deposits)
      const income = transactions
        .filter(t => t.transactionType === 'deposit')
        .reduce((total, t) => total + parseFloat(t.amount.toString()), 0);
      setTotalIncome(income);

      // Calculate expenses (withdrawals, payments)
      const expenses = transactions
        .filter(t => t.transactionType === 'withdrawal' || t.transactionType === 'payment')
        .reduce((total, t) => total + parseFloat(t.amount.toString()), 0);
      setTotalExpenses(expenses);
    }
  }, [accounts, transactions]);

  // Calculate expense categories for the chart
  const expenseByCategory = transactions
    .filter(t => t.transactionType === 'withdrawal' || t.transactionType === 'payment')
    .reduce((categories: Record<string, number>, t) => {
      const category = t.category || 'Other';
      categories[category] = (categories[category] || 0) + parseFloat(t.amount.toString());
      return categories;
    }, {});

  // Function to calculate the percentage for each category
  const calculateCategoryPercentages = () => {
    const total = Object.values(expenseByCategory).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
    }));
  };

  // Format current date
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-primary to-primary-500 rounded-2xl shadow-md">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-semibold mb-2">
                {getGreeting()}, {user?.firstName}!
              </h2>
              <p className="text-primary-100 text-sm">{currentDate}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={activeDialog === 'transfer'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogTrigger asChild>
                  <Button variant="secondary" onClick={() => setActiveDialog('transfer')}>
                    <PlusIcon className="h-4 w-4 mr-1" /> New Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <TransferMoney accounts={accounts} onClose={closeDialog} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard 
          title="Total Balance" 
          value={totalBalance} 
          change={2.3} 
          isPositive={true} 
          icon="wallet"
        />
        <StatCard 
          title="Income" 
          value={totalIncome} 
          change={4.6} 
          isPositive={true} 
          icon="income"
        />
        <StatCard 
          title="Expenses" 
          value={totalExpenses} 
          change={1.8} 
          isPositive={false} 
          icon="expense"
        />
      </div>

      {/* Account Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-neutral-800">Your Accounts</h2>
          <Button variant="link" className="text-primary">View All</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoadingAccounts ? (
            // Skeletons while loading
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-44 bg-neutral-100 animate-pulse rounded-2xl"></div>
            ))
          ) : accounts.length > 0 ? (
            // Display account cards
            accounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))
          ) : (
            // No accounts state
            <div className="col-span-full text-center py-10 bg-neutral-50 rounded-xl">
              <p className="text-neutral-600 mb-4">You don't have any accounts yet</p>
              <Button>Open a New Account</Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-800 mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Dialog open={activeDialog === 'transfer-action'} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <div onClick={() => setActiveDialog('transfer-action')}>
                <QuickAction icon="transfer" title="Transfer" />
              </div>
            </DialogTrigger>
            <DialogContent>
              <TransferMoney accounts={accounts} onClose={closeDialog} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={activeDialog === 'pay-bill'} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <div onClick={() => setActiveDialog('pay-bill')}>
                <QuickAction icon="bill" title="Pay Bills" />
              </div>
            </DialogTrigger>
            <DialogContent>
              <PayBill accounts={accounts} onClose={closeDialog} />
            </DialogContent>
          </Dialog>
          
          <QuickAction icon="card" title="Cards" link="/cards" />
          <QuickAction icon="support" title="Support" />
        </div>
      </div>

      {/* Two Column Layout for Recent Transactions and Expense Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-neutral-800">Recent Transactions</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs">All</Button>
                  <Button variant="ghost" size="sm" className="text-xs">Income</Button>
                  <Button variant="ghost" size="sm" className="text-xs">Expense</Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {isLoadingTransactions ? (
                  // Skeletons while loading
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-100">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 animate-pulse mr-3"></div>
                        <div>
                          <div className="h-4 w-32 bg-neutral-100 animate-pulse mb-2 rounded"></div>
                          <div className="h-3 w-24 bg-neutral-100 animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-20 bg-neutral-100 animate-pulse mb-2 rounded"></div>
                        <div className="h-3 w-16 bg-neutral-100 animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))
                ) : transactions.length > 0 ? (
                  // Display transaction items
                  transactions.slice(0, 5).map(transaction => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))
                ) : (
                  // No transactions state
                  <div className="text-center py-6">
                    <p className="text-neutral-600">No transactions yet</p>
                  </div>
                )}
              </div>
              
              <div className="mt-5 text-center">
                <Button variant="link" className="text-primary font-medium">
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Expense Analytics */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-neutral-800">Expense Analytics</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </Button>
              </div>
              
              {/* Chart */}
              <ExpenseChart categories={calculateCategoryPercentages()} />
              
              <div className="mt-5">
                <Button className="w-full bg-primary-50 hover:bg-primary-100 text-primary">
                  View Detailed Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
