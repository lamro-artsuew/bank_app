import { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  // Format currency value
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof value === 'string' ? parseFloat(value.toString()) : value);
  };

  // Format date and time
  const formatDate = (date: Date | string) => {
    const dateObj = new Date(date);
    return format(dateObj, "MMM d, yyyy");
  };

  const formatTime = (date: Date | string) => {
    const dateObj = new Date(date);
    return format(dateObj, "h:mm a");
  };

  // Determine if transaction is income or expense
  const isIncome = transaction.transactionType === 'deposit';
  
  // Get icon and color based on transaction type
  const getTypeStyles = () => {
    switch (transaction.transactionType) {
      case 'deposit':
        return {
          icon: <ArrowDownIcon className="text-success" />,
          bgColor: 'bg-success-light',
          textColor: 'text-success'
        };
      case 'withdrawal':
        return {
          icon: <ArrowUpIcon className="text-danger" />,
          bgColor: 'bg-danger-light',
          textColor: 'text-danger'
        };
      case 'transfer':
        return {
          icon: <ArrowUpIcon className="text-primary" />,
          bgColor: 'bg-primary-50',
          textColor: 'text-primary'
        };
      case 'payment':
        return {
          icon: <ArrowUpIcon className="text-danger" />,
          bgColor: 'bg-danger-light',
          textColor: 'text-danger'
        };
      default:
        return {
          icon: <ArrowUpIcon className="text-neutral-500" />,
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-500'
        };
    }
  };

  const { icon, bgColor } = getTypeStyles();

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100">
      <div className="flex items-center">
        <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center mr-3`}>
          {icon}
        </div>
        <div>
          <p className="font-medium text-neutral-800">{transaction.description}</p>
          <p className="text-xs text-neutral-500">
            {formatDate(transaction.createdAt)} · {formatTime(transaction.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${isIncome ? 'text-success' : 'text-danger'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-neutral-500">
          {transaction.category || 'Uncategorized'}
        </p>
      </div>
    </div>
  );
}
