import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect } from "react";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import Tenants from "@/pages/Tenants";
import Maintenance from "@/pages/Maintenance";
import Financials from "@/pages/Financials";
import Masterlist from "@/pages/Masterlist";
import Communications from "@/pages/Communications";
import Transactions from "@/pages/Transactions";
import Reports from "@/pages/Reports";
import Documentation from "@/pages/Documentation";
import Users from "@/pages/Users";
import Vendors from "@/pages/Vendors";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import PasswordReset from "@/pages/PasswordReset";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { User } from "@shared/schema";

type UserWithoutPassword = Omit<User, 'password'>;

function useAuth() {
  const { data: user, isLoading } = useQuery<UserWithoutPassword>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  return { user, isLoading };
}

function AuthenticatedLayout() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include' 
    });
    localStorage.removeItem('user');
    queryClient.clear();
    setLocation('/login');
  };

  // Use useEffect to handle navigation to avoid hook issues
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm text-muted-foreground">
                Welcome, {user.fullName || user.username} ({user.role})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6">
              <Router />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/users" component={Users} />
      <Route path="/masterlist" component={Masterlist} />
      <Route path="/properties" component={Properties} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/communications" component={Communications} />
      <Route path="/financials" component={Financials} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/reports" component={Reports} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {location === '/login' ? (
            <Login />
          ) : location === '/reset-password' ? (
            <PasswordReset />
          ) : (
            <AuthenticatedLayout />
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;