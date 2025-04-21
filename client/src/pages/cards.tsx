import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card as CardModel, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LockIcon, PlusIcon, ShieldIcon, CreditCard as CreditCardIcon } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

// Card creation schema
const createCardSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  cardNumber: z.string().min(16, "Card number must be at least 16 digits").max(19, "Card number cannot exceed 19 digits"),
  cardType: z.enum(["debit", "credit"]),
  cardNetwork: z.enum(["visa", "mastercard", "amex", "discover"]),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Must be in MM/YY format"),
  cvv: z.string().min(3, "CVV must be at least 3 digits").max(4, "CVV cannot exceed 4 digits"),
  creditLimit: z.string().optional(),
});

type CreateCardValues = z.infer<typeof createCardSchema>;

export default function Cards() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Form setup
  const form = useForm<CreateCardValues>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      accountId: "",
      cardNumber: "",
      cardType: "debit",
      cardNetwork: "visa",
      expiryDate: "",
      cvv: "",
      creditLimit: "",
    }
  });

  // Watch cardType to conditionally show creditLimit field
  const cardType = form.watch("cardType");

  // Fetch cards
  const { 
    data: cards = [], 
    isLoading: isLoadingCards,
    error: cardsError
  } = useQuery<CardModel[]>({
    queryKey: ["/api/cards"],
  });

  // Fetch accounts (for the create card dialog)
  const { 
    data: accounts = [], 
    isLoading: isLoadingAccounts 
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (values: CreateCardValues) => {
      const payload = {
        ...values,
        accountId: parseInt(values.accountId),
        creditLimit: values.creditLimit ? parseFloat(values.creditLimit) : undefined,
      };
      
      const res = await apiRequest("POST", "/api/cards", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card created",
        description: "Your card has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating card",
        description: error.message || "An error occurred while creating your card.",
        variant: "destructive",
      });
    },
  });

  // Update card status mutation
  const updateCardStatusMutation = useMutation({
    mutationFn: async ({ cardId, status }: { cardId: number, status: "active" | "inactive" | "blocked" }) => {
      const res = await apiRequest("PATCH", `/api/cards/${cardId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card updated",
        description: "Your card status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating card",
        description: error.message || "An error occurred while updating the card.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleCreateCard = (values: CreateCardValues) => {
    createCardMutation.mutate(values);
  };

  // Handle card status update
  const handleToggleCardStatus = (card: CardModel) => {
    const newStatus = card.status === "active" ? "inactive" : "active";
    updateCardStatusMutation.mutate({ cardId: card.id, status: newStatus });
  };

  // Handle card freeze
  const handleFreezeCard = (card: CardModel) => {
    updateCardStatusMutation.mutate({ cardId: card.id, status: "blocked" });
  };

  // Generate a random card number
  const generateCardNumber = () => {
    const network = form.getValues("cardNetwork");
    
    let prefix = "4"; // Visa
    if (network === "mastercard") prefix = "5";
    if (network === "amex") prefix = "37";
    if (network === "discover") prefix = "6";
    
    const length = network === "amex" ? 15 : 16;
    let cardNumber = prefix;
    
    for (let i = prefix.length; i < length; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    
    form.setValue("cardNumber", cardNumber);
  };

  // Function to mask card number (show only last 4 digits)
  const maskCardNumber = (cardNumber: string) => {
    return "•••• " + cardNumber.slice(-4);
  };

  // Get card type display info
  const getCardTypeInfo = (card: CardModel) => {
    const networkColors: Record<string, string> = {
      visa: "bg-blue-600",
      mastercard: "bg-orange-600",
      amex: "bg-green-600",
      discover: "bg-purple-600",
    };
    
    const networkDisplay: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
      discover: "Discover",
    };
    
    return {
      color: networkColors[card.cardNetwork] || "bg-gray-600",
      networkName: networkDisplay[card.cardNetwork] || card.cardNetwork,
    };
  };

  // Filter cards based on active tab
  const filteredCards = cards.filter(card => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return card.status === "active";
    if (activeTab === "inactive") return card.status === "inactive";
    if (activeTab === "blocked") return card.status === "blocked";
    return true;
  });

  if (cardsError) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center py-10">
              <p className="text-red-500 mb-2">Error loading cards</p>
              <p className="text-neutral-600">{(cardsError as Error).message}</p>
              <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/cards"] })}>
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
        <h1 className="text-2xl font-semibold text-neutral-800">Cards</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" /> Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCard)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.accountName} ({account.accountType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="debit">Debit Card</SelectItem>
                          <SelectItem value="credit">Credit Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardNetwork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Network</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                          <SelectItem value="discover">Discover</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input placeholder="Card number" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={generateCardNumber}>
                          Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="***" maxLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {cardType === "credit" && (
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Limit</FormLabel>
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
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCardMutation.isPending}>
                    {createCardMutation.isPending ? "Creating..." : "Create Card"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card security info */}
      <Card className="mb-8 bg-primary-50 border-primary-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <ShieldIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-1">Card Security</h3>
              <p className="text-neutral-600">Your cards are protected with advanced encryption and fraud monitoring. If you notice any suspicious activity, freeze your card immediately.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards listing */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Cards</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoadingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(null).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => {
                const { color, networkName } = getCardTypeInfo(card);
                const account = accounts.find(a => a.id === card.accountId);
                
                return (
                  <Card 
                    key={card.id} 
                    className={`${
                      card.status === "blocked" 
                        ? "bg-neutral-100 opacity-70" 
                        : "bg-white"
                    } relative overflow-hidden`}
                  >
                    {card.status === "blocked" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                        <div className="bg-danger rounded-lg px-4 py-2 text-white font-medium">
                          FROZEN
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1)} Card
                          </CardTitle>
                          <CardDescription>
                            {account?.accountName || "Unknown Account"}
                          </CardDescription>
                        </div>
                        <Avatar className={`${color} h-10 w-10 text-white`}>
                          <AvatarFallback className="uppercase text-sm">
                            {card.cardNetwork.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-neutral-500">Card Number</p>
                          <p className="font-mono text-lg font-medium">{maskCardNumber(card.cardNumber)}</p>
                        </div>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-neutral-500">Expiry Date</p>
                            <p className="font-medium">{card.expiryDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-500">Network</p>
                            <p className="font-medium">{networkName}</p>
                          </div>
                        </div>
                        {card.cardType === "credit" && card.creditLimit && (
                          <div>
                            <p className="text-sm text-neutral-500">Credit Limit</p>
                            <p className="font-medium">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(parseFloat(card.creditLimit.toString()))}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-neutral-500">Active</span>
                        <Switch 
                          checked={card.status === "active"} 
                          onCheckedChange={() => handleToggleCardStatus(card)}
                          disabled={card.status === "blocked"}
                        />
                      </div>
                      {card.status !== "blocked" ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleFreezeCard(card)}
                          className="text-danger border-danger hover:bg-danger-light"
                        >
                          <LockIcon className="h-4 w-4 mr-2" /> Freeze
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateCardStatusMutation.mutate({ cardId: card.id, status: "active" })}
                        >
                          <CreditCardIcon className="h-4 w-4 mr-2" /> Unfreeze
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">
                    {activeTab === "all" 
                      ? "You don't have any cards yet" 
                      : activeTab === "active" 
                        ? "You don't have any active cards" 
                        : activeTab === "inactive" 
                          ? "You don't have any inactive cards"
                          : "You don't have any blocked cards"
                    }
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" /> Add a Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
