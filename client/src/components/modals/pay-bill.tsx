import { useState } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Account, Bill } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

// Schema for bill payment validation
const payBillSchema = z.object({
  billId: z.string().min(1, "Please select a bill"),
  accountId: z.string().min(1, "Please select an account to pay from"),
});

type PayBillFormValues = z.infer<typeof payBillSchema>;

interface PayBillProps {
  accounts: Account[];
  onClose: () => void;
}

export default function PayBill({ accounts, onClose }: PayBillProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Form setup
  const form = useForm<PayBillFormValues>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      billId: "",
      accountId: "",
    }
  });

  // Fetch bills
  const { data: bills = [], isLoading: isLoadingBills } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  // Filter bills that are pending
  const pendingBills = bills.filter(bill => bill.status === 'pending');

  // Mutation for paying a bill
  const payBillMutation = useMutation({
    mutationFn: async (values: PayBillFormValues) => {
      const res = await apiRequest(
        "POST", 
        `/api/bills/${values.billId}/pay`, 
        { accountId: values.accountId }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bill payment successful",
        description: "Your bill has been paid successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: PayBillFormValues) => {
    payBillMutation.mutate(values);
  };

  // Update selected bill when billId changes
  const handleBillChange = (billId: string) => {
    const bill = bills.find(b => b.id.toString() === billId);
    setSelectedBill(bill || null);
    form.setValue("billId", billId);
  };

  // Format currency value
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof value === 'string' ? parseFloat(value.toString()) : value);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pay a Bill</DialogTitle>
        <DialogDescription>
          Select a bill to pay and the account to pay from
        </DialogDescription>
      </DialogHeader>

      {pendingBills.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-neutral-600 mb-4">You have no pending bills to pay</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Bill Selection */}
            <FormField
              control={form.control}
              name="billId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Bill</FormLabel>
                  <Select 
                    onValueChange={(value) => handleBillChange(value)} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bill to pay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pendingBills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id.toString()}>
                          {bill.payee} - {formatCurrency(bill.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bill Details (if selected) */}
            {selectedBill && (
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-800 mb-2">Bill Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-neutral-600">Payee:</div>
                  <div className="font-medium">{selectedBill.payee}</div>
                  
                  <div className="text-neutral-600">Amount:</div>
                  <div className="font-medium">{formatCurrency(selectedBill.amount)}</div>
                  
                  <div className="text-neutral-600">Due Date:</div>
                  <div className="font-medium">
                    {format(new Date(selectedBill.dueDate), "MMM d, yyyy")}
                  </div>
                  
                  {selectedBill.isRecurring && (
                    <>
                      <div className="text-neutral-600">Recurring:</div>
                      <div className="font-medium">
                        {selectedBill.recurringInterval || "Monthly"}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Account Selection */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay From</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountName} - {formatCurrency(account.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={payBillMutation.isPending || !selectedBill}
              >
                {payBillMutation.isPending ? "Processing..." : "Pay Bill"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
