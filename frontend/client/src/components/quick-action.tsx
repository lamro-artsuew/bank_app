import { Link } from "wouter";
import { 
  ArrowRightLeft, 
  FileText, 
  CreditCard, 
  HelpCircle 
} from "lucide-react";

interface QuickActionProps {
  icon: 'transfer' | 'bill' | 'card' | 'support';
  title: string;
  link?: string;
  onClick?: () => void;
}

export default function QuickAction({ icon, title, link, onClick }: QuickActionProps) {
  // Render the icon based on the provided type
  const renderIcon = () => {
    switch (icon) {
      case 'transfer':
        return <ArrowRightLeft className="text-xl text-primary" />;
      case 'bill':
        return <FileText className="text-xl text-success" />;
      case 'card':
        return <CreditCard className="text-xl text-primary" />;
      case 'support':
        return <HelpCircle className="text-xl text-info" />;
      default:
        return null;
    }
  };

  // Get background color based on icon type
  const getBgColor = () => {
    switch (icon) {
      case 'transfer':
        return 'bg-primary-50';
      case 'bill':
        return 'bg-success-light';
      case 'card':
        return 'bg-primary-50';
      case 'support':
        return 'bg-info-light';
      default:
        return 'bg-neutral-100';
    }
  };

  // If there's a link, render with Link component
  if (link) {
    return (
      <Link href={link}>
        <a className="bg-white hover:bg-neutral-50 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center cursor-pointer">
          <div className={`h-12 w-12 ${getBgColor()} rounded-full flex items-center justify-center mb-2`}>
            {renderIcon()}
          </div>
          <span className="text-sm font-medium text-neutral-800">{title}</span>
        </a>
      </Link>
    );
  }

  // Otherwise render as a button
  return (
    <button 
      className="bg-white hover:bg-neutral-50 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center w-full"
      onClick={onClick}
    >
      <div className={`h-12 w-12 ${getBgColor()} rounded-full flex items-center justify-center mb-2`}>
        {renderIcon()}
      </div>
      <span className="text-sm font-medium text-neutral-800">{title}</span>
    </button>
  );
}
