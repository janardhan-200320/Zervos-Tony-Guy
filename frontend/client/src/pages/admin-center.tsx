import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types
interface SettingCard {
  icon: any;
  title: string;
  options: string[];
}

interface SettingSection {
  title: string;
  cards: SettingCard[];
}
import { 
  ArrowLeft, 
  Search, 
  Building2, 
  Clock, 
  Globe, 
  Folder, 
  Video, 
  Link2, 
  Bell, 
  Tag, 
  Shield, 
  ChevronRight,
  DollarSign,
  CreditCard,
  Receipt,
  Database,
  FileText,
  Settings,
  Smartphone,
  MessageSquare,
  Calculator
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminCenterPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const sections: SettingSection[] = [
    {
      title: 'Organization',
      cards: [
        {
          icon: Building2,
          title: 'Basic Information',
          options: ['Company name', 'Industry type', 'Contact details', 'Logo & branding']
        },
        {
          icon: Clock,
          title: 'Business Hours',
          options: ['Working days', 'Operating hours', 'Timezone settings', 'Holiday calendar']
        },
        {
          icon: Globe,
          title: 'Business Booking Page',
          options: ['Public page URL', 'Page customization', 'SEO settings', 'Social media links']
        }
      ]
    },
    {
      title: 'Branch Operations',
      cards: [
        {
          icon: Building2,
          title: 'Branch Management',
          options: ['Add new branches', 'Switch between branches', 'Branch-specific data', 'Branch statistics', 'Branch settings']
        }
      ]
    },
    {
      title: 'Financial Management',
      cards: [
        {
          icon: DollarSign,
          title: 'Payment Settings',
          options: ['Payment gateways', 'Currency settings', 'Tax configuration', 'Invoice numbering']
        },
        {
          icon: CreditCard,
          title: 'POS Configuration',
          options: ['Receipt templates', 'Discount rules', 'Default tax rates', 'Payment methods']
        },
        {
          icon: Calculator,
          title: 'Accounting Integration',
          options: ['Chart of accounts', 'Expense categories', 'Income categories', 'Financial reports']
        }
      ]
    },
    {
      title: 'Customer Management',
      cards: [
        {
          icon: Database,
          title: 'Data Management',
          options: ['Data backup', 'Data export', 'Import customers', 'Bulk operations']
        },
        {
          icon: Receipt,
          title: 'Loyalty Programs',
          options: ['Points system', 'Membership tiers', 'Reward rules', 'Expiry settings']
        }
      ]
    },
    {
      title: 'Integrations',
      cards: [
        {
          icon: Video,
          title: 'Video Conferencing',
          options: ['Zoom', 'Microsoft Teams', 'Google Meet', 'Custom video links']
        },
        {
          icon: MessageSquare,
          title: 'Communication Channels',
          options: ['WhatsApp Business API', 'SMS gateway', 'Email service', 'Push notifications']
        },
        {
          icon: Smartphone,
          title: 'Mobile App Settings',
          options: ['App branding', 'Push notification config', 'App permissions', 'Mobile features']
        }
      ]
    },
    {
      title: 'Product Customizations',
      cards: [
        {
          icon: Link2,
          title: 'Custom Domain',
          options: ['Domain setup', 'SSL certificate', 'DNS configuration', 'Subdomain settings']
        },
        {
          icon: Bell,
          title: 'In-product Notifications',
          options: ['Email templates', 'SMS notifications', 'Push notifications', 'Notification rules']
        },
        {
          icon: Tag,
          title: 'Custom Labels',
          options: ['Service labels', 'Team member labels', 'Status labels', 'Custom fields']
        },
        {
          icon: Shield,
          title: 'Roles and Permissions',
          options: ['User roles', 'Access levels', 'Permission groups', 'Custom roles']
        }
      ]
    },
    {
      title: 'System & Security',
      cards: [
        {
          icon: Settings,
          title: 'System Preferences',
          options: ['Language & region', 'Date & time format', 'Number format', 'Default values']
        },
        {
          icon: FileText,
          title: 'Audit & Logs',
          options: ['Activity logs', 'User actions', 'System events', 'Data changes']
        },
        {
          icon: Database,
          title: 'Backup & Restore',
          options: ['Automatic backups', 'Manual backup', 'Restore data', 'Export all data']
        }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    cards: section.cards.filter(card => 
      searchQuery === '' || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.options.some(option => option.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(section => section.cards.length > 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft size={18} />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Center</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your booking system settings and configurations</p>
              </div>
            </div>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
              <p className="text-gray-600">Try searching with different keywords</p>
            </div>
          ) : (
            filteredSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{section.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.cards.map((card, cardIndex) => {
                    const Icon = card.icon;
                    const handleCardClick = () => {
                      if (card.title === 'Branch Management') {
                        setLocation('/dashboard/admin/branches');
                      } else if (card.title === 'Custom Labels') {
                        setLocation('/dashboard/admin/custom-labels');
                      }
                    };
                    return (
                      <div 
                        key={cardIndex}
                        onClick={handleCardClick}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                              <Icon size={24} className="text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">{card.title}</h3>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <ul className="space-y-2">
                          {card.options.map((option, optionIndex) => (
                            <li 
                              key={optionIndex}
                              className="text-sm text-gray-600 hover:text-purple-600 transition-colors flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-purple-400 transition-colors"></div>
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
