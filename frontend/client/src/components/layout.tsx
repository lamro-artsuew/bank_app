import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Get the page title based on the current route
  const getPageTitle = () => {
    const routes = {
      "/": "Dashboard",
      "/accounts": "Accounts",
      "/transactions": "Transactions",
      "/bills": "Bill Payments",
      "/cards": "Cards",
      "/loans": "Loans",
      "/profile": "Profile",
      "/security": "Security",
      "/notifications": "Notifications",
    };

    return routes[location as keyof typeof routes] || "FinEdge";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          openSidebar={() => setIsSidebarOpen(true)}
          title={getPageTitle()}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
