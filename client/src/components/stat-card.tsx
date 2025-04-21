import { ArrowDownIcon, ArrowUpIcon, Wallet } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  icon: 'wallet' | 'income' | 'expense';
}

export default function StatCard({ title, value, change, isPositive, icon }: StatCardProps) {
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Get the appropriate icon based on the prop
  const renderIcon = () => {
    switch (icon) {
      case 'wallet':
        return (
          <div className="h-12 w-12 bg-primary-50 rounded-full flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        );
      case 'income':
        return (
          <div className="h-12 w-12 bg-success-light rounded-full flex items-center justify-center">
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
              className="h-6 w-6 text-success"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="8 12 12 8 16 12" />
              <line x1="12" y1="16" x2="12" y2="8" />
            </svg>
          </div>
        );
      case 'expense':
        return (
          <div className="h-12 w-12 bg-danger-light rounded-full flex items-center justify-center">
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
              className="h-6 w-6 text-danger"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="16 12 12 16 8 12" />
              <line x1="12" y1="8" x2="12" y2="16" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-stat bg-white p-5 rounded-xl shadow-sm transition-all duration-300 hover:translate-y-[-2px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-900 mt-1">
            {formatCurrency(value)}
          </h3>
          <p 
            className={`${isPositive ? 'text-success' : 'text-danger'} text-sm font-medium mt-1 flex items-center`}
          >
            {isPositive ? (
              <ArrowUpIcon className="mr-1 h-4 w-4" />
            ) : (
              <ArrowUpIcon className="mr-1 h-4 w-4" />
            )}
            {change}% from last month
          </p>
        </div>
        {renderIcon()}
      </div>
    </div>
  );
}
