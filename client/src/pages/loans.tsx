import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loan, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PlusIcon, 
  ClockIcon, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  CalendarIcon,
  LineChart
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { BarChartComponent, LineChartComponent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

// Loan application schema
const applyLoanSchema = z.object({
  loanType: z.string().min(1, "Please select a loan type"),
  amount: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Amount must be a positive number"
  }),
  term: z.string().refine(value => !isNaN(parseInt(value)) && parseInt(value) > 0, {
    message: "Term must be a positive number"
  }),
  interestRate: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) >= 0, {
    message: "Interest rate must be a non-negative number"
  }),
});

type ApplyLoanValues = z.infer<typeof applyLoanSchema>;

export default function Loans() {
  const { toast } = useToast();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Form setup
  const form = useForm<ApplyLoanValues>({
    resolver: zodResolver(applyLoanSchema),
    defaultValues: {
      loanType: "",
      amount: "",
      term: "",
      interestRate: "",
    }
  });

  // Fetch loans
  const { 
    data: loans = [], 
    isLoading: isLoadingLoans,
    error: loansError
  } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  // Fetch accounts (for reference only)
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Apply for loan mutation
  const applyLoanMutation = useMutation({
    mutationFn: async (values: ApplyLoanValues) => {
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        term: parseInt(values.term),
        interestRate: parseFloat(values.interestRate),
        // Calculate monthly payment using loan formula: PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
        monthlyPayment: calculateMonthlyPayment(
          parseFloat(values.amount),
          parseFloat(values.interestRate) / 100 / 12, // Convert annual rate to monthly decimal
          parseInt(values.term)
        ),
      };
      
      const res = await apiRequest("POST", "/api/loans", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Loan application submitted",
        description: "Your loan application has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      setIsApplyDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error applying for loan",
        description: error.message || "An error occurred while submitting your loan application.",
        variant: "destructive",
      });
    },
  });

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal: number, monthlyRate: number, termMonths: number) => {
    if (monthlyRate === 0) return principal / termMonths;
    
    const x = Math.pow(1 + monthlyRate, termMonths);
    return (principal * monthlyRate * x) / (x - 1);
  };

  // Handle loan type selection
  const handleLoanTypeChange = (type: string) => {
    form.setValue("loanType", type);
    
    // Set default values based on loan type
    switch (type) {
      case "personal":
        form.setValue("interestRate", "9.99");
        break;
      case "auto":
        form.setValue("interestRate", "5.49");
        break;
      case "mortgage":
        form.setValue("interestRate", "4.29");
        break;
      case "education":
        form.setValue("interestRate", "3.99");
        break;
      case "business":
        form.setValue("interestRate", "7.49");
        break;
      default:
        form.setValue("interestRate", "");
    }
  };

  // Handle form submission
  const handleApplyLoan = (values: ApplyLoanValues) => {
    applyLoanMutation.mutate(values);
  };

  // Filter loans based on active tab
  const filteredLoans = loans.filter(loan => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return loan.status === "pending";
    if (activeTab === "active") return loan.status === "active";
    if (activeTab === "closed") return loan.status === "closed";
    return true;
  });

  // Format currency value
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof value === 'string' ? parseFloat(value.toString()) : value);
  };

  // Get loan status badge
  const getLoanStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary">
            <LineChart className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  // Calculate total outstanding loans
  const totalOutstanding = loans
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + parseFloat(loan.amount.toString()), 0);

  // Calculate total monthly payments
  const totalMonthlyPayments = loans
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => {
      const payment = loan.monthlyPayment || 0;
      return sum + parseFloat(payment.toString());
    }, 0);

  // Prepare chart data by loan type
  const getLoansByTypeData = () => {
    const loanTypes: Record<string, number> = {};
    
    loans.forEach(loan => {
      if (!loanTypes[loan.loanType]) {
        loanTypes[loan.loanType] = 0;
      }
      loanTypes[loan.loanType] += parseFloat(loan.amount.toString());
    });
    
    return Object.entries(loanTypes).map(([name, value]) => ({ name, value }));
  };

  // Prepare payment projection data
  const getPaymentProjectionData = () => {
    const data = [];
    for (let month = 1; month <= 12; month++) {
      data.push({
        name: `Month ${month}`,
        payment: totalMonthlyPayments
      });
    }
    return data;
  };

  if (loansError) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center py-10">
              <p className="text-red-500 mb-2">Error loading loans</p>
              <p className="text-neutral-600">{(loansError as Error).message}</p>
              <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/loans"] })}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-neutral-800">Loans</h1>
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" /> Apply for Loan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for a Loan</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleApplyLoan)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="loanType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Type</FormLabel>
                      <Select
                        onValueChange={handleLoanTypeChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal">Personal Loan</SelectItem>
                          <SelectItem value="auto">Auto Loan</SelectItem>
                          <SelectItem value="mortgage">Mortgage</SelectItem>
                          <SelectItem value="education">Education Loan</SelectItem>
                          <SelectItem value="business">Business Loan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            className="pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (Months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter loan term in months"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500">%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Payment calculation preview */}
                {form.watch("amount") && form.watch("term") && form.watch("interestRate") && (
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm font-medium text-neutral-800 mb-2">Payment Preview</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-neutral-600">Principal:</div>
                      <div className="font-medium">
                        {formatCurrency(form.watch("amount"))}
                      </div>
                      
                      <div className="text-neutral-600">Interest Rate:</div>
                      <div className="font-medium">
                        {form.watch("interestRate")}% APR
                      </div>
                      
                      <div className="text-neutral-600">Term:</div>
                      <div className="font-medium">
                        {form.watch("term")} months
                      </div>
                      
                      <div className="text-neutral-600">Monthly Payment:</div>
                      <div className="font-medium">
                        {formatCurrency(
                          calculateMonthlyPayment(
                            parseFloat(form.watch("amount")),
                            parseFloat(form.watch("interestRate")) / 100 / 12,
                            parseInt(form.watch("term"))
                          )
                        )}
                      </div>
                      
                      <div className="text-neutral-600">Total Interest:</div>
                      <div className="font-medium">
                        {formatCurrency(
                          calculateMonthlyPayment(
                            parseFloat(form.watch("amount")),
                            parseFloat(form.watch("interestRate")) / 100 / 12,
                            parseInt(form.watch("term"))
                          ) * parseInt(form.watch("term")) - parseFloat(form.watch("amount"))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={applyLoanMutation.isPending}>
                    {applyLoanMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loan overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-3xl font-bold">{formatCurrency(totalOutstanding)}</h3>
                <span className="text-neutral-500 text-sm">
                  {loans.filter(loan => loan.status === 'active').length} active loans
                </span>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Current Debt Utilization</span>
                  <span className="font-medium">72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-neutral-500">Monthly Payments</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalMonthlyPayments)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Average Interest</p>
                  <p className="text-lg font-semibold">
                    {loans.filter(loan => loan.status === 'active').length > 0
                      ? (loans
                          .filter(loan => loan.status === 'active')
                          .reduce((sum, loan) => sum + parseFloat(loan.interestRate.toString()), 0) /
                          loans.filter(loan => loan.status === 'active').length
                        ).toFixed(2)
                      : "0.00"}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Loan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <BarChartComponent
                data={getLoansByTypeData()}
                keys={["value"]}
                colors={["#3A36DB"]}
                height={220}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment projection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Projection</CardTitle>
          <CardDescription>Estimated monthly payments for the next year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <LineChartComponent
              data={getPaymentProjectionData()}
              keys={["payment"]}
              colors={["#3A36DB"]}
              height={250}
              xAxisDataKey="name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loans listing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Loans</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoadingLoans ? (
                // Skeleton loader
                <div className="space-y-4">
                  {Array(3).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-neutral-100">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLoans.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Monthly Payment</TableHead>
                        <TableHead>Status</TableHead>
                        {activeTab === "active" && <TableHead>Timeline</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">
                            {loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan
                          </TableCell>
                          <TableCell>{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>{loan.term} months</TableCell>
                          <TableCell>{formatCurrency(loan.monthlyPayment)}</TableCell>
                          <TableCell>{getLoanStatusBadge(loan.status)}</TableCell>
                          {activeTab === "active" && (
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                <Progress value={30} className="h-2" />
                                <div className="flex justify-between text-xs text-neutral-500">
                                  <span>Started: {loan.startDate ? format(new Date(loan.startDate), "MM/dd/yyyy") : "N/A"}</span>
                                  <span>Ends: {loan.endDate ? format(new Date(loan.endDate), "MM/dd/yyyy") : "N/A"}</span>
                                </div>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">
                    {activeTab === "all" 
                      ? "You don't have any loans yet" 
                      : activeTab === "pending" 
                        ? "You don't have any pending loans" 
                        : activeTab === "active" 
                          ? "You don't have any active loans"
                          : "You don't have any closed loans"
                    }
                  </p>
                  <Button onClick={() => setIsApplyDialogOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" /> Apply for a Loan
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
