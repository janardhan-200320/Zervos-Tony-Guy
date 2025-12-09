import ErrorBoundary from "@/components/ErrorBoundary";
import TopProgressBar from "@/components/TopProgressBar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import AccountPage from "@/pages/Account";
import AdminCenterPage from "@/pages/admin";
import BranchManagement from '@/pages/admin/branches';
import CustomLabelsPage from '@/pages/admin/custom-labels';
import WhatsAppSettings from '@/pages/admin/whatsapp';
import WhatsAppConnect from '@/pages/admin/whatsapp-connect';
import Workspaces from '@/pages/admin/Workspaces';
import WorkspaceView from "@/pages/admin/WorkspaceView";
import AppointmentsPage from "@/pages/AppointmentsNew";
import BalanceSheetPage from '@/pages/balance-sheet';
import BookingPagesPage from "@/pages/booking-pages";
import CalendarPage from "@/pages/calendar";
import DashboardOverview from "@/pages/dashboard-overview";
import ExpensesPage from '@/pages/expenses';
import FeedbackForm from "@/pages/feedback-form";
import HelpSupportPage from '@/pages/help-support';
import IncomePage from '@/pages/income';
import InvoicesPage from "@/pages/Invoices";
import CustomersManagementPage from '@/pages/LeadsSimple';
import LoginPage from "@/pages/Login";
import MembershipsPage from '@/pages/memberships';
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import POSPage from "@/pages/POS";
import POSRegister from "@/pages/POSRegister";
import ProductsPage from "@/pages/products";
import PublicBookingPage from "@/pages/public-booking";
import SalespersonsPage from "@/pages/salespersons";
import ServicesPage from "@/pages/services";
import StaffKPIPage from '@/pages/staff-kpi';
import StaffTipsPage from '@/pages/staff-tips';
import SubscriptionPage from "@/pages/Subscription";
import SubscriptionPlansPage from '@/pages/subscription-plans';
import Success from "@/pages/success";
import TeamAttendancePage from "@/pages/team-attendance";
import TeamMembersPage from "@/pages/team-members";
import TeamReportsPage from "@/pages/team-reports";
import TeamDashboard from "@/pages/team/TeamDashboard";
import TeamLogin from "@/pages/team/TeamLogin";
import TeamPublicView from "@/pages/team/TeamPublicView";
import TimeSlotsPage from '@/pages/time-slots';
import VendorManagementPage from '@/pages/vendor-management';
import WorkflowsPage from "@/pages/workflows";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('zervos_is_authenticated');
      const user = localStorage.getItem('zervos_current_user');
      
      console.log('🔐 Auth Check:', { auth, hasUser: !!user });
      
      if (auth === 'true' && user) {
        setIsAuthenticated(true);
      } else {
        console.log('❌ Not authenticated, redirecting to /login');
        setLocation('/login');
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">{() => <ProtectedRoute component={Onboarding} />}</Route>
      <Route path="/success">{() => <ProtectedRoute component={Success} />}</Route>
      <Route path="/feedback" component={FeedbackForm} />
      <Route path="/booking" component={PublicBookingPage} />
      <Route path="/book/:serviceId" component={PublicBookingPage} />
      <Route path="/booking/:workspaceId" component={PublicBookingPage} />
  <Route path="/team/login" component={TeamLogin} />
  <Route path="/team" component={TeamDashboard} />
  <Route path="/team/public/:memberId" component={TeamPublicView} />
      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardOverview} />}</Route>
      <Route path="/dashboard/appointments">{() => <ProtectedRoute component={AppointmentsPage} />}</Route>
      <Route path="/dashboard/workflows">{() => <ProtectedRoute component={WorkflowsPage} />}</Route>
      <Route path="/dashboard/calendar">{() => <ProtectedRoute component={CalendarPage} />}</Route>
      <Route path="/dashboard/time-slots">{() => <ProtectedRoute component={TimeSlotsPage} />}</Route>
      <Route path="/dashboard/subscription-plans">{() => <ProtectedRoute component={SubscriptionPlansPage} />}</Route>
      <Route path="/dashboard/help-support">{() => <ProtectedRoute component={HelpSupportPage} />}</Route>
      <Route path="/dashboard/team-members">{() => <ProtectedRoute component={TeamMembersPage} />}</Route>
      <Route path="/dashboard/team-attendance">{() => <ProtectedRoute component={TeamAttendancePage} />}</Route>
      <Route path="/dashboard/team-reports">{() => <ProtectedRoute component={TeamReportsPage} />}</Route>
      <Route path="/dashboard/booking-pages">{() => <ProtectedRoute component={BookingPagesPage} />}</Route>
      <Route path="/dashboard/services">{() => <ProtectedRoute component={ServicesPage} />}</Route>
      <Route path="/dashboard/products">{() => <ProtectedRoute component={ProductsPage} />}</Route>
      <Route path="/dashboard/customers">{() => <ProtectedRoute component={CustomersManagementPage} />}</Route>
      <Route path="/dashboard/admin-center">{() => <ProtectedRoute component={AdminCenterPage} />}</Route>
      <Route path="/dashboard/admin-center/workspaces">{() => <ProtectedRoute component={Workspaces} />}</Route>
      <Route path="/dashboard/admin/branches">{() => <ProtectedRoute component={BranchManagement} />}</Route>
      <Route path="/dashboard/admin/custom-labels">{() => <ProtectedRoute component={CustomLabelsPage} />}</Route>
      <Route path="/dashboard/admin/whatsapp">{() => <ProtectedRoute component={WhatsAppSettings} />}</Route>
      <Route path="/dashboard/admin/whatsapp/connect">{() => <ProtectedRoute component={WhatsAppConnect} />}</Route>
      <Route path="/dashboard/workspace/:id">{() => <ProtectedRoute component={WorkspaceView} />}</Route>
      <Route path="/dashboard/salespersons">{() => <ProtectedRoute component={SalespersonsPage} />}</Route>
  <Route path="/dashboard/invoices">{() => <ProtectedRoute component={InvoicesPage} />}</Route>
  <Route path="/dashboard/pos">{() => <ProtectedRoute component={POSPage} />}</Route>
  <Route path="/pos-register">{() => <ProtectedRoute component={POSRegister} />}</Route>
  <Route path="/dashboard/staff-kpi">{() => <ProtectedRoute component={StaffKPIPage} />}</Route>
  <Route path="/dashboard/vendor-management">{() => <ProtectedRoute component={VendorManagementPage} />}</Route>
  <Route path="/dashboard/income">{() => <ProtectedRoute component={IncomePage} />}</Route>
  <Route path="/dashboard/expenses">{() => <ProtectedRoute component={ExpensesPage} />}</Route>
  <Route path="/dashboard/balance-sheet">{() => <ProtectedRoute component={BalanceSheetPage} />}</Route>
  <Route path="/dashboard/memberships">{() => <ProtectedRoute component={MembershipsPage} />}</Route>
  <Route path="/dashboard/staff-tips">{() => <ProtectedRoute component={StaffTipsPage} />}</Route>
      <Route path="/dashboard/account">{() => <ProtectedRoute component={AccountPage} />}</Route>
      <Route path="/dashboard/account">{() => <ProtectedRoute component={AccountPage} />}</Route>
      <Route path="/dashboard/subscription">{() => <ProtectedRoute component={SubscriptionPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}function App() {
  useEffect(() => {
    // Global error handler to catch unhandled promise rejections
    const handleError = (event: ErrorEvent) => {
      console.error('❌ GLOBAL ERROR CAUGHT:');
      console.error('Message:', event.message);
      console.error('Error:', event.error);
      console.error('Filename:', event.filename);
      console.error('Line:', event.lineno, 'Column:', event.colno);
      console.error('Stack:', event.error?.stack);
      event.preventDefault(); // Prevent default browser error handling
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ UNHANDLED PROMISE REJECTION:');
      console.error('Reason:', event.reason);
      console.error('Promise:', event.promise);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <NotificationProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <TopProgressBar />
              <Router />
            </ErrorBoundary>
          </TooltipProvider>
        </NotificationProvider>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

export default App;
