import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Account } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Schema for transfer validation
const transferSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  transactionType: z.enum(["deposit", "withdrawal", "transfer"]),
  amount: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Amount must be a positive number"
  }),
  description: z.string().min(3, "Please enter a description"),
  recipientAccountId: z.string().optional(),
  category: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferMoneyProps {
  accounts: Account[];
  onClose: () => void;
}

export default function TransferMoney({ accounts, onClose }: TransferMoneyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactionType, setTransactionType] = useState<"deposit" | "withdrawal" | "transfer">("deposit");

  // Form setup
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      accountId: "",
      transactionType: "deposit",
      amount: "",
      description: "",
      recipientAccountId: "",
      category: "Uncategorized",
    }
  });

  // Mutation for creating a transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (values: TransferFormValues) => {
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        accountId: parseInt(values.accountId),
        recipientAccountId: values.recipientAccountId ? parseInt(values.recipientAccountId) : undefined,
      };
      
      const res = await apiRequest("POST", "/api/transactions", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction successful",
        description: "Your transaction has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Transaction failed",
        description: error.message || "An error occurred while processing your transaction.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: TransferFormValues) => {
    createTransactionMutation.mutate(values);
  };

  // Update transaction type when it changes
  const handleTransactionTypeChange = (value: "deposit" | "withdrawal" | "transfer") => {
    setTransactionType(value);
    form.setValue("transactionType", value);

    // Clear recipientAccountId if not a transfer
    if (value !== "transfer") {
      form.setValue("recipientAccountId", "");
    }
  };

  // Get category options based on transaction type
  const getCategoryOptions = () => {
    switch (transactionType) {
      case "deposit":
        return ["Salary", "Investment", "Refund", "Gift", "Other Income"];
      case "withdrawal":
        return ["Food & Dining", "Shopping", "Housing", "Transportation", "Entertainment", "Healthcare", "Education", "Utilities", "Other"];
      case "transfer":
        return ["Own Account Transfer", "Family Transfer", "Friend Transfer", "Business Transfer", "Other Transfer"];
      default:
        return ["Uncategorized"];
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {transactionType === "deposit" 
            ? "Make a Deposit" 
            : transactionType === "withdrawal" 
              ? "Make a Withdrawal" 
              : "Transfer Money"
          }
        </DialogTitle>
        <DialogDescription>
          {transactionType === "deposit" 
            ? "Add funds to your account" 
            : transactionType === "withdrawal" 
              ? "Withdraw funds from your account" 
              : "Transfer money between accounts"
          }
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Transaction Type */}
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select
                  onValueChange={(value: "deposit" | "withdrawal" | "transfer") => {
                    field.onChange(value);
                    handleTransactionTypeChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Source Account */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {transactionType === "transfer" ? "From Account" : "Account"}
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.accountName} - {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(parseFloat(account.balance.toString()))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recipient Account (only for transfers) */}
          {transactionType === "transfer" && (
            <FormField
              control={form.control}
              name="recipientAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter(account => account.id.toString() !== form.getValues("accountId"))
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.accountName} - {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(parseFloat(account.balance.toString()))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Amount */}
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

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getCategoryOptions().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter a description for this transaction" 
                    className="resize-none" 
                    {...field}
                  />
                </FormControl>
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
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending 
                ? "Processing..." 
                : transactionType === "deposit" 
                  ? "Deposit"
                  : transactionType === "withdrawal"
                    ? "Withdraw"
                    : "Transfer"
              }
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
