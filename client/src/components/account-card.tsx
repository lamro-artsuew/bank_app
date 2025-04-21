import { Account } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CreditCard, Landmark, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface AccountCardProps {
  account: Account;
  showDetails?: boolean;
}

export default function AccountCard({ account, showDetails = false }: AccountCardProps) {
  const [_, navigate] = useLocation();

  // Format currency value
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof value === 'string' ? parseFloat(value.toString()) : value);
  };

  // Format account number to show last 4 digits
  const formatAccountNumber = (accountNumber: string) => {
    return `**** ${accountNumber.slice(-4)}`;
  };
  
  // Get card style based on account type
  const getCardStyle = () => {
    switch (account.accountType) {
      case 'checking':
        return 'from-primary to-primary-700 text-white';
      case 'savings':
        return 'from-neutral-700 to-neutral-900 text-white';
      case 'investment':
        return 'from-secondary to-primary-800 text-white';
      case 'credit':
        return 'from-rose-600 to-rose-800 text-white';
      default:
        return 'from-primary to-primary-700 text-white';
    }
  };
  
  // Get account type icon
  const getAccountTypeIcon = () => {
    switch (account.accountType) {
      case 'checking':
        return <Landmark className="h-6 w-6 text-white opacity-80" />;
      case 'savings':
        return <CreditCard className="h-6 w-6 text-white opacity-80" />;
      case 'investment':
        return <TrendingUp className="h-6 w-6 text-white opacity-80" />;
      case 'credit':
        return <CreditCard className="h-6 w-6 text-white opacity-80" />;
      default:
        return <Landmark className="h-6 w-6 text-white opacity-80" />;
    }
  };

  // Get formatted account type name for display
  const getAccountTypeName = () => {
    return account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1) + ' Account';
  };

  const handleViewDetails = () => {
    // Navigate to account details page (would be implemented in a real app)
    // navigate(`/accounts/${account.id}`);
  };

  return (
    <Card className={`bg-gradient-to-br ${getCardStyle()} rounded-2xl shadow-md transition-all duration-300 hover:translate-y-[-4px]`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-primary-200 text-sm opacity-80">{getAccountTypeName()}</p>
            <p className="font-medium text-primary-100">{formatAccountNumber(account.accountNumber)}</p>
          </div>
          <div>
            {account.cardType ? (
              <div className="uppercase text-2xl text-white opacity-80">{account.cardType}</div>
            ) : (
              getAccountTypeIcon()
            )}
          </div>
        </div>
        <div className="mb-2">
          <p className="text-primary-200 text-sm opacity-80">Available Balance</p>
          <h3 className="text-2xl font-bold">{formatCurrency(account.balance)}</h3>
        </div>
        <div className="flex justify-between">
          <div>
            {account.validThru && (
              <>
                <p className="text-primary-200 text-xs opacity-80">Valid Thru</p>
                <p className="text-white text-sm">{account.validThru}</p>
              </>
            )}
          </div>
          {showDetails ? (
            <Button variant="secondary" size="sm" className="text-xs" onClick={handleViewDetails}>
              View Details <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="text-xs bg-white/10 hover:bg-white/20 text-white border-0">
              Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
