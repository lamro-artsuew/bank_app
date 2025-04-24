import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Banknote,
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  FileText,
  CreditCard,
  DollarSign,
  UserCog,
  Shield,
  Bell,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    {
      section: "Main",
      items: [
        { name: "Dashboard", icon: <LayoutDashboard className="text-lg" />, path: "/" },
        { name: "Accounts", icon: <Wallet className="text-lg" />, path: "/accounts" },
        { name: "Transactions", icon: <ArrowRightLeft className="text-lg" />, path: "/transactions" },
        { name: "Bill Payments", icon: <FileText className="text-lg" />, path: "/bills" },
        { name: "Cards", icon: <CreditCard className="text-lg" />, path: "/cards" },
        { name: "Loans", icon: <DollarSign className="text-lg" />, path: "/loans" },
      ]
    },
    {
      section: "Settings",
      items: [
        { name: "Profile", icon: <UserCog className="text-lg" />, path: "/profile" },
        { name: "Security", icon: <Shield className="text-lg" />, path: "/security" },
        { name: "Notifications", icon: <Bell className="text-lg" />, path: "/notifications" },
      ]
    }
  ];

  return (
    <aside 
      className={`sidebar bg-white fixed inset-y-0 left-0 z-30 w-64 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center border-b border-neutral-100">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-neutral-800">FinEdge</h1>
          </div>
          <button onClick={onClose} className="ml-auto text-neutral-500 lg:hidden">
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
              className="text-2xl"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((section, index) => (
            <div key={index}>
              <div className="px-4 mb-3">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {section.section}
                </p>
              </div>
              <ul className="mb-6">
                {section.items.map((item, itemIndex) => {
                  const isActive = location === item.path;
                  return (
                    <li key={itemIndex}>
                      <Link href={item.path}>
                        <a 
                          className={`block px-4 py-2.5 mx-2 rounded-lg font-medium ${
                            isActive 
                              ? "text-neutral-900 bg-neutral-50" 
                              : "text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-center">
                            {item.icon}
                            <span className="ml-3">{item.name}</span>
                          </div>
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        
        {/* Profile Summary */}
        <div className="px-4 py-3 border-t border-neutral-100">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-neutral-200 text-neutral-600">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-800">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-neutral-500 hover:text-neutral-700"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
