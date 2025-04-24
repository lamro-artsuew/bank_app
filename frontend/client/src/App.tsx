import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Transactions from "@/pages/transactions";
import Bills from "@/pages/bills";
import Cards from "@/pages/cards";
import Loans from "@/pages/loans";
import Profile from "@/pages/profile";
import Layout from "@/components/layout";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => (
        <Layout>
          <Dashboard />
        </Layout>
      )} />
      <ProtectedRoute path="/accounts" component={() => (
        <Layout>
          <Accounts />
        </Layout>
      )} />
      <ProtectedRoute path="/transactions" component={() => (
        <Layout>
          <Transactions />
        </Layout>
      )} />
      <ProtectedRoute path="/bills" component={() => (
        <Layout>
          <Bills />
        </Layout>
      )} />
      <ProtectedRoute path="/cards" component={() => (
        <Layout>
          <Cards />
        </Layout>
      )} />
      <ProtectedRoute path="/loans" component={() => (
        <Layout>
          <Loans />
        </Layout>
      )} />
      <ProtectedRoute path="/profile" component={() => (
        <Layout>
          <Profile />
        </Layout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
