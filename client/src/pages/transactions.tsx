import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Transaction, Account } from "@shared/schema";
import { LineChartComponent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TransferMoney from "@/components/modals/transfer-money";
import { ArrowDownIcon, ArrowUpIcon, FilterIcon, PlusIcon, SearchIcon } from "lucide-react";

export default function Transactions() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const closeDialog = () => setActiveDialog(null);

  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Fetch accounts (for the transfer dialog)
  const { 
    data: accounts = [], 
    isLoading: isLoadingAccounts 
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    const searchMatch = searchTerm === "" || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const typeMatch = typeFilter === "all" || transaction.transactionType === typeFilter;
    
    // Date filter
    let dateMatch = true;
    if (dateFilter !== "all") {
      const today = new Date();
      const transactionDate = new Date(transaction.createdAt);
      
      if (dateFilter === "today") {
        dateMatch = 
          transactionDate.getDate() === today.getDate() &&
          transactionDate.getMonth() === today.getMonth() &&
          transactionDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        dateMatch = transactionDate >= oneWeekAgo;
      } else if (dateFilter === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        dateMatch = transactionDate >= oneMonthAgo;
      }
    }
    
    return searchMatch && typeMatch && dateMatch;
  });

  // Prepare data for line chart
  const getChartData = () => {
    // Group transactions by day
    const transactionsByDay: Record<string, { deposits: number; withdrawals: number }> = {};
    
    // Get the last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = format(date, "yyyy-MM-dd");
      dates.push(formattedDate);
      transactionsByDay[formattedDate] = { deposits: 0, withdrawals: 0 };
    }
    
    // Sum transactions by day
    transactions.forEach(transaction => {
      const date = format(new Date(transaction.createdAt), "yyyy-MM-dd");
      if (transactionsByDay[date]) {
        if (transaction.transactionType === "deposit") {
          transactionsByDay[date].deposits += Number(transaction.amount);
        } else if (["withdrawal", "payment"].includes(transaction.transactionType)) {
          transactionsByDay[date].withdrawals += Number(transaction.amount);
        }
      }
    });
    
    // Format data for chart
    return dates.map(date => ({
      name: format(new Date(date), "MMM dd"),
      deposits: transactionsByDay[date].deposits,
      withdrawals: transactionsByDay[date].withdrawals,
    }));
  };

  // Calculate totals
  const totalDeposits = transactions
    .filter(t => t.transactionType === "deposit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalWithdrawals = transactions
    .filter(t => ["withdrawal", "payment"].includes(t.transactionType))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Get transaction type display name and badge color
  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case "deposit":
        return { name: "Deposit", badgeClass: "bg-success-light text-success" };
      case "withdrawal":
        return { name: "Withdrawal", badgeClass: "bg-danger-light text-danger" };
      case "transfer":
        return { name: "Transfer", badgeClass: "bg-primary-50 text-primary" };
      case "payment":
        return { name: "Payment", badgeClass: "bg-warning-light text-warning" };
      default:
        return { name: type, badgeClass: "bg-neutral-100 text-neutral-600" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-neutral-800">Transactions</h1>
        
        <Dialog open={activeDialog === 'new-transaction'} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setActiveDialog('new-transaction')}>
              <PlusIcon className="h-4 w-4 mr-2" /> New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <TransferMoney accounts={accounts} onClose={closeDialog} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Transaction overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">All Transactions</p>
                <p className="text-2xl font-bold mt-1">{transactions.length}</p>
              </div>
              <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center">
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
                  className="text-neutral-600"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Income</p>
                <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totalDeposits)}</p>
              </div>
              <div className="h-12 w-12 bg-success-light rounded-full flex items-center justify-center">
                <ArrowDownIcon className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Expenses</p>
                <p className="text-2xl font-bold mt-1 text-danger">{formatCurrency(totalWithdrawals)}</p>
              </div>
              <div className="h-12 w-12 bg-danger-light rounded-full flex items-center justify-center">
                <ArrowUpIcon className="h-6 w-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent
            data={getChartData()}
            keys={["deposits", "withdrawals"]}
            colors={["#00BFA5", "#FF5252"]}
            height={300}
          />
        </CardContent>
      </Card>
      
      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction List</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Table */}
          {isLoadingTransactions ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(transaction => {
                    const { name: typeName, badgeClass } = getTransactionTypeInfo(transaction.transactionType);
                    const isIncome = transaction.transactionType === "deposit";
                    const formattedAmount = formatCurrency(Number(transaction.amount));
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                          <div className="text-xs text-neutral-500">
                            {format(new Date(transaction.createdAt), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${badgeClass}`}>
                            {typeName}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${isIncome ? 'text-success' : 'text-danger'}`}>
                          {isIncome ? formattedAmount : `- ${formattedAmount}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No transactions found</p>
              {searchTerm || dateFilter !== "all" || typeFilter !== "all" ? (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm("");
                    setDateFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveDialog('new-transaction')}
                >
                  <PlusIcon className="h-4 w-4 mr-2" /> Create Transaction
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
