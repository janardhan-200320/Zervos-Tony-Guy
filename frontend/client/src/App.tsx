import ErrorBoundary from "@/components/ErrorBoundary";
import TopProgressBar from "@/components/TopProgressBar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { SuperAdminProvider } from "@/superadmin/contexts/SuperAdminContext";
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
import WABAConfigPage from '@/pages/waba-config';
import MarketingCampaignsPage from '@/pages/marketing-campaigns';
import BotFlowsDashboard from '@/pages/bot-flows-dashboard';
import ConversationsPage from '@/pages/conversations';
import BotAnalyticsPage from '@/pages/bot-analytics';
import VisualBotFlowBuilderPage from '@/pages/visual-bot-flow-builder-page';
import WorkflowsPage from "@/pages/workflows";

// Super Admin Pages
import SuperAdminDashboard from "@/superadmin/pages/SuperAdminDashboard";
import ClientsManagement from "@/superadmin/pages/ClientsManagement";
import SuperAdminSubscriptionPlans from "@/superadmin/pages/SubscriptionPlans";
import SupportTickets from "@/superadmin/pages/SupportTickets";
import RevenueAnalytics from "@/superadmin/pages/RevenueAnalytics";
import SystemSettings from "@/superadmin/pages/SystemSettings";
import Announcements from "@/superadmin/pages/Announcements";
import ActivityLogs from "@/superadmin/pages/ActivityLogs";
import BillingManagement from "@/superadmin/pages/BillingManagement";
import FeatureFlags from "@/superadmin/pages/FeatureFlags";
import RealTimeMetrics from "@/superadmin/pages/RealTimeMetrics";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        console.log('❌ Not authenticated, redirecting to /login');
        setLocation('/login');
      }
    }
  }, [session, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return session ? <Component {...rest} /> : null;
}

// Super Admin Route Protection
function SuperAdminRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = () => {
      const superAdminFlag = localStorage.getItem('zervos_superadmin');
      if (superAdminFlag === 'true') {
        setIsSuperAdmin(true);
      } else {
        setLocation('/login');
      }
      setIsChecking(false);
    };
    checkSuperAdmin();
  }, [setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="text-white mt-4">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  return isSuperAdmin ? <Component {...rest} /> : null;
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
      
      {/* Super Admin Routes */}
      <Route path="/superadmin">{() => <SuperAdminRoute component={SuperAdminDashboard} />}</Route>
      <Route path="/superadmin/clients">{() => <SuperAdminRoute component={ClientsManagement} />}</Route>
      <Route path="/superadmin/subscriptions">{() => <SuperAdminRoute component={SuperAdminSubscriptionPlans} />}</Route>
      <Route path="/superadmin/billing">{() => <SuperAdminRoute component={BillingManagement} />}</Route>
      <Route path="/superadmin/tickets">{() => <SuperAdminRoute component={SupportTickets} />}</Route>
      <Route path="/superadmin/analytics">{() => <SuperAdminRoute component={RevenueAnalytics} />}</Route>
      <Route path="/superadmin/metrics">{() => <SuperAdminRoute component={RealTimeMetrics} />}</Route>
      <Route path="/superadmin/features">{() => <SuperAdminRoute component={FeatureFlags} />}</Route>
      <Route path="/superadmin/settings">{() => <SuperAdminRoute component={SystemSettings} />}</Route>
      <Route path="/superadmin/announcements">{() => <SuperAdminRoute component={Announcements} />}</Route>
      <Route path="/superadmin/activity">{() => <SuperAdminRoute component={ActivityLogs} />}</Route>

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
      <Route path="/dashboard/admin/whatsapp/connect">{() => <ProtectedRoute component={WhatsAppConnect} />}</Route>  <Route path="/dashboard/waba-config">{() => <ProtectedRoute component={WABAConfigPage} />}</Route>
  <Route path="/dashboard/marketing-campaigns">{() => <ProtectedRoute component={MarketingCampaignsPage} />}</Route>
  <Route path="/dashboard/bot-flows">{() => <ProtectedRoute component={BotFlowsDashboard} />}</Route>
  <Route path="/dashboard/bot-flows/builder">{() => <ProtectedRoute component={VisualBotFlowBuilderPage} />}</Route>
  <Route path="/dashboard/bot-flows/builder/:id">{() => <ProtectedRoute component={VisualBotFlowBuilderPage} />}</Route>
  <Route path="/dashboard/conversations">{() => <ProtectedRoute component={ConversationsPage} />}</Route>
  <Route path="/dashboard/bot-analytics">{() => <ProtectedRoute component={BotAnalyticsPage} />}</Route>
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
      <AuthProvider>
        <WorkspaceProvider>
          <NotificationProvider>
            <SuperAdminProvider>
              <TooltipProvider>
                <ErrorBoundary>
                  <Toaster />
                  <TopProgressBar />
                  <Router />
                </ErrorBoundary>
              </TooltipProvider>
            </SuperAdminProvider>
          </NotificationProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
