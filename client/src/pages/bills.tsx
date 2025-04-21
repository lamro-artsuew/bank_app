import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bill, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle, 
  CalendarIcon, 
  CheckCircle2, 
  ClockIcon, 
  PlusIcon, 
  RefreshCw, 
  XCircle 
} from "lucide-react";
import { format, isPast, addDays } from "date-fns";
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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import PayBill from "@/components/modals/pay-bill";

// Bill creation schema
const createBillSchema = z.object({
  payee: z.string().min(2, "Payee name must be at least 2 characters"),
  amount: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Amount must be a positive number"
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
});

type CreateBillValues = z.infer<typeof createBillSchema>;

export default function Bills() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Form setup
  const form = useForm<CreateBillValues>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      payee: "",
      amount: "",
      dueDate: new Date(),
      isRecurring: false,
      recurringInterval: "monthly",
    }
  });

  // Fetch bills
  const { 
    data: bills = [], 
    isLoading: isLoadingBills,
    error: billsError
  } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  // Fetch accounts (for the pay bill dialog)
  const { 
    data: accounts = [], 
    isLoading: isLoadingAccounts 
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: async (values: CreateBillValues) => {
      const res = await apiRequest("POST", "/api/bills", {
        ...values,
        amount: parseFloat(values.amount),
        status: "pending",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bill created",
        description: "Your bill has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating bill",
        description: error.message || "An error occurred while creating your bill.",
        variant: "destructive",
      });
    },
  });

  // Delete bill mutation
  const deleteBillMutation = useMutation({
    mutationFn: async (billId: number) => {
      await apiRequest("DELETE", `/api/bills/${billId}`);
    },
    onSuccess: () => {
      toast({
        title: "Bill deleted",
        description: "Your bill has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting bill",
        description: error.message || "An error occurred while deleting the bill.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleCreateBill = (values: CreateBillValues) => {
    createBillMutation.mutate(values);
  };

  // Handle bill deletion
  const handleDeleteBill = (billId: number) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      deleteBillMutation.mutate(billId);
    }
  };

  // Filter bills based on the active tab
  const filteredBills = bills.filter(bill => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return bill.status === "pending";
    if (activeTab === "paid") return bill.status === "paid";
    if (activeTab === "overdue") return bill.status === "overdue" || (bill.status === "pending" && isPast(new Date(bill.dueDate)));
    return true;
  });

  // Format currency value
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof value === 'string' ? parseFloat(value.toString()) : value);
  };

  // Get status badge
  const getBillStatusBadge = (bill: Bill) => {
    const isPastDue = isPast(new Date(bill.dueDate)) && bill.status === "pending";
    
    if (isPastDue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </span>
      );
    }
    
    switch (bill.status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  if (billsError) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center py-10">
              <p className="text-red-500 mb-2">Error loading bills</p>
              <p className="text-neutral-600">{(billsError as Error).message}</p>
              <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bills"] })}>
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
        <h1 className="text-2xl font-semibold text-neutral-800">Bill Payments</h1>
        <div className="space-x-2">
          <Dialog
            open={isPayDialogOpen}
            onOpenChange={setIsPayDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Pay Bills
              </Button>
            </DialogTrigger>
            <DialogContent>
              <PayBill 
                accounts={accounts} 
                onClose={() => setIsPayDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" /> Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bill</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateBill)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="payee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payee Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Electricity Company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
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
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => date < addDays(new Date(), -1)}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Recurring Payment</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("isRecurring") && (
                    <FormField
                      control={form.control}
                      name="recurringInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurrence Interval</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select interval" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBillMutation.isPending}>
                      {createBillMutation.isPending ? "Creating..." : "Create Bill"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bills listing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Bills</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoadingBills ? (
                // Skeleton loader
                <div className="space-y-4">
                  {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-neutral-100">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-20 rounded-md" />
                        <Skeleton className="h-9 w-20 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredBills.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.payee}</TableCell>
                          <TableCell>{formatCurrency(bill.amount)}</TableCell>
                          <TableCell>{format(new Date(bill.dueDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>{getBillStatusBadge(bill)}</TableCell>
                          <TableCell>
                            {bill.isRecurring ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                {bill.recurringInterval || "Monthly"}
                              </span>
                            ) : (
                              <span className="text-neutral-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {bill.status === "pending" && (
                                <Button
                                  onClick={() => setIsPayDialogOpen(true)}
                                  size="sm"
                                  variant="outline"
                                >
                                  Pay
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteBill(bill.id)}
                                size="sm"
                                variant="ghost"
                                className="text-danger hover:text-danger hover:bg-danger-light"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">
                    {activeTab === "all" 
                      ? "You don't have any bills yet" 
                      : activeTab === "pending" 
                        ? "You don't have any pending bills" 
                        : activeTab === "paid" 
                          ? "You don't have any paid bills"
                          : "You don't have any overdue bills"
                    }
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" /> Add a Bill
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
