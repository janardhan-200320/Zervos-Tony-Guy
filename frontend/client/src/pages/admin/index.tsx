import { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';

// Import admin sections
import BasicInformation from './BasicInformation';
import BusinessHours from './BusinessHours';
import BookingPage from './BookingPage';
import LoginPreferences from './LoginPreferences';
import Salespersons from './Salespersons';
import Workspaces from './Workspaces';
import Resources from './Resources';
import Locations from './Locations';
import Customers from './Customers';
import Reports from './Reports';
import Integrations from './Integrations';
import Customizations from './Customizations';
import DataAdmin from './DataAdmin';

type AdminSection = 
  | 'basic-info' 
  | 'business-hours' 
  | 'booking-page' 
  | 'login-prefs' 
  | 'salespersons'
  | 'workflows'
  | 'workspaces' 
  | 'resources' 
  | 'locations' 
  | 'customers' 
  | 'reports'
  | 'integrations-most-popular'
  | 'integrations-calendars'
  | 'integrations-video'
  | 'integrations-crm'
  | 'integrations-payments'
  | 'integrations-sms'
  | 'integrations-analytics'
  | 'integrations-connectors'
  | 'integrations-support'
  | 'integrations-accounting'
  | 'customizations'
  | 'custom-domain'
  | 'custom-in-product'
  | 'custom-labels'
  | 'custom-roles'
  | 'data-privacy'
  | 'data-domain-auth'
  | 'data-export';

export default function AdminCenter() {
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState<AdminSection>('basic-info');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sidebar expansion states
  const [organizationExpanded, setOrganizationExpanded] = useState(true);
  const [modulesExpanded, setModulesExpanded] = useState(false);
  const [integrationsExpanded, setIntegrationsExpanded] = useState(false);
  const [customizationsExpanded, setCustomizationsExpanded] = useState(false);
  const [dataAdminExpanded, setDataAdminExpanded] = useState(false);

  const renderContent = () => {
    switch (currentSection) {
      case 'basic-info':
        return <BasicInformation />;
      case 'business-hours':
        return <BusinessHours />;
      case 'booking-page':
        return <BookingPage />;
      case 'login-prefs':
        return <LoginPreferences />;
      case 'salespersons':
        return <Salespersons />;
      case 'workspaces':
        return <Workspaces />;
      case 'resources':
        return <Resources />;
      case 'locations':
        return <Locations />;
      case 'customers':
        return <Customers />;
      case 'reports':
        return <Reports />;
      case 'integrations-most-popular':
        return <Integrations category="most-popular" />;
      case 'integrations-calendars':
        return <Integrations category="calendars" />;
      case 'integrations-video':
        return <Integrations category="video-conferencing" />;
      case 'integrations-crm':
        return <Integrations category="crm-sales" />;
      case 'integrations-payments':
        return <Integrations category="payments" />;
      case 'integrations-sms':
        return <Integrations category="sms" />;
      case 'integrations-analytics':
        return <Integrations category="analytics" />;
      case 'integrations-connectors':
        return <Integrations category="connectors" />;
      case 'integrations-support':
        return <Integrations category="support" />;
      case 'integrations-accounting':
        return <Integrations category="accounting" />;
      case 'customizations':
        return <Customizations />;
      case 'custom-domain':
        return <Customizations initialSection="custom-domain" />;
      case 'custom-in-product':
        return <Customizations initialSection="in-product" />;
      case 'custom-labels':
        return <Customizations initialSection="labels" />;
      case 'custom-roles':
        return <Customizations initialSection="roles" />;
      case 'data-privacy':
        return <DataAdmin initialSection="privacy" />;
      case 'data-domain-auth':
        return <DataAdmin initialSection="domain-auth" />;
      case 'data-export':
        return <DataAdmin initialSection="export" />;
      default:
        return <BasicInformation />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/dashboard')}
              className="mb-3 gap-2"
            >
              <ArrowLeft size={16} />
              Admin Center
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Organization Section */}
            <div>
              <button
                onClick={() => setOrganizationExpanded(!organizationExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>Organization</span>
                {organizationExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {organizationExpanded && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => setCurrentSection('basic-info')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'basic-info' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Basic Information
                  </button>
                  <button
                    onClick={() => setCurrentSection('business-hours')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'business-hours' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Business Hours
                  </button>
                  <button
                    onClick={() => setCurrentSection('booking-page')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'booking-page' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Business Booking Page
                  </button>
                  <button
                    onClick={() => setCurrentSection('login-prefs')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'login-prefs' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Customer Login Preferences
                  </button>
                  <button
                    onClick={() => setCurrentSection('salespersons')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'salespersons' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Salespersons
                  </button>
                  <button
                    onClick={() => setCurrentSection('workflows')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'workflows' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Workflows
                  </button>
                </div>
              )}
            </div>

            {/* Modules Section */}
            <div>
              <button
                onClick={() => setModulesExpanded(!modulesExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>Modules</span>
                {modulesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {modulesExpanded && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => setCurrentSection('workspaces')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'workspaces' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Workspaces
                  </button>
                  <button
                    onClick={() => setCurrentSection('resources')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'resources' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Resources
                  </button>
                  <button
                    onClick={() => setCurrentSection('locations')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'locations' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    In-person Locations
                  </button>
                  <button
                    onClick={() => setCurrentSection('customers')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'customers' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Customers
                  </button>
                  <button
                    onClick={() => setCurrentSection('reports')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'reports' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Reports
                  </button>
                </div>
              )}
            </div>

            {/* Integrations Section */}
            <div>
              <button
                onClick={() => setIntegrationsExpanded(!integrationsExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>Integrations</span>
                {integrationsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {integrationsExpanded && (
                <div className="ml-3 mt-1 space-y-1">
                  {/* Most Popular */}
                  <button
                    onClick={() => setCurrentSection('integrations-most-popular')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-most-popular' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Most Popular
                  </button>

                  {/* Calendars */}
                  <button
                    onClick={() => setCurrentSection('integrations-calendars')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-calendars' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Calendars
                  </button>

                  {/* Video Conferencing */}
                  <button
                    onClick={() => setCurrentSection('integrations-video')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-video' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Video Conferencing
                  </button>

                  {/* CRM & Sales */}
                  <button
                    onClick={() => setCurrentSection('integrations-crm')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-crm' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    CRM & Sales
                  </button>

                  {/* Payments */}
                  <button
                    onClick={() => setCurrentSection('integrations-payments')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-payments' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Payments
                  </button>

                  {/* SMS */}
                  <button
                    onClick={() => setCurrentSection('integrations-sms')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-sms' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    SMS
                  </button>

                  {/* Analytics */}
                  <button
                    onClick={() => setCurrentSection('integrations-analytics')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-analytics' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Analytics
                  </button>

                  {/* Connectors */}
                  <button
                    onClick={() => setCurrentSection('integrations-connectors')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-connectors' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Connectors
                  </button>

                  {/* Support */}
                  <button
                    onClick={() => setCurrentSection('integrations-support')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-support' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Support
                  </button>

                  {/* Accounting & Invoices */}
                  <button
                    onClick={() => setCurrentSection('integrations-accounting')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'integrations-accounting' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Accounting & Invoices
                  </button>
                </div>
              )}
            </div>

            {/* Product Customizations Section */}
            <div>
              <button
                onClick={() => setCustomizationsExpanded(!customizationsExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>Product Customizations</span>
                {customizationsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {customizationsExpanded && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => setCurrentSection('custom-domain')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'custom-domain' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Custom Domain
                  </button>

                  <button
                    onClick={() => setCurrentSection('custom-in-product')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'custom-in-product' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    In-product Notifications
                  </button>

                  <button
                    onClick={() => setCurrentSection('custom-labels')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'custom-labels' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Custom Labels
                  </button>

                  <button
                    onClick={() => setCurrentSection('custom-roles')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'custom-roles' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Roles and Permissions
                  </button>
                </div>
              )}
            </div>

            {/* Data Administration Section */}
            <div>
              <button
                onClick={() => setDataAdminExpanded(!dataAdminExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>Data Administration</span>
                {dataAdminExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {dataAdminExpanded && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => setCurrentSection('data-privacy')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'data-privacy' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Privacy and Security
                  </button>

                  <button
                    onClick={() => setCurrentSection('data-domain-auth')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'data-domain-auth' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Domain Authentication
                  </button>

                  <button
                    onClick={() => setCurrentSection('data-export')}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      currentSection === 'data-export' 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
